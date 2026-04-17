-- ═══════════════════════════════════════════════════════════════════
-- V2 FOUNDATION: Education + Balance Monitoring + Transfers
-- Migration: 006_v2_foundation.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─── A. Education Platform ─────────────────────────────────────────

create table public.learning_tracks (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  description text,
  tier text not null default 'free' check (tier in ('free','pro','club')),
  "order" integer not null default 0,
  icon text,
  color_theme text default 'primary',
  is_active boolean default true,
  xp_total integer default 0,
  lesson_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_tracks_order on public.learning_tracks ("order", tier);

create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  track_id uuid not null references public.learning_tracks(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text,
  content_md text,
  content_blocks jsonb,
  video_url text,
  video_provider text check (video_provider in ('mux','bunny','youtube','r2','none')) default 'none',
  video_duration_sec integer,
  duration_min integer default 4,
  xp integer not null default 50,
  quiz jsonb,
  challenge jsonb,
  "order" integer not null default 0,
  is_published boolean default true,
  required_tier text default 'free' check (required_tier in ('free','pro','club')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (track_id, slug)
);
create index idx_lessons_track on public.lessons (track_id, "order");

create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed','failed')),
  score numeric,
  attempts integer default 0,
  time_spent_sec integer default 0,
  completed_at timestamptz,
  first_viewed_at timestamptz default now(),
  last_viewed_at timestamptz default now(),
  primary key (user_id, lesson_id)
);
create index idx_lesson_progress_user on public.lesson_progress (user_id, completed_at desc);

create table public.badges (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  rarity text not null default 'common' check (rarity in ('common','rare','epic','legendary','mythic')),
  unlock_condition_json jsonb not null,
  xp_reward integer default 0,
  created_at timestamptz default now()
);

create table public.challenges (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  description text,
  type text not null check (type in ('daily','weekly','seasonal','evergreen','cohort')),
  rules_json jsonb not null,
  reward_xp integer default 0,
  badge_id uuid references public.badges(id) on delete set null,
  active_from timestamptz,
  active_to timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table public.challenge_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  progress_json jsonb default '{}'::jsonb,
  started_at timestamptz default now(),
  completed_at timestamptz,
  primary key (user_id, challenge_id)
);

create table public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz default now(),
  context_json jsonb,
  primary key (user_id, badge_id)
);

create table public.user_xp (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  total_xp integer not null default 0,
  level integer not null default 1,
  title text default 'Novice',
  current_streak integer default 0,
  longest_streak integer default 0,
  last_active_date date,
  lessons_completed integer default 0,
  tracks_completed integer default 0,
  updated_at timestamptz default now()
);

-- ─── B. Balance Monitoring ─────────────────────────────────────────

create table public.balance_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_type text not null check (account_type in ('UNIFIED','FUND','SPOT','TOTAL')),
  total_usd numeric not null default 0,
  available_usd numeric not null default 0,
  locked_usd numeric default 0,
  holdings_json jsonb,
  captured_at timestamptz not null default now()
);
create index idx_balance_snapshots_user on public.balance_snapshots (user_id, captured_at desc);

create table public.fund_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.dca_plans(id) on delete cascade,
  severity text not null check (severity in ('info','warning','critical','blocked')),
  code text not null,
  message text not null,
  context_json jsonb,
  triggered_at timestamptz default now(),
  resolved_at timestamptz,
  dismissed_at timestamptz
);
create index idx_fund_alerts_active on public.fund_alerts (user_id, resolved_at) where resolved_at is null;

-- ─── C. Transfers ──────────────────────────────────────────────────

create table public.account_transfers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  from_account text not null check (from_account in ('SPOT','UNIFIED','FUND','CONTRACT')),
  to_account text not null check (to_account in ('SPOT','UNIFIED','FUND','CONTRACT')),
  coin text not null,
  amount numeric not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','success','failed','cancelled')),
  bybit_txn_id text,
  error_code text,
  error_message text,
  initiated_from text check (initiated_from in ('manual','auto_dca','auto_altis','auto_balance_rebalance')),
  created_at timestamptz default now(),
  completed_at timestamptz
);
create index idx_transfers_user on public.account_transfers (user_id, created_at desc);

-- ─── D. RLS Policies ───────────────────────────────────────────────

alter table public.learning_tracks enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_progress enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.user_xp enable row level security;
alter table public.balance_snapshots enable row level security;
alter table public.fund_alerts enable row level security;
alter table public.account_transfers enable row level security;

create policy "tracks_read" on public.learning_tracks for select using (auth.role() = 'authenticated');
create policy "lessons_read" on public.lessons for select using (auth.role() = 'authenticated' and is_published);
create policy "challenges_read" on public.challenges for select using (auth.role() = 'authenticated' and is_active);
create policy "badges_read" on public.badges for select using (auth.role() = 'authenticated');
create policy "lesson_progress_own" on public.lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "challenge_progress_own" on public.challenge_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_badges_read" on public.user_badges for select using (auth.uid() = user_id);
create policy "user_badges_insert_system" on public.user_badges for insert with check (auth.role() = 'service_role');
create policy "user_xp_own" on public.user_xp for select using (auth.uid() = user_id);
create policy "user_xp_update_system" on public.user_xp for all using (auth.role() = 'service_role');
create policy "balance_snapshots_own" on public.balance_snapshots for select using (auth.uid() = user_id);
create policy "balance_snapshots_insert_system" on public.balance_snapshots for insert with check (auth.role() = 'service_role');
create policy "fund_alerts_own" on public.fund_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transfers_own" on public.account_transfers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── E. Triggers ───────────────────────────────────────────────────

create or replace function public.init_user_xp()
returns trigger as $$
begin
  insert into public.user_xp (user_id, total_xp, level, title)
  values (new.id, 0, 1, 'Novice')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_init_xp
  after insert on public.profiles
  for each row execute procedure public.init_user_xp();

-- ─── F. Helper Functions ───────────────────────────────────────────

create or replace function public.calculate_level(xp integer)
returns table (level integer, title text, next_threshold integer) as $$
begin
  return query
  select
    case
      when xp >= 6000 then 6 when xp >= 3500 then 5
      when xp >= 1800 then 4 when xp >= 800 then 3
      when xp >= 300 then 2 else 1
    end,
    case
      when xp >= 6000 then 'Elite' when xp >= 3500 then 'Master'
      when xp >= 1800 then 'Strategist' when xp >= 800 then 'Navigator'
      when xp >= 300 then 'Apprentice' else 'Novice'
    end,
    case
      when xp >= 6000 then 999999 when xp >= 3500 then 6000
      when xp >= 1800 then 3500 when xp >= 800 then 1800
      when xp >= 300 then 800 else 300
    end;
end;
$$ language plpgsql immutable;

-- ═══════════════════════════════════════════════════════════════════
-- END MIGRATION 006
-- ═══════════════════════════════════════════════════════════════════
