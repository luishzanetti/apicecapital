-- 020 · Apex AI v3 — Multi-signal intelligence + adaptive regime params + Smart Reserve Protocol
--
-- Per CEO directive 2026-04-24 + apex-ai-backtest-v2.html blueprint.
--
-- Adds the v3 architecture in 3 sections:
--   1. Multi-signal regime_state (RSI 14, SMA 20/50/200, volume ratio)
--   2. Adaptive regime params (4 regimes × 5 params)
--   3. Smart Reserve Protocol (table + auto-contribution trigger + deploy RPCs)
--
-- Idempotent.

-- ════════════════════════════════════════════════════════════════
-- 1. Extend apex_ai_regime_state with multi-signal columns
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.apex_ai_regime_state
  ADD COLUMN IF NOT EXISTS rsi_14 NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS sma_20 NUMERIC(18, 8),
  ADD COLUMN IF NOT EXISTS sma_50 NUMERIC(18, 8),
  ADD COLUMN IF NOT EXISTS sma_200 NUMERIC(18, 8),
  ADD COLUMN IF NOT EXISTS volume_ratio NUMERIC(8, 4),
  ADD COLUMN IF NOT EXISTS regime_score NUMERIC(5, 2); -- 0-100 confidence in regime detection

COMMENT ON COLUMN public.apex_ai_regime_state.rsi_14 IS
  'RSI 14 — > 70 overbought (reduce TP), < 30 oversold (increase max layers)';
COMMENT ON COLUMN public.apex_ai_regime_state.sma_20 IS
  'SMA 20 — used for L1 filter (reject if close < sma_20 × 0.95)';
COMMENT ON COLUMN public.apex_ai_regime_state.volume_ratio IS
  'Current volume / 20-period avg volume — > 1.5 with price drop = real selling pressure';

-- NOTE: ALTER TYPE apex_ai_market_regime ADD VALUE 'high_volatility' must be
-- run as a standalone committed statement BEFORE this migration. Postgres
-- prohibits using a new enum value within the same transaction it was added.
-- Run separately:
--   ALTER TYPE apex_ai_market_regime ADD VALUE IF NOT EXISTS 'high_volatility';

-- ════════════════════════════════════════════════════════════════
-- 2. Adaptive regime params table
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_regime_params (
  regime apex_ai_market_regime PRIMARY KEY,
  tp_min_pct NUMERIC(5, 2) NOT NULL,
  tp_max_pct NUMERIC(5, 2) NOT NULL,
  spacing_atr_multiplier NUMERIC(5, 2) NOT NULL,
  max_layers INT NOT NULL,
  cb_tolerance_pct NUMERIC(5, 2) NOT NULL,
  l1_action TEXT NOT NULL CHECK (l1_action IN ('open', 'filter', 'block', 'selective')),
  description TEXT
);

COMMENT ON TABLE public.apex_ai_regime_params IS
  'Apex AI v3 — adaptive parameters per detected market regime. Per backtest v2 blueprint.';

-- Seed the 4 regimes with default values from backtest (CEO-validated)
INSERT INTO public.apex_ai_regime_params (regime, tp_min_pct, tp_max_pct, spacing_atr_multiplier, max_layers, cb_tolerance_pct, l1_action, description)
VALUES
  ('bull_trending'::apex_ai_market_regime, 1.0, 1.5, 0.8, 7, 25.0, 'open', 'Bull market: tight TP, accelerate cycles, more layers'),
  ('sideways'::apex_ai_market_regime, 0.8, 1.2, 1.0, 8, 30.0, 'filter', 'Sideways: full hedge optimal, max layers, neutral spacing'),
  ('bear_trending'::apex_ai_market_regime, 0.6, 0.8, 1.3, 5, 20.0, 'block', 'Bear: short cycles, wider spacing, fewer layers, no L1 longs'),
  ('high_volatility'::apex_ai_market_regime, 1.5, 2.0, 1.8, 4, 40.0, 'selective', 'High vol: protect capital with very wide spacing + fewer layers'),
  ('unknown'::apex_ai_market_regime, 0.8, 1.2, 1.0, 5, 30.0, 'filter', 'Default fallback when regime undetermined')
ON CONFLICT (regime) DO UPDATE SET
  tp_min_pct = EXCLUDED.tp_min_pct,
  tp_max_pct = EXCLUDED.tp_max_pct,
  spacing_atr_multiplier = EXCLUDED.spacing_atr_multiplier,
  max_layers = EXCLUDED.max_layers,
  cb_tolerance_pct = EXCLUDED.cb_tolerance_pct,
  l1_action = EXCLUDED.l1_action,
  description = EXCLUDED.description;

