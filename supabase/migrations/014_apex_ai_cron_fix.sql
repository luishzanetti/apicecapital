-- 014 · Apex AI — Fix pg_net function reference in cron trigger
--
-- Migration 013 used `extensions.http_post(url, headers, body)` but the
-- correct pg_net signature is:
--   `net.http_post(url, body, params, headers, timeout_milliseconds)`
--
-- This migration replaces the trigger function with the correct call so
-- the cron job starts actually invoking the edge function.
--
-- Idempotent — safe to re-run.

CREATE OR REPLACE FUNCTION public.apex_ai_trigger_ticks()
RETURNS TABLE (portfolio_id UUID, request_id BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, net, apex_ai_private
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

  -- Iterate active portfolios and fire edge function requests
  FOR v_portfolio IN
    SELECT id FROM public.apex_ai_portfolios WHERE status = 'active'
  LOOP
    -- Correct pg_net signature: http_post(url, body, params, headers, timeout_ms)
    SELECT net.http_post(
      url := v_supabase_url || '/functions/v1/apex-ai-bot-tick',
      body := jsonb_build_object('portfolio_id', v_portfolio.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      timeout_milliseconds := 30000
    ) INTO v_request_id;

    portfolio_id := v_portfolio.id;
    request_id := v_request_id;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.apex_ai_trigger_ticks IS
  'Apex AI — invoked by pg_cron every minute. Fires apex-ai-bot-tick edge function for each active portfolio. Fixed in migration 014 to use correct pg_net schema.';

REVOKE EXECUTE ON FUNCTION public.apex_ai_trigger_ticks FROM PUBLIC;
