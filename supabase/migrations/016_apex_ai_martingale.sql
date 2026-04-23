-- 016 · Apex AI — True Martingale DCA (CoinTech2u strategy) + never-close-at-loss
--
-- Per CEO directive 2026-04-23:
-- - Layer 1 and Layer 2: same base size (conservative start)
-- - Layer 3+: progressively doubles (1, 1, 2, 4, 8, 16, 32 × base)
-- - Bot NEVER closes at loss — only closes when blended avg produces profit
-- - Target short cycles (0.8-1.5% blended TP)
-- - Universe restricted to blue chips (BTC, ETH, BNB, SOL, XRP) — resistant to crashes
-- - AI adapts layer spacing in high volatility to protect capital
--
-- This replaces the "TP/SL on each layer" model with a "TP on blended avg only" model.
-- SL is NOT a hard stop — it's a warning threshold. If hit, bot opens next layer.
--
-- Reference: docs/projects/apex-ai/03-V2-MASTER-PLAN.md (updated)

-- ════════════════════════════════════════════════════════════════
-- 1. Update layer_config defaults per risk profile
-- ════════════════════════════════════════════════════════════════

-- Conservative: 3 layers, tight spacing, tight TP
-- Balanced: 5 layers, medium spacing, standard TP
-- Aggressive: 7 layers, wide spacing, deeper DCA
UPDATE public.apex_ai_layer_config c
SET
  max_layers = CASE p.risk_profile
    WHEN 'conservative' THEN 3
    WHEN 'balanced' THEN 5
    WHEN 'aggressive' THEN 7
    ELSE 5
  END,
  layer_spacing_atr = CASE p.risk_profile
    WHEN 'conservative' THEN 0.8
    WHEN 'balanced' THEN 1.0
    WHEN 'aggressive' THEN 1.2
    ELSE 1.0
  END,
  -- NOTE: layer_size_multiplier is now IGNORED — sizing follows Martingale formula
  -- in apex_ai_martingale_layer_size() function below.
  layer_size_multiplier = 2.0,
  take_profit_pct = CASE p.risk_profile
    WHEN 'conservative' THEN 0.8  -- 0.8% blended TP
    WHEN 'balanced' THEN 1.2      -- 1.2% blended TP
    WHEN 'aggressive' THEN 1.5    -- 1.5% blended TP
    ELSE 1.2
  END,
  max_allocation_pct = CASE p.risk_profile
    WHEN 'conservative' THEN 20.0
    WHEN 'balanced' THEN 30.0
    WHEN 'aggressive' THEN 45.0
    ELSE 30.0
  END
FROM public.apex_ai_portfolios p
WHERE c.portfolio_id = p.id;

-- ════════════════════════════════════════════════════════════════
-- 2. Martingale sizing function: layer N size in USDT
-- ════════════════════════════════════════════════════════════════
--
-- Formula:
--   Layer 1: base
--   Layer 2: base
--   Layer 3+: base * 2^(N-2)   →   3=2, 4=4, 5=8, 6=16, 7=32, 8=64, 9=128, 10=256
--
-- Max total capital for N layers: 1 + 1 + (2 + 4 + ... + 2^(N-2)) = 1 + (2^(N-1))
--   3 layers: 1+1+2 = 4× base
--   5 layers: 1+1+2+4+8 = 16× base
--   7 layers: 1+1+2+4+8+16+32 = 64× base
--
-- So: base = max_allocation_usdt / (1 + 2^(max_layers - 1))

CREATE OR REPLACE FUNCTION public.apex_ai_martingale_layer_size(
  p_layer_index INT,
  p_base_size NUMERIC
) RETURNS NUMERIC
LANGUAGE SQL IMMUTABLE AS $$
  SELECT CASE
    WHEN p_layer_index <= 0 THEN 0
    WHEN p_layer_index <= 2 THEN p_base_size
    ELSE p_base_size * POWER(2, p_layer_index - 2)
  END;
$$;

COMMENT ON FUNCTION public.apex_ai_martingale_layer_size IS
  'Apex AI — returns size in USDT for layer N given base_size. L1/L2 = base, L3+ doubles.';

-- Helper: compute base_size for a portfolio/symbol given its max_allocation
CREATE OR REPLACE FUNCTION public.apex_ai_martingale_base_size(
  p_max_allocation_usdt NUMERIC,
  p_max_layers INT
) RETURNS NUMERIC
LANGUAGE SQL IMMUTABLE AS $$
  SELECT p_max_allocation_usdt / (1 + POWER(2, p_max_layers - 1));
