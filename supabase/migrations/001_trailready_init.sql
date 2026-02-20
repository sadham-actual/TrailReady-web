-- TrailReady initial schema for Supabase
-- Run in Supabase SQL Editor before using Supabase-backed API routes.

create table if not exists public.users (
  id text primary key,
  created_at timestamptz not null default now(),
  is_anonymous boolean not null default false
);

create table if not exists public.trails (
  id text primary key,
  name text not null,
  region text not null,
  latitude double precision not null,
  longitude double precision not null,
  description text,
  base_difficulty int,
  difficulty_score int,
  terrain_type text,
  min_tire_size double precision,
  required_gear jsonb,
  current_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.condition_reports (
  id text primary key,
  trail_id text not null references public.trails(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  status text not null,
  confidence text not null,
  vehicle_type text not null,
  notes text,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.user_vehicles (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  make text not null,
  model text not null,
  clearance_inches double precision not null,
  tire_size double precision not null,
  has_low_range boolean not null default false,
  has_winch boolean not null default false,
  experience_level text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_bundles (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  scheduled_date timestamptz not null,
  notes text,
  is_offline_cached boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_bundle_trails (
  id text primary key,
  trip_bundle_id text not null references public.trip_bundles(id) on delete cascade,
  trail_id text not null references public.trails(id) on delete cascade,
  sort_order int not null
);

create index if not exists idx_trails_region on public.trails(region);
create index if not exists idx_reports_trail_ts on public.condition_reports(trail_id, timestamp desc);
create index if not exists idx_vehicles_user on public.user_vehicles(user_id);
create index if not exists idx_bundles_user_date on public.trip_bundles(user_id, scheduled_date);

-- Optional basic RLS starter (tighten later):
alter table public.users enable row level security;
alter table public.user_vehicles enable row level security;
alter table public.trip_bundles enable row level security;
alter table public.trip_bundle_trails enable row level security;
alter table public.condition_reports enable row level security;

-- Service role bypasses RLS. These permissive policies are for authenticated client access if needed.
do $$ begin
  create policy "users_select_self" on public.users for select to authenticated using (id = auth.uid()::text);
exception when duplicate_object then null; end $$;
