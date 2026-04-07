-- ============================================================================
-- Migration 004: Apice Intelligence System (AIS)
-- ============================================================================
-- Creates the data foundation for the 5-pillar intelligence system:
--   1. market_snapshots       — Raw market data + calculated indicators
--   2. market_regimes         — Market regime classification history
--   3. user_behavior_events   — User action tracking for adaptive profile
--   4. user_intelligence      — Behavioral score, confidence index, evolved profile
--   5. portfolio_snapshots    — Daily portfolio value snapshots
--   6. strategy_performance   — Strategy results by market regime
--   7. ai_interactions        — AI Advisor usage tracking + feedback
--   8. smart_alerts           — Proactive intelligence notifications
--   9. rebalance_suggestions  — Portfolio rebalance recommendations
--
-- All tables use RLS. Idempotent (IF NOT EXISTS / DROP IF EXISTS).
-- ============================================================================


-- ============================================================================
-- 1. MARKET SNAPSHOTS — Raw + Derived Market Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.market_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Raw data from exchange
  symbol TEXT NOT NULL,                          -- e.g. 'BTCUSDT'
  price NUMERIC NOT NULL,
  volume_24h NUMERIC DEFAULT 0,
  change_24h_pct NUMERIC DEFAULT 0,
  high_24h NUMERIC DEFAULT 0,
  low_24h NUMERIC DEFAULT 0,
  -- Derived indicators (calculated server-side)
  sma_7d NUMERIC,                                -- Simple Moving Average 7 days
  sma_30d NUMERIC,                               -- Simple Moving Average 30 days
  sma_90d NUMERIC,                               -- Simple Moving Average 90 days
  rsi_14 NUMERIC,                                -- Relative Strength Index 14 periods
  volatility_30d NUMERIC,                        -- Std deviation of 30d returns
  -- Global market data
  fear_greed_index INTEGER,                      -- 0-100 from alternative.me
  fear_greed_label TEXT,                          -- 'Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'
  btc_dominance NUMERIC,                         -- BTC market cap dominance %
  total_market_cap NUMERIC,                      -- Total crypto market cap USD
  -- Bybit derivatives data
  funding_rate NUMERIC,                          -- Perpetual funding rate
  open_interest NUMERIC,                         -- Open interest USD
  -- Metadata
  source TEXT DEFAULT 'bybit',
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partitioning-friendly indexes
CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol_time
  ON public.market_snapshots(symbol, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_captured
  ON public.market_snapshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_snapshots_btc_latest
  ON public.market_snapshots(symbol, captured_at DESC) WHERE symbol = 'BTCUSDT';

-- Retention policy: auto-delete snapshots older than 90 days
-- (Run via pg_cron or scheduled Edge Function)
-- DELETE FROM public.market_snapshots WHERE captured_at < NOW() - INTERVAL '90 days';

-- RLS: service_role inserts, authenticated users can read
ALTER TABLE public.market_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market snapshots" ON public.market_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Service role inserts market snapshots" ON public.market_snapshots
  FOR INSERT WITH CHECK (auth.role() = 'service_role');


-- ============================================================================
-- 2. MARKET REGIMES — Classification History
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.market_regimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regime TEXT NOT NULL CHECK (regime IN (
    'BULL', 'BEAR', 'SIDEWAYS', 'HIGH_VOLATILITY', 'ALTSEASON', 'CAPITULATION'
  )),
  -- Detection criteria snapshot
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- e.g. { "btc_vs_sma90": 1.05, "rsi": 62, "fear_greed": 65, "btc_dominance": 54.2 }
  confidence NUMERIC NOT NULL DEFAULT 0,         -- 0-100 confidence in classification
  consecutive_periods INTEGER DEFAULT 1,         -- How many periods this regime held
  -- Transition metadata
  previous_regime TEXT,
  transition_reason TEXT,                        -- Human-readable explanation
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,                          -- NULL = current regime
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_regimes_current
  ON public.market_regimes(ended_at) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_market_regimes_history
  ON public.market_regimes(started_at DESC);

ALTER TABLE public.market_regimes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read market regimes" ON public.market_regimes
  FOR SELECT USING (true);

CREATE POLICY "Service role manages market regimes" ON public.market_regimes
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- 3. USER BEHAVIOR EVENTS — Action Tracking for Adaptive Profile
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'dca_executed', 'dca_skipped', 'dca_paused', 'dca_resumed',
    'recommendation_accepted', 'recommendation_rejected',
    'rebalance_applied', 'rebalance_dismissed',
    'alert_clicked', 'alert_dismissed',
    'profile_change_accepted', 'profile_change_rejected',
    'lesson_completed', 'quiz_completed',
    'deposit_confirmed', 'deposit_skipped',
    'panic_action', 'strategy_changed'
  )),
  event_data JSONB DEFAULT '{}'::jsonb,
  -- e.g. { "plan_id": "...", "amount": 50, "regime": "BEAR" }
  market_regime TEXT,                            -- Regime at time of event
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavior_events_user_time
  ON public.user_behavior_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavior_events_type
  ON public.user_behavior_events(event_type, created_at DESC);

