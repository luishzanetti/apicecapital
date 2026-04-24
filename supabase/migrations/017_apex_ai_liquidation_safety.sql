-- 017 · Apex AI — Liquidation safety: aguenta até 35% de queda sem liquidar
--
-- Per CEO directive 2026-04-23: "as ordens precisam aguentar até 35% de queda
-- do mercado sem liquidar".
--
-- Protection strategy (5 layers):
--
--   1. LEVERAGE CAP — max 2x default (aguenta ~50% drop per layer).
--      Aggressive tier opcionalmente 3x (aguenta ~33%, close to 35% threshold).
--
--   2. ALLOCATION RESERVE — max_allocation_pct reduzido drasticamente
--      para deixar 60-85% do capital como buffer de margem.
--
--   3. DRAWDOWN TOLERANCE — novo campo portfolio.drawdown_tolerance_pct
--      (default 35%). Bot monitora drawdown desde L1 e pausa se ultrapassar.
--
--   4. PRE-LAYER CHECK — apex_ai_open_next_layer rejeita layer nova se
--      a abertura fizer blended liq_price ficar acima do tolerance limit.
--
--   5. CIRCUIT BREAKER CATASTRÓFICO — bot-tick verifica se drawdown desde
--      L1 já ultrapassou tolerance. Se sim, pausa ANTES de qualquer novo tick.
--
-- Idempotent.

-- ════════════════════════════════════════════════════════════════
-- 1. Layer config — safer defaults
-- ════════════════════════════════════════════════════════════════

-- New column: how much drawdown the portfolio can tolerate before pausing.
ALTER TABLE public.apex_ai_layer_config
  ADD COLUMN IF NOT EXISTS drawdown_tolerance_pct NUMERIC(5, 2) NOT NULL DEFAULT 35.0
  CHECK (drawdown_tolerance_pct > 0 AND drawdown_tolerance_pct <= 90);

-- Apply safer defaults per risk profile:
-- - Leverage 2x for conservative/balanced (aguenta ~50%)
-- - Leverage 3x for aggressive (aguenta ~33%, close to 35%)
-- - Reduced allocation caps to leave ample margin buffer in Bybit account
UPDATE public.apex_ai_layer_config c
SET
  max_layers = CASE p.risk_profile
    WHEN 'conservative' THEN 3
    WHEN 'balanced' THEN 5
    WHEN 'aggressive' THEN 7
    ELSE 5
  END,
  layer_spacing_atr = CASE p.risk_profile
    WHEN 'conservative' THEN 1.2
    WHEN 'balanced' THEN 1.5
    WHEN 'aggressive' THEN 1.8
    ELSE 1.5
  END,
  take_profit_pct = CASE p.risk_profile
    WHEN 'conservative' THEN 0.8
    WHEN 'balanced' THEN 1.2
    WHEN 'aggressive' THEN 1.5
    ELSE 1.2
  END,
  -- Tighter allocation caps: we need big margin buffer to handle deep DCA
  max_allocation_pct = CASE p.risk_profile
    WHEN 'conservative' THEN 15.0   -- was 20
    WHEN 'balanced' THEN 25.0       -- was 30
    WHEN 'aggressive' THEN 35.0     -- was 45
    ELSE 25.0
  END,
  -- Drawdown tolerance: how far price can move against entry before circuit breaker
  drawdown_tolerance_pct = CASE p.risk_profile
    WHEN 'conservative' THEN 40.0   -- extra safety
    WHEN 'balanced' THEN 35.0       -- per CEO directive
    WHEN 'aggressive' THEN 30.0     -- aggressive accepts tighter tolerance
    ELSE 35.0
  END
FROM public.apex_ai_portfolios p
WHERE c.portfolio_id = p.id;

-- Enforce leverage caps on portfolios directly (source of truth for per-order leverage)
UPDATE public.apex_ai_portfolios
SET max_leverage = CASE risk_profile
  WHEN 'conservative' THEN 2
  WHEN 'balanced' THEN 2
  WHEN 'aggressive' THEN 3
  ELSE 2