$$;

COMMENT ON FUNCTION public.apex_ai_martingale_base_size IS
  'Apex AI — base_size = total_allocation / (1 + 2^(max_layers - 1)). Ensures full cycle stays within cap.';

-- ════════════════════════════════════════════════════════════════
-- 3. Refactor apex_ai_open_next_layer for Martingale + never-close-at-loss
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.apex_ai_open_next_layer(
  p_portfolio_id UUID,
  p_symbol TEXT,
  p_side TEXT,
  p_current_price NUMERIC,
  p_current_atr NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_portfolio RECORD;
  v_parent_group UUID;
  v_current_layer_count INT;
  v_last_layer RECORD;
  v_new_layer_index INT;
  v_base_size_usdt NUMERIC;
  v_layer_size_usdt NUMERIC;
  v_new_position_id UUID;
  v_max_allocation_usdt NUMERIC;
  v_threshold_price NUMERIC;
  v_atr_effective NUMERIC;
  v_volatility_regime TEXT;
  v_regime_ready BOOLEAN := FALSE;
BEGIN
  -- Load config + portfolio
  SELECT * INTO v_config FROM public.apex_ai_layer_config WHERE portfolio_id = p_portfolio_id;
  SELECT * INTO v_portfolio FROM public.apex_ai_portfolios WHERE id = p_portfolio_id;

  IF v_config IS NULL OR v_portfolio IS NULL THEN
    RETURN jsonb_build_object('opened', false, 'reason', 'config_not_found');
  END IF;

  -- Load volatility regime for AI-adapted spacing
  SELECT volatility_regime INTO v_volatility_regime
  FROM public.apex_ai_regime_state
  WHERE symbol = p_symbol;

  IF FOUND THEN v_regime_ready := TRUE; END IF;

  -- Adapt layer spacing to current volatility:
  -- - High vol: wider spacing (1.5× base) to avoid being stopped out
  -- - Low vol: tighter spacing (0.8× base) to accelerate ciclo
  v_atr_effective := p_current_atr * v_config.layer_spacing_atr *
    CASE v_volatility_regime
      WHEN 'high' THEN 1.5
      WHEN 'medium' THEN 1.0
      WHEN 'low' THEN 0.8
      ELSE 1.0
    END;

  -- Count existing open layers for this symbol/side
  SELECT
    COUNT(*) AS cnt,
    COALESCE(MAX(layer_index), 0) AS max_idx,
    MAX(parent_position_group) AS group_id
  INTO v_current_layer_count, v_new_layer_index, v_parent_group
  FROM public.apex_ai_positions
  WHERE portfolio_id = p_portfolio_id
    AND symbol = p_symbol
    AND side = p_side::apex_ai_position_side
    AND status = 'open';

  -- Beyond max — NEVER opens more (hard cap to protect capital)
  IF v_current_layer_count >= v_config.max_layers THEN
    RETURN jsonb_build_object(
      'opened', false,
      'reason', 'max_layers_reached',
      'current', v_current_layer_count,
      'max', v_config.max_layers
    );
  END IF;

  v_new_layer_index := v_new_layer_index + 1;

  -- For layers 2+: check threshold is breached
  IF v_current_layer_count > 0 THEN
    SELECT * INTO v_last_layer
    FROM public.apex_ai_positions
    WHERE portfolio_id = p_portfolio_id
      AND symbol = p_symbol
      AND side = p_side::apex_ai_position_side
      AND status = 'open'
    ORDER BY layer_index DESC
    LIMIT 1;

    IF p_side = 'long' THEN
      v_threshold_price := v_last_layer.entry_price - v_atr_effective;
      IF p_current_price > v_threshold_price THEN
        RETURN jsonb_build_object(
          'opened', false,
          'reason', 'threshold_not_breached',
          'current_price', p_current_price,
          'threshold', v_threshold_price,
          'atr_effective', v_atr_effective,
          'volatility_regime', v_volatility_regime
        );
      END IF;
    ELSE -- short
      v_threshold_price := v_last_layer.entry_price + v_atr_effective;
      IF p_current_price < v_threshold_price THEN
        RETURN jsonb_build_object(
          'opened', false,
          'reason', 'threshold_not_breached',
          'current_price', p_current_price,
          'threshold', v_threshold_price,
          'atr_effective', v_atr_effective,
          'volatility_regime', v_volatility_regime
        );
      END IF;
    END IF;
  END IF;

  -- Compute size via Martingale formula
  v_max_allocation_usdt := v_portfolio.capital_usdt * v_config.max_allocation_pct / 100.0;
  v_base_size_usdt := public.apex_ai_martingale_base_size(
    v_max_allocation_usdt,
    v_config.max_layers
  );
  v_layer_size_usdt := public.apex_ai_martingale_layer_size(
    v_new_layer_index,
    v_base_size_usdt
  );

  -- Generate parent group on first layer
  IF v_parent_group IS NULL THEN
    v_parent_group := gen_random_uuid();
  END IF;

  -- Insert new layer
  INSERT INTO public.apex_ai_positions (
    portfolio_id, user_id, symbol, side,
    entry_price, current_price, size, leverage,
    stop_loss_price, take_profit_price, status,
    exchange_position_id, opened_at,
    layer_index, parent_position_group, strategy_tag,
    atr_at_entry
  ) VALUES (
    p_portfolio_id, v_portfolio.user_id, p_symbol, p_side::apex_ai_position_side,
    p_current_price, p_current_price,
    v_layer_size_usdt / p_current_price,
    v_portfolio.max_leverage,
    -- NO hard SL — Martingale strategy doesn't use stop-loss per layer
    NULL,
    -- Per-layer TP tracks its own entry (used only if aggregate strategy fails)
    CASE WHEN p_side = 'long'
         THEN p_current_price * (1 + v_config.take_profit_pct / 100)
         ELSE p_current_price * (1 - v_config.take_profit_pct / 100) END,
    'open'::apex_ai_position_status,
    'sim-layer-' || gen_random_uuid()::text,
    NOW(),
    v_new_layer_index,
    v_parent_group,
    'grid_dca',
    p_current_atr
  ) RETURNING id INTO v_new_position_id;

  -- Log strategy event
  INSERT INTO public.apex_ai_strategy_events
    (portfolio_id, event_type, symbol, to_value, rationale, payload_json)
  VALUES (
    p_portfolio_id, 'layer_opened', p_symbol, v_new_layer_index::text,
    CASE
      WHEN v_new_layer_index = 1 THEN
        'Layer 1 opened — entry at ' || ROUND(p_current_price::numeric, 4) || '. Base size ' || ROUND(v_layer_size_usdt::numeric, 2) || ' USDT.'
      WHEN v_new_layer_index = 2 THEN
        'Layer 2 opened — same size as L1 (' || ROUND(v_layer_size_usdt::numeric, 2) || ' USDT). Martingale protection engaged.'
      ELSE
        'Layer ' || v_new_layer_index || ' opened — size doubled to ' || ROUND(v_layer_size_usdt::numeric, 2) || ' USDT (martingale). Market moved ' || ROUND((v_atr_effective)::numeric, 4) || ' against L' || (v_new_layer_index-1) || '.'
    END,
    jsonb_build_object(
      'layer_index', v_new_layer_index,
      'entry_price', p_current_price,
      'size_usdt', v_layer_size_usdt,
      'size_units', v_layer_size_usdt / p_current_price,
      'base_size', v_base_size_usdt,
      'atr', p_current_atr,
      'atr_effective', v_atr_effective,
      'volatility_regime', v_volatility_regime,
      'side', p_side
    )
  );

  RETURN jsonb_build_object(
    'opened', true,
    'position_id', v_new_position_id,
    'layer_index', v_new_layer_index,
    'entry_price', p_current_price,
    'size_usdt', v_layer_size_usdt,
    'base_size', v_base_size_usdt,
    'volatility_regime', v_volatility_regime
  );
END;
$$;

-- ════════════════════════════════════════════════════════════════
-- 4. Refactor apex_ai_close_position_group — NEVER close at loss
-- ════════════════════════════════════════════════════════════════

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
BEGIN
  -- Metadata
  SELECT user_id, portfolio_id, symbol, side
  INTO v_user_id, v_portfolio_id, v_symbol, v_side
  FROM public.apex_ai_positions
  WHERE parent_position_group = p_parent_group AND status = 'open'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('closed', 0, 'reason', 'group_not_found');
  END IF;

  -- Pre-compute aggregate PnL to decide whether to close
  SELECT
    SUM(CASE WHEN side = 'long' THEN (p_exit_price - entry_price) * size
             ELSE (entry_price - p_exit_price) * size END),
    SUM(size),
    SUM(entry_price * size)
  INTO v_total_pnl, v_total_size, v_weighted_entry
  FROM public.apex_ai_positions
  WHERE parent_position_group = p_parent_group AND status = 'open';

  v_avg_entry := CASE WHEN v_total_size > 0 THEN v_weighted_entry / v_total_size ELSE 0 END;

  -- ★ CRITICAL RULE ★
  -- Martingale strategy: NEVER close at loss. Only close when aggregate PnL > 0.
  -- If PnL is negative, the tick loop must instead consider opening next layer
  -- (if threshold breached) or simply wait.
  IF v_total_pnl <= 0 AND p_trigger != 'kill_switch' THEN
    INSERT INTO public.apex_ai_strategy_events
      (portfolio_id, event_type, symbol, rationale, payload_json)
    VALUES (
      v_portfolio_id, 'close_skipped_loss', v_symbol,
      'Close skipped — strategy never closes at loss (martingale). Aggregate PnL: ' || ROUND(v_total_pnl::numeric, 2) || '. Waiting for reversal or next DCA layer.',
      jsonb_build_object(
        'parent_group', p_parent_group,
        'total_pnl', v_total_pnl,
        'avg_entry', v_avg_entry,
        'current_price', p_exit_price,
        'layer_count', (SELECT COUNT(*) FROM public.apex_ai_positions
                        WHERE parent_position_group = p_parent_group AND status = 'open')
      )
    );

    RETURN jsonb_build_object(
      'closed', 0,
      'reason', 'never_close_at_loss',
      'aggregate_pnl', v_total_pnl,
      'avg_entry', v_avg_entry
    );
  END IF;

  -- Profitable (or kill switch) — proceed with close
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

  -- Charge 10% fee on aggregate profit
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
  END IF;

  -- Log cycle completion
  INSERT INTO public.apex_ai_strategy_events
    (portfolio_id, event_type, symbol, rationale, payload_json)
  VALUES (
    v_portfolio_id, 'cycle_completed', v_symbol,
    'Cycle completed: closed ' || v_close_count || ' layers at blended TP. Profit ' || ROUND(v_total_pnl::numeric, 2) || ' USDT. Ready to start new cycle.',
    jsonb_build_object(
      'parent_group', p_parent_group,
      'layers_closed', v_close_count,
      'exit_price', p_exit_price,
      'avg_entry', v_avg_entry,
      'total_pnl', v_total_pnl,
      'trigger', p_trigger
    )
  );

  -- Update portfolio stats
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
    'trigger', p_trigger
  );
