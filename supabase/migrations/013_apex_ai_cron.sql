-- 013 · Apex AI — Scheduled bot tick via pg_cron + pg_net
--
-- Schedules `apex-ai-bot-tick` edge function to run every 1 minute for each
-- active portfolio. This makes the bot operate continuously server-side
-- without depending on the user having the web app open.
--
-- Architecture:
--   pg_cron (schedule)    → calls SQL function apex_ai_trigger_ticks()
--   apex_ai_trigger_ticks → iterates active portfolios, POSTs to edge fn
--   net.http_post         → fires request to supabase functions endpoint
--
-- Requirements (Supabase Pro tier, usually enabled by default):
--   - pg_cron extension
--   - pg_net extension
--
-- Security:
--   Service role key is stored in a private settings table (not in cron
--   definition), so it's not exposed in cron.job_details. The SECURITY
--   DEFINER function reads the key with elevated privileges only.
--
-- ────────────────────────────────────────────────────────────────────
-- ⚠️  BEFORE RUNNING: paste your service_role_key into the placeholder
--     (see section 3 — look for PASTE_SERVICE_ROLE_KEY_HERE).
-- ────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════
-- 1. Enable required extensions
-- ════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ════════════════════════════════════════════════════════════════
-- 2. Private settings table — holds service role key
-- ════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS apex_ai_private;

CREATE TABLE IF NOT EXISTS apex_ai_private.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE apex_ai_private.settings IS
  'Apex AI — private settings (service_role_key, etc). Never exposed via PostgREST.';

-- Revoke all access from everyone — only SECURITY DEFINER functions read it
REVOKE ALL ON SCHEMA apex_ai_private FROM PUBLIC;
REVOKE ALL ON apex_ai_private.settings FROM PUBLIC;

-- ════════════════════════════════════════════════════════════════
-- 3. SET YOUR SERVICE ROLE KEY HERE
-- ════════════════════════════════════════════════════════════════
--
-- Find it at: https://supabase.com/dashboard/project/atatdrnqpynzydkdukta/settings/api-keys
-- Look for "service_role" secret. It starts with "eyJhbGciOi..."
-- Replace PASTE_SERVICE_ROLE_KEY_HERE below (keep the quotes).

INSERT INTO apex_ai_private.settings (key, value)
VALUES (
  'service_role_key',
  'PASTE_SERVICE_ROLE_KEY_HERE'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

INSERT INTO apex_ai_private.settings (key, value)
VALUES (
  'supabase_url',
  'https://atatdrnqpynzydkdukta.supabase.co'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- ════════════════════════════════════════════════════════════════
-- 4. Trigger function — calls edge function for each active portfolio
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.apex_ai_trigger_ticks()
RETURNS TABLE (portfolio_id UUID, request_id BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, apex_ai_private
AS $$
DECLARE
  v_service_key TEXT;
  v_supabase_url TEXT;
  v_portfolio RECORD;
  v_request_id BIGINT;
BEGIN
  -- Load secrets from private settings
  SELECT value INTO v_service_key
  FROM apex_ai_private.settings WHERE key = 'service_role_key';

  SELECT value INTO v_supabase_url
  FROM apex_ai_private.settings WHERE key = 'supabase_url';

  IF v_service_key IS NULL OR v_service_key = 'PASTE_SERVICE_ROLE_KEY_HERE' THEN
    RAISE EXCEPTION 'apex_ai_trigger_ticks: service_role_key not configured in apex_ai_private.settings';
  END IF;

  -- Iterate active portfolios and fire edge function requests in parallel
  FOR v_portfolio IN
    SELECT id FROM public.apex_ai_portfolios WHERE status = 'active'
  LOOP
    SELECT extensions.http_post(
      url := v_supabase_url || '/functions/v1/apex-ai-bot-tick',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object('portfolio_id', v_portfolio.id)
    ) INTO v_request_id;

    portfolio_id := v_portfolio.id;
    request_id := v_request_id;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.apex_ai_trigger_ticks IS
  'Apex AI — invoked by pg_cron every minute. Fires apex-ai-bot-tick edge function for each active portfolio.';

-- Only postgres role can execute (cron runs as postgres)
REVOKE EXECUTE ON FUNCTION public.apex_ai_trigger_ticks FROM PUBLIC;

-- ════════════════════════════════════════════════════════════════
-- 5. Cron schedule — every 1 minute
-- ════════════════════════════════════════════════════════════════

-- Remove any existing schedule with same name before creating
DO $$
BEGIN
  PERFORM cron.unschedule('apex-ai-tick-loop');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'apex-ai-tick-loop',
  '* * * * *', -- every minute
  $$ SELECT public.apex_ai_trigger_ticks(); $$
);

-- ════════════════════════════════════════════════════════════════
-- 6. Monitoring view — inspect recent cron runs
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.apex_ai_cron_health AS
SELECT
  j.jobid,
  j.jobname,
  j.schedule,
  j.active,
  r.start_time,
  r.end_time,
  r.status,
  r.return_message,
  EXTRACT(EPOCH FROM (r.end_time - r.start_time)) AS duration_sec
FROM cron.job j
LEFT JOIN LATERAL (
  SELECT *
  FROM cron.job_run_details d
  WHERE d.jobid = j.jobid
  ORDER BY d.start_time DESC
  LIMIT 5
) r ON TRUE
WHERE j.jobname LIKE 'apex-ai%'
ORDER BY j.jobid, r.start_time DESC;

GRANT SELECT ON public.apex_ai_cron_health TO authenticated;

COMMENT ON VIEW public.apex_ai_cron_health IS
  'Apex AI — inspect recent pg_cron runs for apex-ai-tick-loop and check health.';

-- ════════════════════════════════════════════════════════════════
-- 7. Verification
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_cron_count INT;
  v_key_ok BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_cron_count FROM cron.job WHERE jobname = 'apex-ai-tick-loop';

  SELECT (value IS NOT NULL AND value <> 'PASTE_SERVICE_ROLE_KEY_HERE')
  INTO v_key_ok
  FROM apex_ai_private.settings WHERE key = 'service_role_key';

  RAISE NOTICE 'Apex AI cron scheduled: % jobs; service_role_key configured: %',
    v_cron_count, v_key_ok;

  IF NOT COALESCE(v_key_ok, FALSE) THEN
    RAISE WARNING 'Service role key NOT SET. Edit migration 013 and replace PASTE_SERVICE_ROLE_KEY_HERE before re-running.';
  END IF;
END $$;
