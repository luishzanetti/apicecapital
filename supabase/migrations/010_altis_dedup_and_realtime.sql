-- 010 · ALTIS trade dedup + Realtime telemetry
--
-- Addresses two CEO-reported bugs on ALTIS Trading:
--   (A) "Always opens the same trades" — no DB-level guard against
--       duplicate open positions on (user_id, symbol, side).
--   (B) "PnL does not update in real time" — Realtime was not guaranteed
--       to be publishing `leveraged_positions` changes; full row payload
--       was not enforced (REPLICA IDENTITY FULL).
--
-- Idempotent — safe to re-run.

-- ─── (A) Duplicate-open guard ────────────────────────────────────
-- A partial UNIQUE index that only applies to rows with status='open'.
-- Once a position is closed (status='closed'), a new open on the same
-- (user, symbol, side) becomes legal again. Prevents concurrent double-
-- inserts that the application-layer dedup could miss.

CREATE UNIQUE INDEX IF NOT EXISTS leveraged_positions_open_dedup_idx
  ON public.leveraged_positions (user_id, symbol, side)
  WHERE status = 'open';

-- ─── (B) Realtime-ready publication ──────────────────────────────
-- Ensure `leveraged_positions` is included in the default `supabase_realtime`
-- publication AND that every UPDATE frame carries the full row payload
-- (required for the client to read the new mark_price + unrealized_pnl).

DO $$
BEGIN
  -- Enforce full-row identity so UPDATE frames include all columns,
  -- not just the primary key. Safe to re-apply.
  EXECUTE 'ALTER TABLE public.leveraged_positions REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.trading_signals     REPLICA IDENTITY FULL';
  EXECUTE 'ALTER TABLE public.risk_events         REPLICA IDENTITY FULL';
EXCEPTION WHEN undefined_table THEN
  -- tables missing in certain environments — skip
  NULL;
END $$;

-- Add to the supabase_realtime publication if not already present.
-- Wrapped in a DO block so pre-existing membership does not error.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.leveraged_positions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_signals;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_events;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

COMMENT ON INDEX public.leveraged_positions_open_dedup_idx IS
  'Partial unique index: blocks duplicate open positions on (user, symbol, side). See migration 010.';