-- Public read so any authenticated user can inspect regime params
ALTER TABLE public.apex_ai_regime_params ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "apex_ai_regime_params_read_all" ON public.apex_ai_regime_params
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- 3. Smart Reserve Protocol (SRP)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_reserve_fund (
  portfolio_id UUID PRIMARY KEY REFERENCES public.apex_ai_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_usdt NUMERIC(18, 8) NOT NULL DEFAULT 0 CHECK (balance_usdt >= 0),
  lifetime_contributions NUMERIC(18, 8) NOT NULL DEFAULT 0,
  lifetime_deploys NUMERIC(18, 8) NOT NULL DEFAULT 0,
  contribution_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.0, -- % of each trade profit goes to reserve
  consecutive_positive_days INT NOT NULL DEFAULT 0,
  last_consistency_bonus_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apex_ai_reserve_fund_user_idx
  ON public.apex_ai_reserve_fund(user_id);

ALTER TABLE public.apex_ai_reserve_fund ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "apex_ai_reserve_fund_owner" ON public.apex_ai_reserve_fund
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.apex_ai_reserve_fund IS
  'Apex AI v3 — Smart Reserve Protocol fund per portfolio. Auto-contributions from profits + 4 deploy mechanisms.';

-- Reserve fund event log (immutable audit trail)
CREATE TABLE IF NOT EXISTS public.apex_ai_reserve_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.apex_ai_portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'contribution',         -- 10% of profit added
    'protection_deploy',    -- liquidation risk → inject capital
    'strategic_close',      -- old cycle force-close, reserve covers loss
    'emergency_layer',      -- max layers reached, reserve adds extra layer
    'consistency_bonus'     -- 90 positive days → 20% to user
  )),
  amount_usdt NUMERIC(18, 8) NOT NULL,
  related_trade_id UUID REFERENCES public.apex_ai_trades(id) ON DELETE SET NULL,
  related_position_id UUID REFERENCES public.apex_ai_positions(id) ON DELETE SET NULL,
  rationale TEXT,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apex_ai_reserve_events_portfolio_idx
  ON public.apex_ai_reserve_events(portfolio_id, created_at DESC);