END
WHERE max_leverage > CASE risk_profile
  WHEN 'conservative' THEN 2
  WHEN 'balanced' THEN 2
  WHEN 'aggressive' THEN 3
  ELSE 2
END;

-- Same for per-symbol leverage (which is the leverage actually used on each order)
UPDATE public.apex_ai_symbols s
SET leverage = LEAST(s.leverage, p.max_leverage)
FROM public.apex_ai_portfolios p
WHERE s.portfolio_id = p.id;

-- ════════════════════════════════════════════════════════════════
-- 2. Function: estimate liquidation price for a position
-- ════════════════════════════════════════════════════════════════
--
-- Bybit linear perp (USDT margined) approximation:
--   Long:  liq = entry × (1 - 1/lev × (1 - mm))
--   Short: liq = entry × (1 + 1/lev × (1 - mm))
-- where mm = maintenance margin ratio (≈ 0.5% for major pairs)

CREATE OR REPLACE FUNCTION public.apex_ai_estimate_liq_price(
  p_side TEXT,
  p_entry_price NUMERIC,
  p_leverage NUMERIC,
  p_maintenance_margin NUMERIC DEFAULT 0.005
) RETURNS NUMERIC
LANGUAGE SQL IMMUTABLE AS $$
  SELECT CASE
    WHEN p_leverage <= 0 THEN 0
    WHEN p_side = 'long' THEN p_entry_price * (1 - (1.0 / p_leverage) * (1 - p_maintenance_margin))
    WHEN p_side = 'short' THEN p_entry_price * (1 + (1.0 / p_leverage) * (1 - p_maintenance_margin))
    ELSE 0
  END;
$$;

COMMENT ON FUNCTION public.apex_ai_estimate_liq_price IS
  'Apex AI — estimates Bybit liquidation price for a linear USDT-M position. Approximation (Bybit also considers funding + unrealized PnL of other positions in cross mode).';

-- ════════════════════════════════════════════════════════════════
-- 3. Function: estimate BLENDED liq price for a Martingale group
-- ════════════════════════════════════════════════════════════════
--
-- When a group has multiple layers, the effective liquidation price is
-- calculated against the blended cost basis:
--   blended_entry = SUM(entry × size) / SUM(size)
--   blended_lev = SUM(notional) / SUM(margin) = SUM(size × entry) / SUM(size × entry / leverage)
-- Which simplifies to the weighted harmonic mean of leverages.
--
-- We estimate the worst-case liq_price of the WHOLE group as the liq_price
-- that would cause total unrealized PnL to eat all margin.

CREATE OR REPLACE FUNCTION public.apex_ai_group_liq_price(
  p_parent_group UUID
) RETURNS NUMERIC
LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_total_notional NUMERIC := 0;
  v_total_margin NUMERIC := 0;
  v_blended_entry NUMERIC := 0;
  v_effective_leverage NUMERIC;
  v_side TEXT;
  v_row RECORD;
  v_total_size NUMERIC := 0;
  v_weighted_entry NUMERIC := 0;
BEGIN
  FOR v_row IN
    SELECT entry_price, size, leverage, side::text AS side
    FROM public.apex_ai_positions
    WHERE parent_position_group = p_parent_group AND status = 'open'
  LOOP
    IF v_side IS NULL THEN v_side := v_row.side; END IF;
    v_total_notional := v_total_notional + (v_row.entry_price * v_row.size);
    v_total_margin := v_total_margin + ((v_row.entry_price * v_row.size) / GREATEST(v_row.leverage, 1));
    v_total_size := v_total_size + v_row.size;
    v_weighted_entry := v_weighted_entry + (v_row.entry_price * v_row.size);
  END LOOP;

  IF v_total_size = 0 THEN RETURN 0; END IF;

  v_blended_entry := v_weighted_entry / v_total_size;
  v_effective_leverage := CASE WHEN v_total_margin > 0 THEN v_total_notional / v_total_margin ELSE 1 END;

  RETURN public.apex_ai_estimate_liq_price(v_side, v_blended_entry, v_effective_leverage, 0.005);
