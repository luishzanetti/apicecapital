-- 015 · Apex AI v2.0 — Multi-layer DCA + regime intelligence
--
-- Transforms Apex AI from single-hedge to multi-layer grid DCA (up to 10 layers
-- per symbol/side) with regime awareness and market intelligence.
--
-- Per @architect Aria + @data-engineer Dara multi-agent plan:
-- See docs/projects/apex-ai/03-V2-MASTER-PLAN.md
--
-- Changes:
--   1. apex_ai_positions: layer_index, parent_position_group, strategy_tag, intended_exit_price
--   2. apex_ai_layer_config: portfolio-level layer strategy config
--   3. apex_ai_regime_state: market regime snapshot per symbol
--   4. apex_ai_symbol_intelligence: ATR, funding, volume per symbol
--   5. apex_ai_strategy_events: audit trail of strategy changes
--   6. apex_ai_aggregated_positions (view): blended view for UI
--
-- Idempotent.

-- ════════════════════════════════════════════════════════════════
-- 1. Extend apex_ai_positions with layer metadata
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.apex_ai_positions
  ADD COLUMN IF NOT EXISTS layer_index INT NOT NULL DEFAULT 1 CHECK (layer_index BETWEEN 1 AND 10);

ALTER TABLE public.apex_ai_positions
  ADD COLUMN IF NOT EXISTS parent_position_group UUID;

ALTER TABLE public.apex_ai_positions
  ADD COLUMN IF NOT EXISTS strategy_tag TEXT NOT NULL DEFAULT 'grid_dca'
    CHECK (strategy_tag IN ('grid_dca', 'trend', 'funding_arb', 'mean_reversion'));

ALTER TABLE public.apex_ai_positions
  ADD COLUMN IF NOT EXISTS intended_exit_price NUMERIC(18, 8);

ALTER TABLE public.apex_ai_positions
  ADD COLUMN IF NOT EXISTS atr_at_entry NUMERIC(18, 8);

-- Drop the old dedup index (which only allowed 1 position per symbol/side)
-- and replace with dedup on (portfolio_id, symbol, side, layer_index).
DROP INDEX IF EXISTS apex_ai_positions_open_dedup_idx;

CREATE UNIQUE INDEX IF NOT EXISTS apex_ai_positions_layer_dedup_idx
  ON public.apex_ai_positions(portfolio_id, symbol, side, layer_index)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS apex_ai_positions_group_idx
  ON public.apex_ai_positions(parent_position_group)
  WHERE status = 'open';

-- Also add to apex_ai_trades to preserve strategy attribution
ALTER TABLE public.apex_ai_trades
  ADD COLUMN IF NOT EXISTS layer_index INT;

ALTER TABLE public.apex_ai_trades
  ADD COLUMN IF NOT EXISTS strategy_tag TEXT;

ALTER TABLE public.apex_ai_trades
  ADD COLUMN IF NOT EXISTS parent_position_group UUID;