ALTER TABLE public.apex_ai_reserve_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "apex_ai_reserve_events_owner_select" ON public.apex_ai_reserve_events
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill: ensure all existing portfolios have a reserve fund row
INSERT INTO public.apex_ai_reserve_fund (portfolio_id, user_id, contribution_pct)
SELECT p.id, p.user_id, 10.0
FROM public.apex_ai_portfolios p
ON CONFLICT (portfolio_id) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- 4. RPC: contribute_to_reserve (called after profitable cycle close)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.apex_ai_reserve_contribute(
  p_portfolio_id UUID,
  p_user_id UUID,
  p_profit_usdt NUMERIC,
  p_trade_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fund RECORD;
  v_contribution NUMERIC;
BEGIN
  IF p_profit_usdt <= 0 THEN
    RETURN jsonb_build_object('contributed', false, 'reason', 'no_profit');
  END IF;

  -- Ensure fund row exists
  INSERT INTO public.apex_ai_reserve_fund (portfolio_id, user_id)
  VALUES (p_portfolio_id, p_user_id)
  ON CONFLICT (portfolio_id) DO NOTHING;

  SELECT * INTO v_fund
  FROM public.apex_ai_reserve_fund
  WHERE portfolio_id = p_portfolio_id
  FOR UPDATE;

  v_contribution := p_profit_usdt * (v_fund.contribution_pct / 100.0);

  UPDATE public.apex_ai_reserve_fund
  SET balance_usdt = balance_usdt + v_contribution,
      lifetime_contributions = lifetime_contributions + v_contribution,
      updated_at = NOW()
  WHERE portfolio_id = p_portfolio_id;

  INSERT INTO public.apex_ai_reserve_events
    (portfolio_id, user_id, event_type, amount_usdt, related_trade_id, rationale, payload_json)
  VALUES (
    p_portfolio_id, p_user_id, 'contribution', v_contribution, p_trade_id,
    ROUND((v_fund.contribution_pct)::numeric, 1) || '% of cycle profit (' || ROUND(p_profit_usdt::numeric, 2) || ' USDT) added to reserve',
    jsonb_build_object('profit', p_profit_usdt, 'pct', v_fund.contribution_pct)
  );

  RETURN jsonb_build_object(
    'contributed', true,
    'amount', v_contribution,
    'new_balance', v_fund.balance_usdt + v_contribution
  );
END;
$$;

COMMENT ON FUNCTION public.apex_ai_reserve_contribute IS
  'Apex AI v3 SRP — adds contribution_pct% of cycle profit to reserve fund. Called after each cycle_completed.';

-- ════════════════════════════════════════════════════════════════
-- 5. RPC: deploy_reserve_protection (liquidation risk inject)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.apex_ai_reserve_deploy_protection(
  p_portfolio_id UUID,
  p_user_id UUID,
  p_position_id UUID,
  p_position_cost_usdt NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance NUMERIC;
  v_deploy NUMERIC;
BEGIN
  SELECT balance_usdt INTO v_balance
  FROM public.apex_ai_reserve_fund
  WHERE portfolio_id = p_portfolio_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance <= 0 THEN
    RETURN jsonb_build_object('deployed', false, 'reason', 'reserve_empty');
  END IF;

  -- Deploy up to 5% of position cost, capped by available reserve
  v_deploy := LEAST(v_balance, p_position_cost_usdt * 0.05);
  IF v_deploy <= 0 THEN
    RETURN jsonb_build_object('deployed', false, 'reason', 'no_capital_to_deploy');
  END IF;

  UPDATE public.apex_ai_reserve_fund
  SET balance_usdt = balance_usdt - v_deploy,
      lifetime_deploys = lifetime_deploys + v_deploy,
      updated_at = NOW()
  WHERE portfolio_id = p_portfolio_id;

  INSERT INTO public.apex_ai_reserve_events
    (portfolio_id, user_id, event_type, amount_usdt, related_position_id, rationale, payload_json)
  VALUES (
    p_portfolio_id, p_user_id, 'protection_deploy', v_deploy, p_position_id,
    'Reserve deployed ' || ROUND(v_deploy::numeric, 2) || ' USDT to protect against liquidation (5% of position cost)',
    jsonb_build_object('position_cost', p_position_cost_usdt, 'deploy_pct', 5.0)
  );

  RETURN jsonb_build_object('deployed', true, 'amount', v_deploy, 'new_balance', v_balance - v_deploy);
END;
$$;

-- ════════════════════════════════════════════════════════════════
-- 6. Patch close_position_group to auto-contribute to reserve
-- ════════════════════════════════════════════════════════════════
-- The existing apex_ai_close_position_group already enforces never-close-at-loss.
-- We add a hook so that after profit > 0 close, reserve gets 10% automatically.
-- The fee RPC stays at 10% (separate from reserve contribution).
-- Net flow on profitable cycle: 100% gross → -10% fee → -10% reserve → 80% to user equity
-- (Note: this is on top of existing 10% gas fee, so it's a 20% total deduction
--  but 10% goes back to user via reserve protections.)

CREATE OR REPLACE FUNCTION public.apex_ai_close_position_group(
  p_parent_group UUID,
  p_exit_price NUMERIC,
  p_trigger TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_positions RECORD;
  v_total_pnl NUMERIC := 0;
  v_total_size NUMERIC := 0;
  v_weighted_entry NUMERIC := 0;
  v_avg_entry NUMERIC;
  v_user_id UUID;
  v_portfolio_id UUID;
  v_symbol TEXT;
  v_side apex_ai_position_side;
  v_close_count INT := 0;
  v_trade_id UUID;
  v_reserve_result JSONB;
BEGIN
  SELECT user_id, portfolio_id, symbol, side
  INTO v_user_id, v_portfolio_id, v_symbol, v_side
  FROM public.apex_ai_positions
  WHERE parent_position_group = p_parent_group AND status = 'open'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('closed', 0, 'reason', 'group_not_found');
  END IF;

  SELECT
    SUM(CASE WHEN side = 'long' THEN (p_exit_price - entry_price) * size
             ELSE (entry_price - p_exit_price) * size END),
    SUM(size),
    SUM(entry_price * size)
  INTO v_total_pnl, v_total_size, v_weighted_entry
  FROM public.apex_ai_positions
  WHERE parent_position_group = p_parent_group AND status = 'open';

  v_avg_entry := CASE WHEN v_total_size > 0 THEN v_weighted_entry / v_total_size ELSE 0 END;

  IF v_total_pnl <= 0 AND p_trigger != 'kill_switch' THEN
    INSERT INTO public.apex_ai_strategy_events
      (portfolio_id, event_type, symbol, rationale, payload_json)
    VALUES (
      v_portfolio_id, 'close_skipped_loss', v_symbol,
      'Close skipped — never-close-at-loss. Aggregate PnL: ' || ROUND(v_total_pnl::numeric, 2),
      jsonb_build_object('parent_group', p_parent_group, 'total_pnl', v_total_pnl, 'avg_entry', v_avg_entry, 'current_price', p_exit_price)
    );
    RETURN jsonb_build_object('closed', 0, 'reason', 'never_close_at_loss', 'aggregate_pnl', v_total_pnl, 'avg_entry', v_avg_entry);
  END IF;

  FOR v_positions IN
    SELECT id, entry_price, size, leverage, layer_index, side AS pos_side
    FROM public.apex_ai_positions
    WHERE parent_position_group = p_parent_group AND status = 'open'
    ORDER BY layer_index
  LOOP
    DECLARE v_layer_pnl NUMERIC;
    BEGIN
      v_layer_pnl := CASE
        WHEN v_positions.pos_side = 'long' THEN (p_exit_price - v_positions.entry_price) * v_positions.size
        ELSE (v_positions.entry_price - p_exit_price) * v_positions.size
      END;

      INSERT INTO public.apex_ai_trades (
        portfolio_id, position_id, user_id, symbol, side,
        entry_price, exit_price, size, leverage, pnl,
        fee_exchange, gas_fee, closed_at,
        layer_index, strategy_tag, parent_position_group
      ) VALUES (
        v_portfolio_id, v_positions.id, v_user_id, v_symbol, v_positions.pos_side,
        v_positions.entry_price, p_exit_price, v_positions.size, v_positions.leverage, v_layer_pnl,
        ABS(v_layer_pnl) * 0.0006, 0, NOW(),
        v_positions.layer_index, 'grid_dca', p_parent_group
      );

      UPDATE public.apex_ai_positions
      SET status = 'closed'::apex_ai_position_status,
          closed_at = NOW(),
          current_price = p_exit_price,
          unrealized_pnl = 0,
          realized_pnl = v_layer_pnl
      WHERE id = v_positions.id;

      v_close_count := v_close_count + 1;
    END;
  END LOOP;

  -- Charge 10% gas fee on aggregate profit
  IF v_total_pnl > 0 THEN
    SELECT id INTO v_trade_id
    FROM public.apex_ai_trades
    WHERE parent_position_group = p_parent_group
    ORDER BY closed_at DESC LIMIT 1;

    PERFORM public.apex_ai_charge_gas_fee(
      p_trade_id := v_trade_id,
      p_portfolio_id := v_portfolio_id,
      p_user_id := v_user_id,
      p_pnl := v_total_pnl,
      p_fee_rate_pct := 10.0
    );

    -- ★ NEW: Auto-contribute 10% of profit to reserve fund (SRP) ★
    v_reserve_result := public.apex_ai_reserve_contribute(
      p_portfolio_id := v_portfolio_id,
      p_user_id := v_user_id,
      p_profit_usdt := v_total_pnl,
      p_trade_id := v_trade_id
    );
  END IF;

  INSERT INTO public.apex_ai_strategy_events
    (portfolio_id, event_type, symbol, rationale, payload_json)
  VALUES (
    v_portfolio_id, 'cycle_completed', v_symbol,
    'Cycle completed: ' || v_close_count || ' layers closed at blended TP. Profit ' || ROUND(v_total_pnl::numeric, 2) || ' USDT. Reserve contribution: ' || COALESCE((v_reserve_result->>'amount')::numeric, 0) || ' USDT.',
    jsonb_build_object(
      'parent_group', p_parent_group, 'layers_closed', v_close_count,
      'exit_price', p_exit_price, 'avg_entry', v_avg_entry, 'total_pnl', v_total_pnl,
      'trigger', p_trigger, 'reserve_contribution', v_reserve_result
    )
  );

  UPDATE public.apex_ai_portfolios
  SET total_pnl = total_pnl + v_total_pnl,
      win_count = win_count + CASE WHEN v_total_pnl > 0 THEN 1 ELSE 0 END,
      loss_count = loss_count + CASE WHEN v_total_pnl <= 0 THEN 1 ELSE 0 END,
      drawdown_high_water_mark = GREATEST(
        COALESCE(drawdown_high_water_mark, capital_usdt),
        capital_usdt + total_pnl + v_total_pnl
      )
  WHERE id = v_portfolio_id;

  RETURN jsonb_build_object(
    'closed', v_close_count,
    'total_pnl', v_total_pnl,
    'avg_entry', v_avg_entry,
    'exit_price', p_exit_price,
    'trigger', p_trigger,
    'reserve_result', v_reserve_result
  );
END;
$$;

-- ════════════════════════════════════════════════════════════════
-- 7. Realtime publications for new tables
-- ════════════════════════════════════════════════════════════════

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.apex_ai_reserve_fund REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.apex_ai_reserve_events REPLICA IDENTITY FULL';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.apex_ai_reserve_fund;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.apex_ai_reserve_events;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- 8. Verification
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_regimes INT;
  v_funds INT;
BEGIN
  SELECT COUNT(*) INTO v_regimes FROM public.apex_ai_regime_params;
  SELECT COUNT(*) INTO v_funds FROM public.apex_ai_reserve_fund;
  RAISE NOTICE 'Apex AI v3 ready: % regime params, % reserve funds initialized', v_regimes, v_funds;
END $$;
