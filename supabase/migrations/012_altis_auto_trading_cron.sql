-- 012 · ALTIS auto-trading — cooldown guard + scheduled orchestration
--
-- CEO bug: "orders are slow, I cancelled one to test and no new one was
-- opened." Root cause: strategy-orchestrator only ran on manual trigger.
-- price-updater also had no schedule — unrealized_pnl never refreshed
-- server-side.
--
-- This migration adds:
--   (A) An anti-flip cooldown helper: the orchestrator should skip
--       opening a new position on (user, symbol, side) if one was closed
--       in the last N seconds (default 120s). Prevents immediately
--       re-opening a position the user just cancelled.
--   (B) Optional auto-scheduling via pg_cron (runs if the operator has
--       set `app.supabase_url` + `app.cron_secret` as Postgres settings).
--       This is a *best-effort* — if the settings aren't present, the
--       migration still applies cleanly and the client-side auto-trigger
--       keeps the system running while the dashboard is open.
--
-- Idempotent — safe to re-run.

-- ─── (A) Anti-flip cooldown ──────────────────────────────────────
CREATE OR REPLACE FUNCTION public.altis_recent_close_exists(
  p_user_id uuid,
  p_symbol text,
  p_side text,
  p_cooldown_seconds int DEFAULT 120
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.leveraged_positions
    WHERE user_id = p_user_id
      AND symbol = p_symbol
      AND side = p_side
      AND status = 'closed'
      AND closed_at IS NOT NULL
      AND closed_at > now() - make_interval(secs => p_cooldown_seconds)
  );
$$;

REVOKE ALL ON FUNCTION public.altis_recent_close_exists(uuid, text, text, int) FROM public;
GRANT EXECUTE ON FUNCTION public.altis_recent_close_exists(uuid, text, text, int) TO service_role;

COMMENT ON FUNCTION public.altis_recent_close_exists(uuid, text, text, int) IS
  'Anti-flip guard — returns true if a matching position was closed within the cooldown window. Prevents the orchestrator from re-opening a just-cancelled position.';

-- ─── (B) Optional pg_cron schedules ─────────────────────────────
-- Only runs if the operator has configured the required app.* settings.
-- Setup (run once as superuser / via Supabase SQL editor):
--   ALTER DATABASE postgres SET app.supabase_url = 'https://<ref>.supabase.co';
--   ALTER DATABASE postgres SET app.cron_secret  = '<your-CRON_SECRET>';
-- Then re-apply this migration to install the jobs.

DO $$
DECLARE
  v_url   TEXT;
  v_secret TEXT;
BEGIN
  BEGIN v_url    := current_setting('app.supabase_url', true);     EXCEPTION WHEN OTHERS THEN v_url := NULL;    END;
  BEGIN v_secret := current_setting('app.cron_secret', true);      EXCEPTION WHEN OTHERS THEN v_secret := NULL; END;

  IF v_url IS NULL OR v_url = '' OR v_secret IS NULL OR v_secret = '' THEN
    RAISE NOTICE 'Skipping pg_cron schedules — app.supabase_url or app.cron_secret not set. Client-side auto-trigger handles orchestration while the dashboard is open.';
    RETURN;
  END IF;

  -- Remove prior schedules so this is idempotent across re-applies.
  PERFORM cron.unschedule(jobname) FROM cron.job
    WHERE jobname IN (
      'altis-strategy-orchestrator-every-5min',
      'altis-price-updater-every-minute'
    );

  -- strategy-orchestrator every 5 minutes
  PERFORM cron.schedule(
    'altis-strategy-orchestrator-every-5min',
    '*/5 * * * *',
    format(
      $job$
        SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', %L
          ),
          body := jsonb_build_object('action', 'evaluate-all')
        );
      $job$,
      v_url || '/functions/v1/strategy-orchestrator',
      v_secret
    )
  );

  -- price-updater every minute (mark_price + unrealized_pnl refresh)
  PERFORM cron.schedule(
    'altis-price-updater-every-minute',
    '* * * * *',
    format(
      $job$
        SELECT net.http_post(
          url := %L,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', %L
          ),
          body := jsonb_build_object()
        );
      $job$,
      v_url || '/functions/v1/price-updater',
      v_secret
    )
  );

  RAISE NOTICE 'pg_cron schedules installed: strategy-orchestrator (5min), price-updater (1min).';
END $$;