-- ════════════════════════════════════════════════════════════════
-- 2. Layer config per portfolio
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_layer_config (
  portfolio_id UUID PRIMARY KEY REFERENCES public.apex_ai_portfolios(id) ON DELETE CASCADE,
  max_layers INT NOT NULL DEFAULT 5 CHECK (max_layers BETWEEN 1 AND 10),
  -- Grid spacing: each new layer opens when price moves this many ATR against current layer
  layer_spacing_atr NUMERIC(5, 2) NOT NULL DEFAULT 1.0 CHECK (layer_spacing_atr > 0),
  -- Size multiplier: layer N size = base_size × multiplier^(N-1). E.g. 1.5 → 1x, 1.5x, 2.25x, 3.4x...
  layer_size_multiplier NUMERIC(5, 2) NOT NULL DEFAULT 1.5 CHECK (layer_size_multiplier >= 1.0 AND layer_size_multiplier <= 3.0),
  -- Target: TP = blended_avg × (1 + take_profit_pct). Scaled by number of active layers.
  take_profit_pct NUMERIC(5, 2) NOT NULL DEFAULT 3.0,
  -- Allocation cap: even with 10 layers, can't exceed this % of portfolio capital per symbol
  max_allocation_pct NUMERIC(5, 2) NOT NULL DEFAULT 40.0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.apex_ai_layer_config IS
  'Apex AI v2 — per-portfolio configuration for multi-layer DCA grid strategy.';

-- Default layer configs for existing portfolios
INSERT INTO public.apex_ai_layer_config (portfolio_id, max_layers, layer_spacing_atr, layer_size_multiplier, take_profit_pct, max_allocation_pct)
SELECT
  p.id,
  CASE p.risk_profile
    WHEN 'conservative' THEN 3
    WHEN 'balanced' THEN 5
    WHEN 'aggressive' THEN 8
    ELSE 5
  END,
  CASE p.risk_profile
    WHEN 'conservative' THEN 1.5
    WHEN 'balanced' THEN 1.0
    WHEN 'aggressive' THEN 0.8
    ELSE 1.0
  END,
  CASE p.risk_profile
    WHEN 'conservative' THEN 1.3
    WHEN 'balanced' THEN 1.5
    WHEN 'aggressive' THEN 1.8
    ELSE 1.5
  END,
  CASE p.risk_profile
    WHEN 'conservative' THEN 2.0
    WHEN 'balanced' THEN 3.0
    WHEN 'aggressive' THEN 4.5
    ELSE 3.0
  END,
  CASE p.risk_profile
    WHEN 'conservative' THEN 25.0
    WHEN 'balanced' THEN 40.0
    WHEN 'aggressive' THEN 60.0
    ELSE 40.0
  END
FROM public.apex_ai_portfolios p
ON CONFLICT (portfolio_id) DO NOTHING;

ALTER TABLE public.apex_ai_layer_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "apex_ai_layer_config_owner" ON public.apex_ai_layer_config
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.apex_ai_portfolios p
              WHERE p.id = apex_ai_layer_config.portfolio_id AND p.user_id = auth.uid())
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.apex_ai_portfolios p
              WHERE p.id = apex_ai_layer_config.portfolio_id AND p.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- 3. Regime state (per symbol — shared across portfolios)
