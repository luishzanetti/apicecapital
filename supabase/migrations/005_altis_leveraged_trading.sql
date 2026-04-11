-- ============================================================================
-- Migration 005: ALTIS — AI Leveraged Trading Intelligence System
-- ============================================================================
-- Creates the data foundation for the 5-strategy leveraged trading system:
--   1. strategy_configs          — Per-user strategy settings & allocation
--   2. leveraged_positions       — Open and historical perpetual positions
--   3. trading_signals           — Generated signals from all strategies
--   4. leveraged_strategy_performance — Performance metrics by strategy/period
--   5. risk_events               — Circuit breaker, liquidation, heat events
--   6. grid_orders               — Individual grid trading orders
--   7. funding_payments          — Funding rate income tracking
--   8. circuit_breaker_state     — Per-user circuit breaker status
--
-- All tables use RLS. Idempotent (IF NOT EXISTS).
-- ============================================================================


-- ============================================================================
-- 1. STRATEGY CONFIGS — Per-user strategy settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.strategy_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN (
    'grid', 'trend_following', 'mean_reversion', 'funding_arb', 'ai_signal'
  )),
  is_active BOOLEAN DEFAULT false,
  allocation_pct NUMERIC NOT NULL DEFAULT 0 CHECK (allocation_pct >= 0 AND allocation_pct <= 100),
  max_leverage NUMERIC DEFAULT 2 CHECK (max_leverage >= 1 AND max_leverage <= 5),
  assets JSONB DEFAULT '["BTCUSDT","ETHUSDT"]'::jsonb,
  params JSONB DEFAULT '{}'::jsonb,
  disabled_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT strategy_configs_user_type_unique UNIQUE (user_id, strategy_type)
);

CREATE INDEX IF NOT EXISTS idx_strategy_configs_user
  ON public.strategy_configs(user_id) WHERE is_active = true;

ALTER TABLE public.strategy_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own strategy configs" ON public.strategy_configs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strategy configs" ON public.strategy_configs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own strategy configs" ON public.strategy_configs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own strategy configs" ON public.strategy_configs FOR DELETE USING (auth.uid() = user_id);


-- ============================================================================
-- 2. LEVERAGED POSITIONS — Open and historical perpetual positions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leveraged_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('long', 'short')),
  entry_price NUMERIC NOT NULL,
  mark_price NUMERIC,
  size_qty NUMERIC NOT NULL,
  size_usd NUMERIC NOT NULL,
  leverage NUMERIC NOT NULL DEFAULT 1 CHECK (leverage >= 1 AND leverage <= 20),
  take_profit_price NUMERIC,
  stop_loss_price NUMERIC,
  trailing_stop_pct NUMERIC,
  liquidation_price NUMERIC,
  unrealized_pnl NUMERIC DEFAULT 0,
  realized_pnl NUMERIC DEFAULT 0,
  funding_received NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'liquidated', 'stopped_out')),
  close_price NUMERIC,
  close_reason TEXT,
  bybit_order_id TEXT,
  signal_id UUID,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lev_positions_user_open
  ON public.leveraged_positions(user_id, status) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_lev_positions_strategy
  ON public.leveraged_positions(strategy_type, opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_lev_positions_user_time
  ON public.leveraged_positions(user_id, opened_at DESC);

ALTER TABLE public.leveraged_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own positions" ON public.leveraged_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own positions" ON public.leveraged_positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own positions" ON public.leveraged_positions FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================================
-- 3. TRADING SIGNALS — Generated signals from all strategies
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_type TEXT NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short', 'close', 'neutral')),
  conviction NUMERIC DEFAULT 0 CHECK (conviction >= 0 AND conviction <= 100),
  suggested_leverage NUMERIC DEFAULT 1,
  suggested_size_usd NUMERIC,
  take_profit_price NUMERIC,
  stop_loss_price NUMERIC,
  rationale TEXT,
  risk_approved BOOLEAN DEFAULT false,
  risk_rejection_reason TEXT,
  portfolio_heat_at_signal NUMERIC,
  was_executed BOOLEAN DEFAULT false,
  position_id UUID REFERENCES public.leveraged_positions(id),
  market_regime TEXT,
  indicators JSONB DEFAULT '{}'::jsonb,
  ai_response JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_signals_user_time
  ON public.trading_signals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_pending
  ON public.trading_signals(risk_approved, was_executed)
  WHERE risk_approved = true AND was_executed = false;

ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own signals" ON public.trading_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own signals" ON public.trading_signals FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================================
-- 4. LEVERAGED STRATEGY PERFORMANCE — Metrics by strategy/period
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leveraged_strategy_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_type TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_pnl_usd NUMERIC DEFAULT 0,
  total_pnl_pct NUMERIC DEFAULT 0,
  realized_pnl NUMERIC DEFAULT 0,
  unrealized_pnl NUMERIC DEFAULT 0,
  funding_income NUMERIC DEFAULT 0,
  fees_paid NUMERIC DEFAULT 0,
  trades_opened INTEGER DEFAULT 0,
  trades_closed INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  avg_win_pct NUMERIC DEFAULT 0,
  avg_loss_pct NUMERIC DEFAULT 0,
  max_drawdown_pct NUMERIC DEFAULT 0,
  sharpe_ratio NUMERIC,
  profit_factor NUMERIC,
  market_regime TEXT,
  avg_leverage NUMERIC DEFAULT 1,
  capital_deployed NUMERIC DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lev_strat_perf
  ON public.leveraged_strategy_performance(user_id, strategy_type, period_end DESC);

ALTER TABLE public.leveraged_strategy_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own performance" ON public.leveraged_strategy_performance FOR SELECT USING (auth.uid() = user_id);


-- ============================================================================
-- 5. RISK EVENTS — Circuit breaker, liquidation, heat events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'circuit_breaker_tripped', 'circuit_breaker_reset',
    'capitulation_override', 'liquidation_warning', 'liquidation_forced',
    'margin_call_warning', 'correlation_block',
    'heat_limit_reached', 'max_leverage_exceeded',
    'daily_loss_approaching', 'position_force_closed'
  )),
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  details JSONB DEFAULT '{}'::jsonb,
  positions_affected JSONB DEFAULT '[]'::jsonb,
  market_regime TEXT,
  portfolio_heat NUMERIC,
  daily_pnl_pct NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_events_user
  ON public.risk_events(user_id, created_at DESC);

ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own risk events" ON public.risk_events FOR SELECT USING (auth.uid() = user_id);