END;
$$;

-- ════════════════════════════════════════════════════════════════
-- 5. Restrict universe — default to blue chips (strong crypto)
-- ════════════════════════════════════════════════════════════════
--
-- Update recommended symbols in strategy matrix. This doesn't force users
-- but sets the defaults: BTC, ETH, BNB (core), SOL, XRP (balanced).
-- Aggressive adds AVAX + LINK (DOGE removed — too meme-driven for
-- "never close at loss" strategy, risks black-swan tail).

COMMENT ON TABLE public.apex_ai_symbols IS
  'Apex AI — symbols per portfolio. Recommended defaults: BTC/ETH/BNB (conservative), +SOL/XRP (balanced), +AVAX/LINK (aggressive). Meme coins excluded by design.';

-- ════════════════════════════════════════════════════════════════
-- 6. Verification
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_base NUMERIC;
  v_l1 NUMERIC;
  v_l3 NUMERIC;
  v_l5 NUMERIC;
BEGIN
  v_base := public.apex_ai_martingale_base_size(1000, 5);  -- max $1000, 5 layers
  v_l1 := public.apex_ai_martingale_layer_size(1, v_base);
  v_l3 := public.apex_ai_martingale_layer_size(3, v_base);
  v_l5 := public.apex_ai_martingale_layer_size(5, v_base);
  RAISE NOTICE 'Martingale formula check — allocation=1000, 5 layers: base=%.2f, L1=%.2f, L3=%.2f, L5=%.2f (should be 62.50, 62.50, 125.00, 500.00)',
    v_base, v_l1, v_l3, v_l5;
END $$;