END;
$$;

COMMENT ON FUNCTION public.apex_ai_group_liq_price IS
  'Apex AI — computes estimated liquidation price for the blended Martingale group.';

-- ════════════════════════════════════════════════════════════════
-- 4. Rewrite apex_ai_open_next_layer with anti-liquidation guard
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
  v_first_layer RECORD;
  v_new_layer_index INT;
  v_base_size_usdt NUMERIC;
  v_layer_size_usdt NUMERIC;
  v_new_position_id UUID;
  v_max_allocation_usdt NUMERIC;
  v_threshold_price NUMERIC;
  v_atr_effective NUMERIC;
  v_volatility_regime TEXT;
  v_projected_liq_price NUMERIC;
  v_drawdown_since_l1_pct NUMERIC;
  v_tolerance_remaining_pct NUMERIC;
BEGIN
  SELECT * INTO v_config FROM public.apex_ai_layer_config WHERE portfolio_id = p_portfolio_id;
  SELECT * INTO v_portfolio FROM public.apex_ai_portfolios WHERE id = p_portfolio_id;

  IF v_config IS NULL OR v_portfolio IS NULL THEN
    RETURN jsonb_build_object('opened', false, 'reason', 'config_not_found');
  END IF;

  -- Load volatility regime
  SELECT volatility_regime INTO v_volatility_regime
  FROM public.apex_ai_regime_state
  WHERE symbol = p_symbol;

  -- Adapt spacing to volatility
  v_atr_effective := p_current_atr * v_config.layer_spacing_atr *
    CASE v_volatility_regime
      WHEN 'high' THEN 1.5
      WHEN 'medium' THEN 1.0
      WHEN 'low' THEN 0.8
      ELSE 1.0
    END;

  -- Count existing layers for this group
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

  -- Hard cap on max layers
  IF v_current_layer_count >= v_config.max_layers THEN
    RETURN jsonb_build_object(
      'opened', false,
      'reason', 'max_layers_reached',
      'current', v_current_layer_count,
      'max', v_config.max_layers
    );
  END IF;

  v_new_layer_index := v_new_layer_index + 1;

  -- For layer 2+: check threshold breached + drawdown tolerance
  IF v_current_layer_count > 0 THEN
    SELECT * INTO v_last_layer
    FROM public.apex_ai_positions
    WHERE portfolio_id = p_portfolio_id
      AND symbol = p_symbol
      AND side = p_side::apex_ai_position_side
      AND status = 'open'
    ORDER BY layer_index DESC
    LIMIT 1;

    SELECT * INTO v_first_layer
    FROM public.apex_ai_positions
    WHERE portfolio_id = p_portfolio_id
      AND symbol = p_symbol
      AND side = p_side::apex_ai_position_side
      AND status = 'open'
    ORDER BY layer_index ASC
    LIMIT 1;

    -- Threshold check
    IF p_side = 'long' THEN
      v_threshold_price := v_last_layer.entry_price - v_atr_effective;
      IF p_current_price > v_threshold_price THEN
        RETURN jsonb_build_object(
          'opened', false,
          'reason', 'threshold_not_breached',
          'current_price', p_current_price,
          'threshold', v_threshold_price
        );
      END IF;
    ELSE
      v_threshold_price := v_last_layer.entry_price + v_atr_effective;
      IF p_current_price < v_threshold_price THEN
        RETURN jsonb_build_object(
          'opened', false,
          'reason', 'threshold_not_breached',
          'current_price', p_current_price,
          'threshold', v_threshold_price
        );
      END IF;
    END IF;

    -- ★ ANTI-LIQUIDATION CHECK ★
    -- Calculate drawdown percentage since L1 entry.
    -- If we open another layer and drawdown already exceeds tolerance,
    -- refuse — let circuit breaker handle it.
    IF p_side = 'long' THEN
      v_drawdown_since_l1_pct := ((v_first_layer.entry_price - p_current_price) / v_first_layer.entry_price) * 100;
    ELSE
      v_drawdown_since_l1_pct := ((p_current_price - v_first_layer.entry_price) / v_first_layer.entry_price) * 100;
    END IF;

    v_tolerance_remaining_pct := v_config.drawdown_tolerance_pct - v_drawdown_since_l1_pct;

    IF v_drawdown_since_l1_pct >= v_config.drawdown_tolerance_pct THEN
      -- Log + pause the portfolio
      INSERT INTO public.apex_ai_strategy_events
        (portfolio_id, event_type, symbol, rationale, payload_json)
      VALUES (
        p_portfolio_id, 'drawdown_tolerance_exceeded', p_symbol,
        'Drawdown since L1 (' || ROUND(v_drawdown_since_l1_pct::numeric, 2) || '%) exceeded tolerance (' || v_config.drawdown_tolerance_pct || '%). Circuit breaker engaged.',
        jsonb_build_object(
          'drawdown_pct', v_drawdown_since_l1_pct,
          'tolerance_pct', v_config.drawdown_tolerance_pct,
          'l1_entry', v_first_layer.entry_price,
          'current_price', p_current_price
        )
      );

      UPDATE public.apex_ai_portfolios
      SET status = 'circuit_breaker'
      WHERE id = p_portfolio_id;

      RETURN jsonb_build_object(
        'opened', false,
        'reason', 'drawdown_tolerance_exceeded',
        'drawdown_pct', v_drawdown_since_l1_pct,
        'tolerance_pct', v_config.drawdown_tolerance_pct
      );
    END IF;

    -- Extra guard: if opening this layer would reduce buffer to less than 5%,
    -- block it (keeps minimum margin before total liquidation window).
    IF v_tolerance_remaining_pct < 5.0 THEN
      RETURN jsonb_build_object(
        'opened', false,
        'reason', 'too_close_to_tolerance',
        'drawdown_pct', v_drawdown_since_l1_pct,
        'buffer_remaining_pct', v_tolerance_remaining_pct
      );
    END IF;
  END IF;

  -- Compute size via Martingale formula
  v_max_allocation_usdt := v_portfolio.capital_usdt * v_config.max_allocation_pct / 100.0;
  v_base_size_usdt := public.apex_ai_martingale_base_size(v_max_allocation_usdt, v_config.max_layers);
  v_layer_size_usdt := public.apex_ai_martingale_layer_size(v_new_layer_index, v_base_size_usdt);

  IF v_parent_group IS NULL THEN
    v_parent_group := gen_random_uuid();
  END IF;

  -- Estimate liq price of this individual layer (for logging)
  v_projected_liq_price := public.apex_ai_estimate_liq_price(
    p_side,
    p_current_price,
    v_portfolio.max_leverage,
    0.005
  );

  -- Insert the layer
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
    NULL, -- no hard SL (martingale handles via DCA)
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

  -- Strategy event log
  INSERT INTO public.apex_ai_strategy_events
    (portfolio_id, event_type, symbol, to_value, rationale, payload_json)
  VALUES (
    p_portfolio_id, 'layer_opened', p_symbol, v_new_layer_index::text,
    CASE
      WHEN v_new_layer_index = 1 THEN
        'L1 opened @ ' || ROUND(p_current_price::numeric, 4) || ' · size ' || ROUND(v_layer_size_usdt::numeric, 2) || ' USDT · lev ' || v_portfolio.max_leverage || 'x · liq est ' || ROUND(v_projected_liq_price::numeric, 4)
      WHEN v_new_layer_index = 2 THEN
        'L2 opened — same base size (' || ROUND(v_layer_size_usdt::numeric, 2) || ' USDT). Martingale protection engaged.'
      ELSE
        'L' || v_new_layer_index || ' opened — size doubled to ' || ROUND(v_layer_size_usdt::numeric, 2) || ' USDT. Drawdown ' || ROUND(COALESCE(v_drawdown_since_l1_pct, 0)::numeric, 2) || '% / tolerance ' || v_config.drawdown_tolerance_pct || '%.'
    END,
    jsonb_build_object(
      'layer_index', v_new_layer_index,
      'entry_price', p_current_price,
      'size_usdt', v_layer_size_usdt,
      'leverage', v_portfolio.max_leverage,
      'liq_price_estimate', v_projected_liq_price,
      'drawdown_since_l1_pct', v_drawdown_since_l1_pct,
      'tolerance_remaining_pct', v_tolerance_remaining_pct,
      'volatility_regime', v_volatility_regime
    )
  );

  RETURN jsonb_build_object(
    'opened', true,
    'position_id', v_new_position_id,
    'layer_index', v_new_layer_index,
    'entry_price', p_current_price,
    'size_usdt', v_layer_size_usdt,
    'liq_price_estimate', v_projected_liq_price,
    'drawdown_since_l1_pct', v_drawdown_since_l1_pct,
    'tolerance_remaining_pct', v_tolerance_remaining_pct
  );