-- ============================================================================
-- 6. GRID ORDERS — Individual grid trading orders
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.grid_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  config_id UUID REFERENCES public.strategy_configs(id),
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  grid_level INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  leverage NUMERIC DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'filled', 'cancelled')),
  bybit_order_id TEXT,
  fill_price NUMERIC,
  pnl NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grid_orders_user
  ON public.grid_orders(user_id, symbol, status);

ALTER TABLE public.grid_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own grid orders" ON public.grid_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grid orders" ON public.grid_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grid orders" ON public.grid_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grid orders" ON public.grid_orders FOR DELETE USING (auth.uid() = user_id);


-- ============================================================================
-- 7. FUNDING PAYMENTS — Funding rate income tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.funding_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.leveraged_positions(id),
  symbol TEXT NOT NULL,
  funding_rate NUMERIC NOT NULL,
  payment_amount NUMERIC NOT NULL,
  position_size NUMERIC NOT NULL,
  funding_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funding_payments_user
  ON public.funding_payments(user_id, funding_time DESC);

ALTER TABLE public.funding_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own funding payments" ON public.funding_payments FOR SELECT USING (auth.uid() = user_id);


-- ============================================================================
-- 8. CIRCUIT BREAKER STATE — Per-user circuit breaker status
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.circuit_breaker_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_tripped BOOLEAN DEFAULT false,
  tripped_at TIMESTAMPTZ,
  resume_at TIMESTAMPTZ,
  trip_reason TEXT,
  daily_pnl_at_trip NUMERIC,
  positions_closed_count INTEGER DEFAULT 0,
  consecutive_trips INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.circuit_breaker_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own circuit breaker" ON public.circuit_breaker_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own circuit breaker" ON public.circuit_breaker_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own circuit breaker" ON public.circuit_breaker_state FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================================
-- 9. VIEWS — Convenience views for common queries
-- ============================================================================

CREATE OR REPLACE VIEW public.active_leveraged_positions AS
SELECT
  lp.*,
  sc.allocation_pct,
  sc.max_leverage AS config_max_leverage
FROM public.leveraged_positions lp
LEFT JOIN public.strategy_configs sc
  ON lp.user_id = sc.user_id AND lp.strategy_type = sc.strategy_type
WHERE lp.status = 'open';

CREATE OR REPLACE VIEW public.portfolio_heat_summary AS
SELECT
  user_id,
  COUNT(*) AS open_positions,
  SUM(size_usd * leverage) AS total_exposure,
  SUM(ABS(unrealized_pnl)) AS total_unrealized_abs,
  SUM(CASE WHEN unrealized_pnl > 0 THEN unrealized_pnl ELSE 0 END) AS total_unrealized_profit,
  SUM(CASE WHEN unrealized_pnl < 0 THEN unrealized_pnl ELSE 0 END) AS total_unrealized_loss,
  SUM(funding_received) AS total_funding_received
FROM public.leveraged_positions
WHERE status = 'open'
GROUP BY user_id;
