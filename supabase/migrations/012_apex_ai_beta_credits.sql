-- 012 · Apex AI — Beta tester credits ($100 for first 10 users)
--
-- Grants 10,000 Credits (= $100 USDT at 1 USDT = 100 Credits rate) to the
-- first 10 users of the platform so they can test the Apex AI bot engine
-- without having to top up real funds.
--
-- Components:
--   1. Backfill: give 10k Credits to every existing user in the first 10 positions
--      (ordered by auth.users.created_at ASC) who doesn't yet have credits
--   2. Trigger: when a new user signs up, if we haven't given beta credits to
--      10 users yet, grant them 10k Credits automatically
--   3. Tracking column `is_beta_tester` on apex_ai_user_credits for observability
--
-- Idempotent — safe to re-run (won't double-credit).
--
-- Reference: CEO directive 2026-04-23 — "adicione 100$ de saldo para as primeiras 10 contas"

-- ════════════════════════════════════════════════════════════════
-- 1. Extend apex_ai_user_credits with beta-tracking column
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.apex_ai_user_credits
  ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.apex_ai_user_credits
  ADD COLUMN IF NOT EXISTS beta_credit_granted_at TIMESTAMPTZ;

-- ════════════════════════════════════════════════════════════════
-- 2. Config — how much / how many
-- ════════════════════════════════════════════════════════════════

-- Constants embedded as immutable SQL functions so we can change by
-- re-running migration without touching app code.

CREATE OR REPLACE FUNCTION public.apex_ai_beta_credit_amount()
RETURNS NUMERIC LANGUAGE SQL IMMUTABLE AS $$ SELECT 10000::NUMERIC $$;

CREATE OR REPLACE FUNCTION public.apex_ai_beta_max_users()
RETURNS INT LANGUAGE SQL IMMUTABLE AS $$ SELECT 10::INT $$;

COMMENT ON FUNCTION public.apex_ai_beta_credit_amount IS
  'Apex AI — amount of credits (100 Credits = 1 USDT) granted to each beta tester.';
COMMENT ON FUNCTION public.apex_ai_beta_max_users IS
  'Apex AI — maximum number of users that automatically receive beta credits.';

-- ════════════════════════════════════════════════════════════════
-- 3. Backfill — grant credits to existing first-10 users
-- ════════════════════════════════════════════════════════════════

WITH first_users AS (
  SELECT id AS user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 10
)
INSERT INTO public.apex_ai_user_credits (
  user_id, balance, lifetime_earned, is_beta_tester, beta_credit_granted_at
)
SELECT
  fu.user_id,
  public.apex_ai_beta_credit_amount(),
  public.apex_ai_beta_credit_amount(),
  TRUE,
  NOW()
FROM first_users fu
ON CONFLICT (user_id) DO UPDATE
  SET
    balance = public.apex_ai_user_credits.balance
              + CASE WHEN public.apex_ai_user_credits.is_beta_tester
                     THEN 0
                     ELSE public.apex_ai_beta_credit_amount() END,
    lifetime_earned = public.apex_ai_user_credits.lifetime_earned
                      + CASE WHEN public.apex_ai_user_credits.is_beta_tester
                             THEN 0
                             ELSE public.apex_ai_beta_credit_amount() END,
    is_beta_tester = TRUE,
    beta_credit_granted_at = COALESCE(
      public.apex_ai_user_credits.beta_credit_granted_at,
      NOW()
    );

-- ════════════════════════════════════════════════════════════════
-- 4. Trigger — auto-grant to new users if under the cap
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.apex_ai_grant_beta_credits_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_beta_count INT;
BEGIN
  -- Count how many users already received beta credits
  SELECT COUNT(*) INTO v_beta_count
  FROM public.apex_ai_user_credits
  WHERE is_beta_tester = TRUE;

  -- Grant credits only if below cap
  IF v_beta_count < public.apex_ai_beta_max_users() THEN
    INSERT INTO public.apex_ai_user_credits (
      user_id, balance, lifetime_earned, is_beta_tester, beta_credit_granted_at
    ) VALUES (
      NEW.id,
      public.apex_ai_beta_credit_amount(),
      public.apex_ai_beta_credit_amount(),
      TRUE,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
      SET
        balance = public.apex_ai_user_credits.balance
                  + public.apex_ai_beta_credit_amount(),
        lifetime_earned = public.apex_ai_user_credits.lifetime_earned
                          + public.apex_ai_beta_credit_amount(),
        is_beta_tester = TRUE,
        beta_credit_granted_at = NOW();
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.apex_ai_grant_beta_credits_on_signup IS
  'Apex AI — auto-grants beta credits (up to max_users cap) when a new auth.users row is created.';

-- Create trigger on auth.users — fires after every signup
DROP TRIGGER IF EXISTS apex_ai_beta_credits_on_signup ON auth.users;
CREATE TRIGGER apex_ai_beta_credits_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.apex_ai_grant_beta_credits_on_signup();

-- ════════════════════════════════════════════════════════════════
-- 5. Introspection view — how many beta slots remain?
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.apex_ai_beta_slot_status AS
SELECT
  (SELECT COUNT(*) FROM public.apex_ai_user_credits WHERE is_beta_tester = TRUE) AS granted,
  public.apex_ai_beta_max_users() AS max_slots,
  public.apex_ai_beta_max_users()
    - (SELECT COUNT(*) FROM public.apex_ai_user_credits WHERE is_beta_tester = TRUE)
    AS remaining;

COMMENT ON VIEW public.apex_ai_beta_slot_status IS
  'Apex AI — shows how many beta credit slots have been used vs remaining.';

-- ════════════════════════════════════════════════════════════════
-- 6. Verification
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_granted INT;
BEGIN
  SELECT COUNT(*) INTO v_granted FROM public.apex_ai_user_credits WHERE is_beta_tester = TRUE;
  RAISE NOTICE 'Apex AI beta credits granted: % (cap = %)', v_granted, public.apex_ai_beta_max_users();
END $$;