END;
$$;

-- ════════════════════════════════════════════════════════════════
-- 5. Check function: group drawdown status (for UI + tick pre-check)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.apex_ai_group_drawdown_status(
  p_portfolio_id UUID,
  p_symbol TEXT,
  p_side TEXT,
  p_current_price NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql STABLE
SET search_path = public AS $$
DECLARE
  v_first RECORD;
  v_drawdown_pct NUMERIC;
  v_tolerance NUMERIC;
BEGIN
  SELECT entry_price, layer_index
  INTO v_first
  FROM public.apex_ai_positions
  WHERE portfolio_id = p_portfolio_id
    AND symbol = p_symbol
    AND side = p_side::apex_ai_position_side
    AND status = 'open'
  ORDER BY layer_index ASC
  LIMIT 1;

  IF v_first IS NULL THEN
    RETURN jsonb_build_object('has_position', false);
  END IF;

  SELECT drawdown_tolerance_pct INTO v_tolerance
  FROM public.apex_ai_layer_config
  WHERE portfolio_id = p_portfolio_id;

  v_tolerance := COALESCE(v_tolerance, 35.0);

  IF p_side = 'long' THEN
    v_drawdown_pct := ((v_first.entry_price - p_current_price) / v_first.entry_price) * 100;
  ELSE
    v_drawdown_pct := ((p_current_price - v_first.entry_price) / v_first.entry_price) * 100;
  END IF;

  v_drawdown_pct := GREATEST(v_drawdown_pct, 0); -- ignore profit side

  RETURN jsonb_build_object(
    'has_position', true,
    'drawdown_pct', v_drawdown_pct,
    'tolerance_pct', v_tolerance,
    'buffer_remaining_pct', v_tolerance - v_drawdown_pct,
    'tolerance_breached', v_drawdown_pct >= v_tolerance,
    'l1_entry_price', v_first.entry_price
  );
END;
$$;

COMMENT ON FUNCTION public.apex_ai_group_drawdown_status IS
  'Apex AI — returns current drawdown vs tolerance for a symbol/side group. Used by bot-tick pre-check and UI indicator.';

-- ════════════════════════════════════════════════════════════════
-- 6. Verification
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_liq_l2 NUMERIC;
  v_liq_l3 NUMERIC;
  v_liq_l5 NUMERIC;
  v_dd_l2 NUMERIC;
  v_dd_l3 NUMERIC;
  v_dd_l5 NUMERIC;
BEGIN
  -- Sample: entry $100, various leverages
  v_liq_l2 := public.apex_ai_estimate_liq_price('long', 100, 2);
  v_liq_l3 := public.apex_ai_estimate_liq_price('long', 100, 3);
  v_liq_l5 := public.apex_ai_estimate_liq_price('long', 100, 5);
  v_dd_l2 := ((100 - v_liq_l2) / 100) * 100;
  v_dd_l3 := ((100 - v_liq_l3) / 100) * 100;
  v_dd_l5 := ((100 - v_liq_l5) / 100) * 100;

  RAISE NOTICE 'Liquidation buffer by leverage: 2x tolerates -%.1f%%, 3x tolerates -%.1f%%, 5x tolerates -%.1f%%',
    v_dd_l2, v_dd_l3, v_dd_l5;
END $$;
