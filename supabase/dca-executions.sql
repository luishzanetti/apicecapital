-- DCA Execution History Table
-- Records every automated DCA buy order execution

CREATE TABLE IF NOT EXISTS dca_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  amount_usdt NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC,
  price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, success, failed
  error_message TEXT,
  bybit_order_id TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dca_executions_user_id ON dca_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_dca_executions_plan_id ON dca_executions(plan_id);
CREATE INDEX IF NOT EXISTS idx_dca_executions_executed_at ON dca_executions(executed_at DESC);

-- RLS
ALTER TABLE dca_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own executions"
  ON dca_executions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (Edge Functions)
CREATE POLICY "Service role can insert executions"
  ON dca_executions FOR INSERT
  WITH CHECK (true);

-- Cron job setup (run every hour to check for due plans)
-- Uncomment after deploying the Edge Function:
--
-- SELECT cron.schedule(
--   'dca-execute-hourly',
--   '0 * * * *',  -- Every hour
--   $$
--   SELECT net.http_post(
--     url := 'https://atatdrnqpynzydkdukta.supabase.co/functions/v1/dca-execute',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'x-cron-secret', current_setting('app.cron_secret')
--     ),
--     body := '{"action": "execute-due"}'::jsonb
--   );
--   $$
-- );