-- ════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE apex_ai_market_regime AS ENUM ('bull_trending', 'bear_trending', 'sideways', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE apex_ai_volatility_regime AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.apex_ai_regime_state (
  symbol TEXT PRIMARY KEY,
  trend_regime apex_ai_market_regime NOT NULL DEFAULT 'unknown',
  volatility_regime apex_ai_volatility_regime NOT NULL DEFAULT 'medium',
  ema_50 NUMERIC(18, 8),
  ema_200 NUMERIC(18, 8),
  adx_14 NUMERIC(5, 2),
  atr_14 NUMERIC(18, 8),
  atr_pct NUMERIC(5, 2), -- ATR as % of price
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.apex_ai_regime_state IS
  'Apex AI v2 — latest market regime detection per symbol. Updated by apex-ai-intelligence edge fn every 5min.';

ALTER TABLE public.apex_ai_regime_state ENABLE ROW LEVEL SECURITY;

-- Regime state is public read (all authenticated users can see current regimes)
DO $$ BEGIN
  CREATE POLICY "apex_ai_regime_state_read_all" ON public.apex_ai_regime_state
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- 4. Symbol intelligence (ATR, funding, volume per symbol)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_symbol_intelligence (
  symbol TEXT PRIMARY KEY,
  current_price NUMERIC(18, 8),
  funding_rate NUMERIC(8, 6), -- e.g. 0.0001 = 0.01% per 8h
  next_funding_at TIMESTAMPTZ,
  volume_24h_usd NUMERIC(18, 2),
  open_interest_usd NUMERIC(18, 2),
  -- Cross-symbol correlations (stored as JSONB for flexibility)
  correlations JSONB, -- { "BTCUSDT": 0.85, "ETHUSDT": 0.78, ... }
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.apex_ai_symbol_intelligence IS
  'Apex AI v2 — per-symbol market intelligence (price, funding, OI, correlations).';

ALTER TABLE public.apex_ai_symbol_intelligence ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "apex_ai_symbol_intel_read_all" ON public.apex_ai_symbol_intelligence
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- 5. Strategy events audit
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.apex_ai_strategy_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID NOT NULL REFERENCES public.apex_ai_portfolios(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'regime_change' | 'layer_opened' | 'layers_closed' | 'leverage_reduced' | 'paused_news' | ...
  symbol TEXT,
  from_value TEXT,
  to_value TEXT,
  rationale TEXT,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS apex_ai_strategy_events_portfolio_idx
  ON public.apex_ai_strategy_events(portfolio_id, created_at DESC);

ALTER TABLE public.apex_ai_strategy_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "apex_ai_strategy_events_owner_read" ON public.apex_ai_strategy_events
    FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.apex_ai_portfolios p
              WHERE p.id = apex_ai_strategy_events.portfolio_id AND p.user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- 6. Aggregated positions view (blends layers into logical positions)
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.apex_ai_aggregated_positions AS
SELECT
  portfolio_id,
  user_id,
  symbol,
  side,
  COUNT(*) AS layer_count,
  MIN(layer_index) AS first_layer,
  MAX(layer_index) AS last_layer,
  SUM(size) AS total_size,
  -- Weighted average entry price (by size)
  SUM(entry_price * size) / NULLIF(SUM(size), 0) AS avg_entry_price,
  SUM(unrealized_pnl) AS total_unrealized_pnl,
  MIN(leverage) AS min_leverage,
  MAX(leverage) AS max_leverage,
  MIN(opened_at) AS first_opened_at,
  MAX(opened_at) AS last_opened_at,
  parent_position_group,
  MAX(strategy_tag) AS strategy_tag,
  -- Blended take-profit: use avg TP weighted by size, or MAX for conservative
  AVG(take_profit_price) AS avg_take_profit,
  -- Stop-loss: pick worst case (deepest SL)
  CASE WHEN MAX(side::text) = 'long' THEN MIN(stop_loss_price) ELSE MAX(stop_loss_price) END AS aggregate_stop_loss
FROM public.apex_ai_positions
WHERE status = 'open'
GROUP BY portfolio_id, user_id, symbol, side, parent_position_group;

COMMENT ON VIEW public.apex_ai_aggregated_positions IS
  'Apex AI v2 — blends multiple layer positions into one logical position per symbol/side.';

GRANT SELECT ON public.apex_ai_aggregated_positions TO authenticated;

-- ════════════════════════════════════════════════════════════════
-- 7. RPC: open_next_layer — atomic layer-opening with guards
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
  v_base_size NUMERIC;
  v_layer_size NUMERIC;
  v_new_position_id UUID;
  v_total_allocated_usdt NUMERIC;
  v_threshold_price NUMERIC;
BEGIN
  -- Load config + portfolio
  SELECT * INTO v_config FROM public.apex_ai_layer_config WHERE portfolio_id = p_portfolio_id;
  SELECT * INTO v_portfolio FROM public.apex_ai_portfolios WHERE id = p_portfolio_id;

  IF v_config IS NULL OR v_portfolio IS NULL THEN
    RETURN jsonb_build_object('opened', false, 'reason', 'config_not_found');
  END IF;

  -- Find existing layers for this symbol/side
  SELECT
    COUNT(*) AS cnt,
    MAX(layer_index) AS max_idx,
    MAX(parent_position_group) AS group_id
  INTO v_current_layer_count, v_new_layer_index, v_parent_group
  FROM public.apex_ai_positions
  WHERE portfolio_id = p_portfolio_id
    AND symbol = p_symbol
    AND side = p_side::apex_ai_position_side
    AND status = 'open';

  -- First layer or beyond max — bail or init
  IF v_current_layer_count >= v_config.max_layers THEN
    RETURN jsonb_build_object('opened', false, 'reason', 'max_layers_reached', 'current', v_current_layer_count, 'max', v_config.max_layers);
  END IF;

  v_new_layer_index := COALESCE(v_new_layer_index, 0) + 1;

  -- Load last layer to compute threshold for new entry
  IF v_current_layer_count > 0 THEN
    SELECT * INTO v_last_layer
    FROM public.apex_ai_positions
    WHERE portfolio_id = p_portfolio_id
      AND symbol = p_symbol
      AND side = p_side::apex_ai_position_side
      AND status = 'open'
    ORDER BY layer_index DESC
    LIMIT 1;

    -- Threshold: move ATR spacing against last layer entry
    IF p_side = 'long' THEN
      v_threshold_price := v_last_layer.entry_price - (p_current_atr * v_config.layer_spacing_atr);
      IF p_current_price > v_threshold_price THEN
        RETURN jsonb_build_object('opened', false, 'reason', 'threshold_not_breached', 'current_price', p_current_price, 'threshold', v_threshold_price);
      END IF;
    ELSE -- short
      v_threshold_price := v_last_layer.entry_price + (p_current_atr * v_config.layer_spacing_atr);
      IF p_current_price < v_threshold_price THEN
        RETURN jsonb_build_object('opened', false, 'reason', 'threshold_not_breached', 'current_price', p_current_price, 'threshold', v_threshold_price);
      END IF;
    END IF;
  END IF;

  -- Check allocation cap
  SELECT COALESCE(SUM(size * entry_price), 0) INTO v_total_allocated_usdt
  FROM public.apex_ai_positions
  WHERE portfolio_id = p_portfolio_id
    AND symbol = p_symbol
    AND status = 'open';

  IF v_total_allocated_usdt > (v_portfolio.capital_usdt * v_config.max_allocation_pct / 100) THEN
    RETURN jsonb_build_object('opened', false, 'reason', 'max_allocation_exceeded');
  END IF;

  -- Calculate size: base_size × multiplier^(layer-1)
  -- base_size is first layer size in USDT equivalent
  v_base_size := (v_portfolio.capital_usdt * v_config.max_allocation_pct / 100.0 / v_config.max_layers);
  v_layer_size := v_base_size * POWER(v_config.layer_size_multiplier, v_new_layer_index - 1);

  -- Generate parent group if first layer
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
    v_layer_size / p_current_price, -- size in base asset
    v_portfolio.max_leverage,
    -- SL: same as last layer or 1.5 × max_layers × ATR from current
    COALESCE(v_last_layer.stop_loss_price,
             CASE WHEN p_side = 'long'
                  THEN p_current_price - (p_current_atr * v_config.max_layers * 1.5)
                  ELSE p_current_price + (p_current_atr * v_config.max_layers * 1.5) END),
    -- TP: will be recomputed on blended avg (for now individual target)
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

  -- Log the strategy event
  INSERT INTO public.apex_ai_strategy_events
    (portfolio_id, event_type, symbol, to_value, rationale, payload_json)
  VALUES (
    p_portfolio_id, 'layer_opened', p_symbol, v_new_layer_index::text,
    'Grid DCA layer ' || v_new_layer_index || ' opened — price moved ' || ROUND(p_current_atr * v_config.layer_spacing_atr, 4) || ' against last entry',
    jsonb_build_object(
      'layer_index', v_new_layer_index,
      'entry_price', p_current_price,
      'size_usdt', v_layer_size,
      'atr', p_current_atr
    )
  );

  RETURN jsonb_build_object(
    'opened', true,
    'position_id', v_new_position_id,
    'layer_index', v_new_layer_index,
    'entry_price', p_current_price,
    'size_usdt', v_layer_size
  );
END;
$$;

COMMENT ON FUNCTION public.apex_ai_open_next_layer IS
  'Apex AI v2 — atomically opens next DCA layer if conditions met (threshold breach + within max_layers + within allocation cap).';

-- ════════════════════════════════════════════════════════════════
-- 8. RPC: close_position_group — close ALL layers at blended TP
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
  v_user_id UUID;
  v_portfolio_id UUID;
  v_symbol TEXT;
  v_side apex_ai_position_side;
  v_avg_entry NUMERIC;
  v_close_count INT := 0;
  v_trade_id UUID;
BEGIN
  -- Collect metadata from group (one arbitrary row — all share same symbol/side)
  SELECT user_id, portfolio_id, symbol, side
  INTO v_user_id, v_portfolio_id, v_symbol, v_side
  FROM public.apex_ai_positions
  WHERE parent_position_group = p_parent_group AND status = 'open'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('closed', 0, 'reason', 'group_not_found_or_already_closed');
  END IF;

  -- Calculate per-layer PnL + aggregate
  FOR v_positions IN
    SELECT id, entry_price, size, leverage, layer_index
    FROM public.apex_ai_positions
    WHERE parent_position_group = p_parent_group AND status = 'open'
    ORDER BY layer_index
  LOOP
    DECLARE
      v_layer_pnl NUMERIC;
    BEGIN
      v_layer_pnl := CASE
        WHEN v_side = 'long' THEN (p_exit_price - v_positions.entry_price) * v_positions.size
        ELSE (v_positions.entry_price - p_exit_price) * v_positions.size
      END;

      v_total_pnl := v_total_pnl + v_layer_pnl;
      v_total_size := v_total_size + v_positions.size;

      -- Create trade record per layer (preserves audit granularity)
      INSERT INTO public.apex_ai_trades (
        portfolio_id, position_id, user_id, symbol, side,
        entry_price, exit_price, size, leverage, pnl,
        fee_exchange, gas_fee, closed_at,
        layer_index, strategy_tag, parent_position_group
      ) VALUES (
        v_portfolio_id, v_positions.id, v_user_id, v_symbol, v_side,
        v_positions.entry_price, p_exit_price, v_positions.size, v_positions.leverage, v_layer_pnl,
        ABS(v_layer_pnl) * 0.0006, 0, NOW(),
        v_positions.layer_index, 'grid_dca', p_parent_group
      );

      -- Close the position
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

  v_avg_entry := CASE WHEN v_total_size > 0 THEN (
    SELECT SUM(entry_price * size) / NULLIF(SUM(size), 0)
    FROM public.apex_ai_trades
    WHERE parent_position_group = p_parent_group
  ) ELSE 0 END;

  -- Charge 10% fee on aggregate profit (one charge for the whole group)
  IF v_total_pnl > 0 THEN
    PERFORM public.apex_ai_charge_gas_fee(
      p_trade_id := (SELECT id FROM public.apex_ai_trades WHERE parent_position_group = p_parent_group ORDER BY closed_at DESC LIMIT 1),
      p_portfolio_id := v_portfolio_id,
      p_user_id := v_user_id,
      p_pnl := v_total_pnl,
      p_fee_rate_pct := 10.0
    );
  END IF;

  -- Log strategy event
  INSERT INTO public.apex_ai_strategy_events
    (portfolio_id, event_type, symbol, rationale, payload_json)
  VALUES (
    v_portfolio_id, 'layers_closed', v_symbol,
    'Closed ' || v_close_count || ' layers via ' || p_trigger || ': blended avg entry ' || ROUND(v_avg_entry, 4) || ', exit ' || p_exit_price || ', PnL ' || ROUND(v_total_pnl, 2),
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

COMMENT ON FUNCTION public.apex_ai_close_position_group IS
  'Apex AI v2 — closes all layers of a position group atomically (take profit hit on blended avg).';

-- ════════════════════════════════════════════════════════════════
-- 9. Realtime publication updates
-- ════════════════════════════════════════════════════════════════

DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.apex_ai_layer_config REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.apex_ai_regime_state REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.apex_ai_strategy_events REPLICA IDENTITY FULL';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.apex_ai_layer_config;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.apex_ai_regime_state;
    EXCEPTION WHEN duplicate_object THEN NULL; END;

    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.apex_ai_strategy_events;
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════
-- 10. Verification
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_tables_count INT;
  v_functions_count INT;
BEGIN
  SELECT COUNT(*) INTO v_tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('apex_ai_layer_config', 'apex_ai_regime_state', 'apex_ai_symbol_intelligence', 'apex_ai_strategy_events');

  SELECT COUNT(*) INTO v_functions_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('apex_ai_open_next_layer', 'apex_ai_close_position_group');

  RAISE NOTICE 'Apex AI v2 — tables: %/4, functions: %/2', v_tables_count, v_functions_count;
END $$;