ALTER TABLE public.user_behavior_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own behavior events" ON public.user_behavior_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own behavior events" ON public.user_behavior_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages all behavior events" ON public.user_behavior_events
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- 4. USER INTELLIGENCE — Behavioral Score, Confidence, Evolved Profile
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Behavioral Score (0-100) — 5 dimensions
  behavioral_score NUMERIC DEFAULT 0 CHECK (behavioral_score >= 0 AND behavioral_score <= 100),
  consistency_score NUMERIC DEFAULT 0,           -- 30% weight: aportes executados/planejados
  discipline_score NUMERIC DEFAULT 0,            -- 25% weight: seguiu recomendações
  knowledge_score NUMERIC DEFAULT 0,             -- 20% weight: lições, quizzes
  engagement_score NUMERIC DEFAULT 0,            -- 15% weight: logins, AI usage
  capital_commitment_score NUMERIC DEFAULT 0,    -- 10% weight: invested vs declared
  -- Confidence Index (0-100) — How much we trust the profile
  confidence_index NUMERIC DEFAULT 0 CHECK (confidence_index >= 0 AND confidence_index <= 100),
  -- Evolved Profile
  original_investor_type TEXT,                   -- From onboarding quiz
  evolved_investor_type TEXT,                    -- Current evolved type
  evolution_history JSONB DEFAULT '[]'::jsonb,
  -- e.g. [{ "from": "Conservative", "to": "Balanced", "date": "...", "reason": "..." }]
  -- Smart DCA preferences
  smart_dca_enabled BOOLEAN DEFAULT true,
  smart_dca_max_adjustment NUMERIC DEFAULT 0.4,  -- ±40% max
  -- Streak tracking
  current_streak_weeks INTEGER DEFAULT 0,
  longest_streak_weeks INTEGER DEFAULT 0,
  total_dca_executed INTEGER DEFAULT 0,
  total_dca_skipped INTEGER DEFAULT 0,
  -- Metadata
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_intelligence_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_intelligence_user
  ON public.user_intelligence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_intelligence_score
  ON public.user_intelligence(behavioral_score DESC);

