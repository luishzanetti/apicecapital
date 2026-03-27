-- ============================================
-- APICE CAPITAL — FULL DATABASE SETUP
-- Cole tudo isso no SQL Editor do Supabase
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  goal TEXT,
  experience TEXT,
  risk_tolerance TEXT,
  capital_range TEXT,
  habit_type TEXT,
  preferred_assets TEXT,
  investor_type TEXT,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  onboarding_skipped BOOLEAN DEFAULT FALSE,
  setup_progress JSONB DEFAULT '{}'::jsonb,
  unlock_state JSONB DEFAULT '{}'::jsonb,
  mission_progress JSONB DEFAULT '{}'::jsonb,
  subscription_tier TEXT DEFAULT 'free',
  weekly_investment NUMERIC DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. PORTFOLIOS TABLE
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  allocations JSONB DEFAULT '[]'::jsonb,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own portfolios" ON public.portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolios" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolios" ON public.portfolios FOR DELETE USING (auth.uid() = user_id);

-- 3. DCA PLANS TABLE
CREATE TABLE IF NOT EXISTS public.dca_plans (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  assets JSONB DEFAULT '[]'::jsonb,
  amount_per_interval NUMERIC NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER,
  start_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  total_invested NUMERIC DEFAULT 0,
  next_execution_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.dca_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own dca plans" ON public.dca_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dca plans" ON public.dca_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dca plans" ON public.dca_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dca plans" ON public.dca_plans FOR DELETE USING (auth.uid() = user_id);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  asset_symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  amount NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  fees NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- 5. BYBIT CREDENTIALS TABLE
CREATE TABLE IF NOT EXISTS public.bybit_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  testnet BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bybit_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credentials" ON public.bybit_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credentials" ON public.bybit_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credentials" ON public.bybit_credentials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own credentials" ON public.bybit_credentials FOR DELETE USING (auth.uid() = user_id);

-- 6. DCA EXECUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.dca_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_symbol TEXT NOT NULL,
  amount_usdt NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC,
  price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  bybit_order_id TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dca_executions_user_id ON dca_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_dca_executions_plan_id ON dca_executions(plan_id);
CREATE INDEX IF NOT EXISTS idx_dca_executions_executed_at ON dca_executions(executed_at DESC);

ALTER TABLE public.dca_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own executions" ON public.dca_executions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert executions" ON public.dca_executions FOR INSERT WITH CHECK (true);

-- 7. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- DONE! All 6 tables + RLS + trigger created.
-- ============================================
