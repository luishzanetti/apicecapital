-- ════════════════════════════════════════════════════════════════════
-- 022 · Apex AI v3.2 — Smart Hedge Cycling support
-- ════════════════════════════════════════════════════════════════════
--
-- Pairs with `apex-ai-bot-tick` v3.2 edge function. Adds:
--   1. RPC apex_ai_apply_cycle_pnl — atomic portfolio total_pnl + win/loss
--      counter update. Replaces the leaky read-modify-write pattern in v2.
--   2. RPC apex_ai_reset_stuck_simulations — closes simulated positions
--      that have been open >24h without ever closing (the "v2 paralysis"
--      state) so the bot can reboot cleanly with v3.2 cycling logic.
--
-- Both are SECURITY DEFINER and only callable by the service_role.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Atomic cycle PnL apply ──────────────────────────────────────
-- Uses out_* names for OUT params + table alias `p` so column refs are
-- never ambiguous against PL/pgSQL OUT variables.
CREATE OR REPLACE FUNCTION public.apex_ai_apply_cycle_pnl(
  p_portfolio_id UUID,
  p_pnl_delta NUMERIC
)
RETURNS TABLE (out_total_pnl NUMERIC, out_win_count INT, out_loss_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.apex_ai_portfolios AS p
  SET
    total_pnl = COALESCE(p.total_pnl, 0) + p_pnl_delta,
    win_count = COALESCE(p.win_count, 0) + CASE WHEN p_pnl_delta > 0 THEN 1 ELSE 0 END,
    loss_count = COALESCE(p.loss_count, 0) + CASE WHEN p_pnl_delta < 0 THEN 1 ELSE 0 END,
    drawdown_high_water_mark = GREATEST(
      COALESCE(p.drawdown_high_water_mark, p.capital_usdt),
      p.capital_usdt + COALESCE(p.total_pnl, 0) + p_pnl_delta
    ),
    updated_at = NOW()
  WHERE p.id = p_portfolio_id;

  RETURN QUERY
    SELECT p.total_pnl, p.win_count, p.loss_count
    FROM public.apex_ai_portfolios p
    WHERE p.id = p_portfolio_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apex_ai_apply_cycle_pnl FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apex_ai_apply_cycle_pnl TO service_role;

COMMENT ON FUNCTION public.apex_ai_apply_cycle_pnl IS
  'Apex AI v3.2 — atomic apply of net cycle PnL to portfolio aggregates. Called by smart hedge cycling.';

-- ─── 2. Cleanup of stuck simulated positions ────────────────────────
-- Marks as `closed` any SIM-mode position that has been open without
-- realized PnL movement for > p_min_age_hours hours. Creates synthetic
-- trade records reflecting the unrealized PnL at cleanup time so the
-- aggregates stay consistent. Returns counts.
--
-- Uses out_* names for OUT params so they never collide with table
-- column names inside the function body.
CREATE OR REPLACE FUNCTION public.apex_ai_reset_stuck_simulations(
  p_portfolio_id UUID DEFAULT NULL,  -- NULL = all
  p_min_age_hours INT DEFAULT 24
)
RETURNS TABLE (
  out_portfolio_id UUID,
  out_positions_closed INT,
  out_total_pnl_realized NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r_portfolio_id UUID;
  v_inserted_trades INT;
  v_total_pnl NUMERIC;
BEGIN
  FOR r_portfolio_id IN
    SELECT DISTINCT pos.portfolio_id
    FROM public.apex_ai_positions pos
    JOIN public.apex_ai_portfolios pf ON pf.id = pos.portfolio_id
    WHERE pos.status = 'open'
      AND pos.exchange_position_id LIKE 'sim-%'
      AND pos.opened_at < NOW() - (p_min_age_hours || ' hours')::INTERVAL
      AND (p_portfolio_id IS NULL OR pos.portfolio_id = p_portfolio_id)
  LOOP
    -- Lock in the unrealized PnL BEFORE we mutate the rows.
    SELECT COALESCE(SUM(pos.unrealized_pnl), 0) INTO v_total_pnl
    FROM public.apex_ai_positions pos
    WHERE pos.portfolio_id = r_portfolio_id
      AND pos.status = 'open'
      AND pos.exchange_position_id LIKE 'sim-%'
      AND pos.opened_at < NOW() - (p_min_age_hours || ' hours')::INTERVAL;

    -- Insert synthetic trade records for all stuck SIM positions on this portfolio
    INSERT INTO public.apex_ai_trades (
      portfolio_id, position_id, user_id, symbol, side,
      entry_price, exit_price, size, leverage, pnl, fee_exchange, gas_fee, closed_at
    )
    SELECT
      pos.portfolio_id, pos.id, pos.user_id, pos.symbol, pos.side,
      pos.entry_price,
      COALESCE(pos.current_price, pos.entry_price),
      pos.size, pos.leverage,
      COALESCE(pos.unrealized_pnl, 0),
      ABS(COALESCE(pos.unrealized_pnl, 0)) * 0.0006,
      0,
      NOW()
    FROM public.apex_ai_positions pos
    WHERE pos.portfolio_id = r_portfolio_id
      AND pos.status = 'open'
      AND pos.exchange_position_id LIKE 'sim-%'
      AND pos.opened_at < NOW() - (p_min_age_hours || ' hours')::INTERVAL;

    GET DIAGNOSTICS v_inserted_trades = ROW_COUNT;

    -- Close the positions
    UPDATE public.apex_ai_positions
    SET
      status = 'closed',
      closed_at = NOW(),
      realized_pnl = COALESCE(unrealized_pnl, 0),
      unrealized_pnl = 0
    WHERE portfolio_id = r_portfolio_id
      AND status = 'open'
      AND exchange_position_id LIKE 'sim-%'
      AND opened_at < NOW() - (p_min_age_hours || ' hours')::INTERVAL;

    -- Apply aggregate PnL to portfolio
    PERFORM public.apex_ai_apply_cycle_pnl(r_portfolio_id, v_total_pnl);

    out_portfolio_id := r_portfolio_id;
    out_positions_closed := v_inserted_trades;
    out_total_pnl_realized := v_total_pnl;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apex_ai_reset_stuck_simulations FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apex_ai_reset_stuck_simulations TO service_role;

COMMENT ON FUNCTION public.apex_ai_reset_stuck_simulations IS
  'Apex AI v3.2 — close simulated positions stuck in v2 paralysis (>24h open, perfect hedge zero aggregate). Use once after deploying v3.2 to reboot stuck portfolios.';

-- ────────────────────────────────────────────────────────────────────
-- Verification
-- ────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_funcs INT;
BEGIN
  SELECT COUNT(*) INTO v_funcs
  FROM pg_proc
  WHERE proname IN ('apex_ai_apply_cycle_pnl', 'apex_ai_reset_stuck_simulations');

  RAISE NOTICE 'Apex AI v3.2 RPCs installed: % / 2', v_funcs;
END $$;
