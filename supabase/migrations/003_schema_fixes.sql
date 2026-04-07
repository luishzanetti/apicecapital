-- ============================================================================
-- Migration 003: Schema Fixes
-- ============================================================================
-- Fixes critical schema issues found in the Apice Capital database:
--   1. Missing indexes on user_id and session_id columns
--   2. Expanded transactions type constraint to support all operation types
--   3. Status constraint on dca_executions
--   4. Frequency constraint on dca_plans
--   5. Numeric validation (positive amounts)
--   6. Execution tracking columns on dca_plans
--
-- All statements use IF NOT EXISTS / DROP IF EXISTS for idempotency.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Missing Indexes
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_portfolios_user ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_dca_plans_user ON public.dca_plans(user_id);

-- analytics_events index — only if table exists (depends on migration 002)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'analytics_events') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_analytics_session ON public.analytics_events(session_id)';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Expand transactions type constraint
--    Original schema had CHECK (type IN ('buy', 'sell')).
--    Migration 001 introduced ('deposit', 'dca_execution', 'manual', 'withdrawal').
--    Edge Functions (dca-execute) use 'buy' type. Unify all valid types.
-- ----------------------------------------------------------------------------

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('buy', 'sell', 'deposit', 'withdrawal', 'dca_execution'));

-- ----------------------------------------------------------------------------
-- 3. Status constraint on dca_executions
-- ----------------------------------------------------------------------------

ALTER TABLE public.dca_executions DROP CONSTRAINT IF EXISTS dca_executions_status_check;
ALTER TABLE public.dca_executions ADD CONSTRAINT dca_executions_status_check
  CHECK (status IN ('pending', 'success', 'failed', 'cancelled'));

-- ----------------------------------------------------------------------------
-- 4. Frequency constraint on dca_plans
-- ----------------------------------------------------------------------------

ALTER TABLE public.dca_plans DROP CONSTRAINT IF EXISTS dca_plans_frequency_check;
ALTER TABLE public.dca_plans ADD CONSTRAINT dca_plans_frequency_check
  CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly'));

-- ----------------------------------------------------------------------------
-- 5. Numeric validation constraints (positive amounts)
-- ----------------------------------------------------------------------------

ALTER TABLE public.dca_plans ADD CONSTRAINT dca_plans_amount_positive
  CHECK (amount_per_interval > 0);
ALTER TABLE public.transactions ADD CONSTRAINT transactions_amount_positive
  CHECK (amount > 0);

-- ----------------------------------------------------------------------------
-- 6. Execution tracking columns on dca_plans
-- ----------------------------------------------------------------------------

ALTER TABLE public.dca_plans ADD COLUMN IF NOT EXISTS last_execution_date TIMESTAMPTZ;
ALTER TABLE public.dca_plans ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;
ALTER TABLE public.dca_plans ADD COLUMN IF NOT EXISTS failed_executions INTEGER DEFAULT 0;
