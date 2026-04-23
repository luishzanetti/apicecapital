-- 009 · Security hotfix (pre-launch)
--
-- Addresses findings from the pre-launch security audit:
--   1. `dca_executions` INSERT policy was `WITH CHECK (true)`, allowing any
--      authenticated user to forge execution rows and inflate metrics.
--      Restrict inserts to service_role only (edge functions / cron).
--   2. Adds an atomic RPC `increment_dca_total_invested` so the
--      `dca-execute` edge function can increment `total_invested` without
--      a read-modify-write race under concurrent executions.
--
-- This migration is idempotent — safe to re-run.

-- ─── (1) dca_executions · INSERT policy ──────────────────────────
DROP POLICY IF EXISTS "Service role can insert executions" ON public.dca_executions;

CREATE POLICY "Service role can insert executions"
  ON public.dca_executions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- (Optional tightening: service_role bypasses RLS by design, so the policy
-- above is effectively belt-and-suspenders. The old policy was dangerous
-- because it targeted ALL roles. Dropping + recreating limits to service_role
-- explicitly, which aids auditability.)

-- Allow users to SELECT their own executions (required for history views).
DROP POLICY IF EXISTS "Users can view own executions" ON public.dca_executions;
CREATE POLICY "Users can view own executions"
  ON public.dca_executions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ─── (2) Atomic counter RPC for DCA total_invested ──────────────
-- Replaces the read-modify-write pattern in `dca-execute/index.ts`:
--   OLD: total_invested = (plan.total_invested || 0) + amount
--   NEW: SELECT increment_dca_total_invested(plan_id, amount)
-- Prevents lost updates when two executions race (cron + user trigger).

CREATE OR REPLACE FUNCTION public.increment_dca_total_invested(
  p_plan_id uuid,
  p_amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_total numeric;
BEGIN
  UPDATE public.dca_plans
    SET total_invested = COALESCE(total_invested, 0) + p_amount,
        updated_at = now()
  WHERE id = p_plan_id
  RETURNING total_invested INTO new_total;

  IF new_total IS NULL THEN
    RAISE EXCEPTION 'DCA plan % not found', p_plan_id;
  END IF;

  RETURN new_total;
END;
$$;

-- Only service_role (edge functions) may call this. Regular users cannot
-- arbitrarily bump their own total_invested.
REVOKE ALL ON FUNCTION public.increment_dca_total_invested(uuid, numeric) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_dca_total_invested(uuid, numeric) TO service_role;

COMMENT ON FUNCTION public.increment_dca_total_invested(uuid, numeric) IS
  'Atomic counter increment for DCA plan total_invested. Service-role only. See migration 009.';
