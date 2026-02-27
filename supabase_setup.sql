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
