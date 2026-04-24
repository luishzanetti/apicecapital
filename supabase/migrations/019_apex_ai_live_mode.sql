-- 019 · Apex AI — LIVE mode production readiness (Track A)
--
-- Adds idempotency keys + observability for real Bybit order execution.
-- Per @architect Aria (Track A / @qa Quinn gates):
--   - client_order_id on positions → prevents duplicate orders if retry
--   - last_bybit_sync_at on positions → track reconciliation freshness
--   - live_mode flag on portfolios → explicit live vs simulate (computed hint)
--
-- Idempotent.

-- ════════════════════════════════════════════════════════════════
-- 1. Position-level: client_order_id + sync metadata
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.apex_ai_positions
  ADD COLUMN IF NOT EXISTS client_order_id TEXT,
  ADD COLUMN IF NOT EXISTS last_bybit_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bybit_position_idx INT; -- 0=one-way, 1=long hedge, 2=short hedge

-- Unique client_order_id per portfolio (prevents 2 orders with same id)
CREATE UNIQUE INDEX IF NOT EXISTS apex_ai_positions_client_order_id_idx
  ON public.apex_ai_positions(portfolio_id, client_order_id)
  WHERE client_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS apex_ai_positions_sync_idx
  ON public.apex_ai_positions(last_bybit_sync_at)
  WHERE status = 'open';

-- ════════════════════════════════════════════════════════════════
-- 2. Portfolio-level: live_mode tracking + reconcile metadata
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.apex_ai_portfolios
  ADD COLUMN IF NOT EXISTS last_reconcile_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reconcile_error TEXT,
  ADD COLUMN IF NOT EXISTS live_mode BOOLEAN NOT NULL DEFAULT FALSE;

-- ════════════════════════════════════════════════════════════════
-- 3. Reconciliation event types + helper to log
-- ════════════════════════════════════════════════════════════════
--
-- Uses existing apex_ai_strategy_events with new event_type values:
--   - live_reconcile_ok
--   - live_reconcile_mismatch
--   - live_position_closed_externally
--   - live_order_duplicate_blocked
--   - live_margin_insufficient

-- Already supported by apex_ai_strategy_events.event_type (TEXT, no enum).

-- ════════════════════════════════════════════════════════════════
-- 4. Backfill live_mode based on existing bybit_credentials
-- ════════════════════════════════════════════════════════════════

UPDATE public.apex_ai_portfolios p
SET live_mode = EXISTS (
  SELECT 1 FROM public.bybit_credentials c WHERE c.user_id = p.user_id
);

-- ════════════════════════════════════════════════════════════════
-- 5. Verification
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_positions_with_cid INT;
  v_portfolios_live INT;
BEGIN
  SELECT COUNT(*) INTO v_positions_with_cid
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'apex_ai_positions'
      AND column_name = 'client_order_id';

  SELECT COUNT(*) INTO v_portfolios_live
    FROM public.apex_ai_portfolios
    WHERE live_mode = TRUE;

  RAISE NOTICE 'Apex AI LIVE mode ready: positions.client_order_id=%/1, portfolios.live_mode=%',
    v_positions_with_cid, v_portfolios_live;
END $$;
