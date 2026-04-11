-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES TABLE
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  goal text,
  experience text,
  risk_tolerance text,
  capital_range text,
  habit_type text,
  preferred_assets text,
  investor_type text,
  setup_progress jsonb default '{}'::jsonb,
  unlock_state jsonb default '{}'::jsonb,
  subscription_tier text default 'free',
  days_active integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- PORTFOLIOS TABLE
create table public.portfolios (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  name text,
  allocations jsonb not null, -- Array of { asset, percentage }
  is_selected boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.portfolios enable row level security;

create policy "Users can view own portfolios" on public.portfolios
  for select using (auth.uid() = user_id);

create policy "Users can insert own portfolios" on public.portfolios
  for insert with check (auth.uid() = user_id);

create policy "Users can update own portfolios" on public.portfolios
  for update using (auth.uid() = user_id);

create policy "Users can delete own portfolios" on public.portfolios
  for delete using (auth.uid() = user_id);

-- DCA PLANS TABLE
create table public.dca_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  assets jsonb not null, -- Array of { symbol, allocation }
  amount_per_interval numeric not null,
  frequency text not null,
  duration_days integer, -- null for indefinite
  start_date timestamp with time zone not null,
  is_active boolean default true,
  total_invested numeric default 0,
  next_execution_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.dca_plans enable row level security;

create policy "Users can view own dca plans" on public.dca_plans
  for select using (auth.uid() = user_id);

create policy "Users can insert own dca plans" on public.dca_plans
  for insert with check (auth.uid() = user_id);

create policy "Users can update own dca plans" on public.dca_plans
  for update using (auth.uid() = user_id);

create policy "Users can delete own dca plans" on public.dca_plans
  for delete using (auth.uid() = user_id);

-- FUNCTION TO HANDLE NEW USER SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- TRIGGER FOR NEW USER SIGNUP
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TRANSACTIONS TABLE
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  asset_symbol text not null, -- e.g. BTC, ETH
  type text not null check (type in ('buy', 'sell')),
  amount numeric not null, -- Quantity of asset
  price_per_unit numeric not null, -- Price at time of transaction
  date timestamp with time zone not null,
  fees numeric default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "Users can view own transactions" on public.transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "Users can update own transactions" on public.transactions
  for update using (auth.uid() = user_id);

create policy "Users can delete own transactions" on public.transactions
  for delete using (auth.uid() = user_id);

-- ============================================================
-- EXPLOSIVE PICKS — AI-Scored Crypto Universe
-- ============================================================

-- Curated coin universe managed by scoring pipeline
create table public.explosive_universe (
  id uuid default uuid_generate_v4() primary key,
  coin_id text not null unique,
  symbol text not null,
  name text not null,
  defillama_slug text,
  bybit_symbol text,
  sector text not null check (sector in ('defi','l1','l2','ai','gaming','meme','rwa','infra')),
  is_active boolean default true,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Computed scores, refreshed every 4 hours
create table public.explosive_scores (
  id uuid default uuid_generate_v4() primary key,
  coin_id text not null references public.explosive_universe(coin_id) on delete cascade,
  total_score numeric not null,
  fundamental_score numeric default 0,
  momentum_score numeric default 0,
  market_position_score numeric default 0,
  risk_score numeric default 0,
  narrative_score numeric default 0,
  timing_score numeric default 0,
  risk_level text not null check (risk_level in ('conservative','balanced','high','extreme')),
  rationale text,
  buying_strategy jsonb,
  raw_metrics jsonb,
  computed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (coin_id)
);

-- Historical snapshots for computing deltas (social, TVL, volume)
create table public.coin_snapshots (
  id uuid default uuid_generate_v4() primary key,
  coin_id text not null,
  twitter_followers integer,
  reddit_subscribers integer,
  tvl numeric,
  volume_24h numeric,
  market_cap numeric,
  snapshot_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_coin_snapshots_coin_id on public.coin_snapshots (coin_id, snapshot_at desc);
create index idx_explosive_scores_total on public.explosive_scores (total_score desc);

-- RLS: explosive tables are read-only for authenticated users
alter table public.explosive_universe enable row level security;
alter table public.explosive_scores enable row level security;
alter table public.coin_snapshots enable row level security;

create policy "Authenticated users can read universe" on public.explosive_universe
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can read scores" on public.explosive_scores
  for select using (auth.role() = 'authenticated');

create policy "Snapshots are system-only" on public.coin_snapshots
  for select using (auth.role() = 'service_role');