ALTER TABLE public.user_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own intelligence" ON public.user_intelligence
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages all intelligence" ON public.user_intelligence
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- 5. PORTFOLIO SNAPSHOTS — Daily Value Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Portfolio value
  total_value_usd NUMERIC NOT NULL DEFAULT 0,
  total_invested_usd NUMERIC NOT NULL DEFAULT 0,
  pnl_usd NUMERIC DEFAULT 0,
  pnl_pct NUMERIC DEFAULT 0,
  -- Per-asset breakdown
  holdings JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- e.g. [{ "symbol": "BTC", "qty": 0.005, "value_usd": 340, "pct": 58 }]
  -- Allocation analysis
  allocation_deviation NUMERIC DEFAULT 0,        -- How far from target allocation (0-100)
  target_allocation JSONB DEFAULT '{}'::jsonb,
  actual_allocation JSONB DEFAULT '{}'::jsonb,
  -- Market context at snapshot time
  market_regime TEXT,
  btc_price NUMERIC,
  -- Metadata
  snapshot_type TEXT DEFAULT 'daily' CHECK (snapshot_type IN ('daily', 'weekly', 'monthly', 'manual')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_time
  ON public.portfolio_snapshots(user_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_regime
  ON public.portfolio_snapshots(market_regime, captured_at DESC);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own portfolio snapshots" ON public.portfolio_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role manages portfolio snapshots" ON public.portfolio_snapshots
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- 6. STRATEGY PERFORMANCE — Results by Regime
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.strategy_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Strategy identification
  strategy_type TEXT NOT NULL CHECK (strategy_type IN (
    'conservative', 'balanced', 'growth'
  )),
  market_regime TEXT NOT NULL CHECK (market_regime IN (
    'BULL', 'BEAR', 'SIDEWAYS', 'HIGH_VOLATILITY', 'ALTSEASON', 'CAPITULATION'
  )),
  -- Performance metrics
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  return_pct NUMERIC DEFAULT 0,                  -- Total return in period
  annualized_return_pct NUMERIC DEFAULT 0,
  max_drawdown_pct NUMERIC DEFAULT 0,
  sharpe_ratio NUMERIC DEFAULT 0,
  -- Context
  avg_dca_amount NUMERIC DEFAULT 0,
  total_users INTEGER DEFAULT 0,                 -- Anonymous aggregate
  sample_allocation JSONB DEFAULT '{}'::jsonb,
  -- Metadata
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategy_perf_lookup
  ON public.strategy_performance(strategy_type, market_regime, period_end DESC);

ALTER TABLE public.strategy_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read strategy performance" ON public.strategy_performance
  FOR SELECT USING (true);

CREATE POLICY "Service role manages strategy performance" ON public.strategy_performance
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- 7. AI INTERACTIONS — Advisor Usage + Feedback Loop
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Interaction details
  action TEXT NOT NULL CHECK (action IN (
    'recommend', 'insight', 'analyze-portfolio', 'chat', 'briefing'
  )),
  model TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  -- Request context
  request_context JSONB DEFAULT '{}'::jsonb,
  -- e.g. { "regime": "BULL", "profile": "Balanced", "behavioral_score": 72 }
  -- Response
  response_summary TEXT,                         -- Short summary of AI response
  response_data JSONB DEFAULT '{}'::jsonb,       -- Structured response data
  -- Feedback loop
  feedback TEXT CHECK (feedback IN ('accepted', 'rejected', 'ignored', NULL)),
  feedback_reason TEXT,
  feedback_at TIMESTAMPTZ,
  -- Performance
  latency_ms INTEGER,
  tokens_input INTEGER,
  tokens_output INTEGER,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_time
  ON public.ai_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_feedback
  ON public.ai_interactions(feedback, created_at DESC) WHERE feedback IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_interactions_action
  ON public.ai_interactions(action, created_at DESC);

ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own AI interactions" ON public.ai_interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI interactions" ON public.ai_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI interaction feedback" ON public.ai_interactions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages all AI interactions" ON public.ai_interactions
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- 8. SMART ALERTS — Proactive Intelligence Notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.smart_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Alert classification
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'opportunity', 'rebalance', 'milestone', 'regime_change',
    'risk', 'education', 'strategy_graduation', 'streak'
  )),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN (
    'info', 'warning', 'critical', 'celebration'
  )),
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,                             -- CTA button text
  action_route TEXT,                             -- In-app navigation target
  action_data JSONB DEFAULT '{}'::jsonb,         -- Data for the action
  -- Context
  market_regime TEXT,
  trigger_data JSONB DEFAULT '{}'::jsonb,
  -- e.g. { "fear_greed": 15, "drawdown": -32, "historical_avg_return_12m": 40 }
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  is_acted_on BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ,
  -- Metadata
  expires_at TIMESTAMPTZ,                        -- Auto-expire old alerts
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smart_alerts_user_unread
  ON public.smart_alerts(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_smart_alerts_user_time
  ON public.smart_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_alerts_type
  ON public.smart_alerts(alert_type, created_at DESC);

ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own alerts" ON public.smart_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.smart_alerts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages all alerts" ON public.smart_alerts
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- 9. REBALANCE SUGGESTIONS — Portfolio Rebalance Recommendations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.rebalance_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Current vs Target
  current_allocation JSONB NOT NULL,
  -- e.g. { "BTC": 62, "ETH": 22, "SOL": 16 }
  target_allocation JSONB NOT NULL,
  -- e.g. { "BTC": 50, "ETH": 30, "SOL": 20 }
  deviation_pct NUMERIC NOT NULL,                -- Max deviation from target
  -- Recommendation
  rebalance_mode TEXT NOT NULL DEFAULT 'soft' CHECK (rebalance_mode IN ('soft', 'hard')),
  recommendation JSONB NOT NULL,
  -- e.g. { "next_dca_allocation": { "ETH": 60, "SOL": 40 }, "reason": "..." }
  explanation TEXT NOT NULL,
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  applied_at TIMESTAMPTZ,
  -- Context
  market_regime TEXT,
  -- Metadata
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rebalance_user_pending
  ON public.rebalance_suggestions(user_id, created_at DESC) WHERE status = 'pending';

ALTER TABLE public.rebalance_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own rebalance suggestions" ON public.rebalance_suggestions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rebalance suggestions" ON public.rebalance_suggestions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages all rebalance suggestions" ON public.rebalance_suggestions
  FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- 10. HELPER FUNCTION: Initialize user_intelligence on signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.initialize_user_intelligence()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_intelligence (user_id, original_investor_type, evolved_investor_type)
  VALUES (NEW.id, NULL, NULL)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: create intelligence row when profile is created
DROP TRIGGER IF EXISTS on_profile_created_init_intelligence ON public.profiles;
CREATE TRIGGER on_profile_created_init_intelligence
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_intelligence();


-- ============================================================================
-- 11. HELPER FUNCTION: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_intelligence_updated_at ON public.user_intelligence;
CREATE TRIGGER user_intelligence_updated_at
  BEFORE UPDATE ON public.user_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- ============================================================================
-- 12. VIEWS — Convenience Views for Common Queries
-- ============================================================================

-- Latest market snapshot per symbol
CREATE OR REPLACE VIEW public.latest_market_data AS
SELECT DISTINCT ON (symbol)
  symbol, price, volume_24h, change_24h_pct, high_24h, low_24h,
  sma_7d, sma_30d, sma_90d, rsi_14, volatility_30d,
  fear_greed_index, fear_greed_label, btc_dominance, total_market_cap,
  funding_rate, open_interest, captured_at
FROM public.market_snapshots
ORDER BY symbol, captured_at DESC;

-- Current market regime
CREATE OR REPLACE VIEW public.current_market_regime AS
SELECT regime, criteria, confidence, consecutive_periods, started_at
FROM public.market_regimes
WHERE ended_at IS NULL
ORDER BY created_at DESC
LIMIT 1;

-- User intelligence dashboard view
CREATE OR REPLACE VIEW public.user_intelligence_dashboard AS
SELECT
  ui.user_id,
  ui.behavioral_score,
  ui.confidence_index,
  ui.evolved_investor_type,
  ui.current_streak_weeks,
  ui.longest_streak_weeks,
  ui.smart_dca_enabled,
  ui.total_dca_executed,
  ui.total_dca_skipped,
  CASE
    WHEN ui.total_dca_executed + ui.total_dca_skipped > 0
    THEN ROUND(ui.total_dca_executed::numeric / (ui.total_dca_executed + ui.total_dca_skipped) * 100, 1)
    ELSE 0
  END AS execution_rate_pct,
  ui.last_calculated_at,
  -- Latest portfolio snapshot
  ps.total_value_usd AS latest_portfolio_value,
  ps.pnl_pct AS latest_pnl_pct,
  ps.allocation_deviation
FROM public.user_intelligence ui
LEFT JOIN LATERAL (
  SELECT total_value_usd, pnl_pct, allocation_deviation
  FROM public.portfolio_snapshots
  WHERE user_id = ui.user_id
  ORDER BY captured_at DESC
  LIMIT 1
) ps ON true;
