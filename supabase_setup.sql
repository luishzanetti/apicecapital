-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  goal TEXT,
  experience TEXT,
  risk_tolerance TEXT,
  capital_range TEXT,
  habit_type TEXT,
  preferred_assets TEXT,
  investor_type TEXT,
  has_completed_onboarding BOOLEAN DEFAULT FALSE,
  onboarding_skipped BOOLEAN DEFAULT FALSE,
  mission_progress JSONB DEFAULT '{}'::jsonb,
  weekly_investment NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS public.portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  allocations JSONB DEFAULT '[]'::jsonb,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create dca_plans table
CREATE TABLE IF NOT EXISTS public.dca_plans (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  assets JSONB DEFAULT '[]'::jsonb,
  amount_per_interval NUMERIC NOT NULL,
  frequency TEXT NOT NULL,
  duration_days INTEGER,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  total_invested NUMERIC DEFAULT 0,
  next_execution_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dca_plans ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Portfolios Policies
CREATE POLICY "Users can view own portfolios" ON public.portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own portfolios" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own portfolios" ON public.portfolios FOR DELETE USING (auth.uid() = user_id);

-- DCA Plans Policies
CREATE POLICY "Users can view own dca plans" ON public.dca_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dca plans" ON public.dca_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dca plans" ON public.dca_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dca plans" ON public.dca_plans FOR DELETE USING (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- SECURITY FIX: Missing RLS policies for additional tables
-- These tables are accessed by the client but were missing
-- from the original setup script.
-- ============================================================

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  asset_symbol TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  price_per_unit NUMERIC NOT NULL CHECK (price_per_unit >= 0),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Bybit Credentials table (SENSITIVE — stores encrypted API secrets)
CREATE TABLE IF NOT EXISTS public.bybit_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  testnet BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bybit_credentials ENABLE ROW LEVEL SECURITY;
-- Users can only manage their own credentials
CREATE POLICY "Users can view own credentials" ON public.bybit_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credentials" ON public.bybit_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credentials" ON public.bybit_credentials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own credentials" ON public.bybit_credentials FOR DELETE USING (auth.uid() = user_id);

-- DCA Executions table
CREATE TABLE IF NOT EXISTS public.dca_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  asset_symbol TEXT NOT NULL,
  amount_usdt NUMERIC NOT NULL,
  quantity NUMERIC,
  price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  bybit_order_id TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.dca_executions ENABLE ROW LEVEL SECURITY;
-- Users can only view their own executions; inserts happen via Edge Functions (service_role)
CREATE POLICY "Users can view own executions" ON public.dca_executions FOR SELECT USING (auth.uid() = user_id);

-- Analytics Events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  page TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
-- Allow authenticated users to insert events only — no read/update/delete from client
CREATE POLICY "Authenticated users can insert events" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- PROFIT ENGINE: Smart DCA Override + Trade Orders
-- ============================================================

-- Smart DCA override column on dca_plans
-- Stores regime-adjusted amount and allocation overrides applied by user
-- Consumed and cleared by dca-execute Edge Function after execution
ALTER TABLE public.dca_plans
  ADD COLUMN IF NOT EXISTS smart_dca_override JSONB DEFAULT NULL;

-- Trade Orders table (sell orders, take-profit, stop-loss)
CREATE TABLE IF NOT EXISTS public.trade_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  asset_symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'take_profit', 'stop_loss')),
  amount_usdt NUMERIC,
  quantity NUMERIC,
  target_price NUMERIC,
  trigger_price NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'filled', 'cancelled', 'failed')),
  bybit_order_id TEXT,
  fill_price NUMERIC,
  fill_quantity NUMERIC,
  realized_pnl NUMERIC,
  cost_basis NUMERIC,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'smart_dca', 'rebalance', 'war_chest', 'take_profit_rule')),
  market_regime TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  filled_at TIMESTAMPTZ
);

ALTER TABLE public.trade_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own trades" ON public.trade_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trades" ON public.trade_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON public.trade_orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trades" ON public.trade_orders FOR DELETE USING (auth.uid() = user_id);
