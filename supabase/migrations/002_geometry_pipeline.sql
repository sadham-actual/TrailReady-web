-- ============================================================
-- TrailReady Stage 1: Normalized Geometry Pipeline Schema
-- Migration: 002_geometry_pipeline.sql
-- Requires: PostGIS extension (enabled in Supabase by default)
-- ============================================================

-- Enable PostGIS if not already active (no-op if already enabled)
create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- Helper: updated_at trigger function
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- sources
-- Represents a raw geospatial data source (OSM, USFS, Caltopo, etc.)
-- ============================================================
create table if not exists public.sources (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,           -- machine-readable name, e.g. 'osm', 'usfs'
  name          text not null,                  -- display name, e.g. 'OpenStreetMap'
  url           text,                           -- homepage / API base URL
  license       text,                           -- SPDX or free-text license string
  description   text,
  properties    jsonb not null default '{}',    -- arbitrary source-level metadata
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_sources_slug on public.sources(slug);

do $$ begin
  create trigger trg_sources_updated_at
    before update on public.sources
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ============================================================
-- trail_segments
-- A single, deduplicated geometry segment with provenance info.
-- This is the atomic unit of the geometry pipeline.
-- ============================================================
create table if not exists public.trail_segments (
  id                uuid primary key default gen_random_uuid(),

  -- Provenance / deduplication
  source_id         uuid references public.sources(id) on delete set null,
  source_feature_id text,                        -- original ID in the source dataset
  geom_hash         text,                        -- hex-encoded SHA-256 of canonical WKB geometry
                                                 -- used for dedup: unique per source+geom

  -- Geometry (WGS84 / EPSG:4326)
  geom              geometry(LineString, 4326) not null,

  -- Surface & trail attributes
  name              text,
  surface           text,                        -- 'paved','gravel','dirt','rock','sand', etc.
  difficulty        text,                        -- 'easy','moderate','hard','extreme'
  allowed_uses      jsonb not null default '{}', -- e.g. {"4wd":true,"atv":false,"hiking":true}
  status            text not null default 'unknown', -- 'open','closed','seasonal','unknown'

  -- Flexible source properties
  properties        jsonb not null default '{}',

  -- Bookkeeping
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Spatial index (primary lookups by bounding box / geometry)
create index if not exists idx_trail_segments_geom
  on public.trail_segments using gist(geom);

-- Dedup / provenance lookups
create index if not exists idx_trail_segments_source
  on public.trail_segments(source_id);
create index if not exists idx_trail_segments_source_feature
  on public.trail_segments(source_id, source_feature_id)
  where source_feature_id is not null;
create index if not exists idx_trail_segments_geom_hash
  on public.trail_segments(geom_hash)
  where geom_hash is not null;

-- Filtering indexes
create index if not exists idx_trail_segments_status
  on public.trail_segments(status);
create index if not exists idx_trail_segments_difficulty
  on public.trail_segments(difficulty)
  where difficulty is not null;

do $$ begin
  create trigger trg_trail_segments_updated_at
    before update on public.trail_segments
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ============================================================
-- trails
-- A logical trail: a named, curated collection of segments.
-- The existing public.trails table (from 001) is preserved
-- unchanged. This table is the geometry-pipeline version and
-- is intentionally separate to avoid breaking the app.
-- ============================================================
create table if not exists public.geo_trails (
  id                uuid primary key default gen_random_uuid(),

  -- Identity
  name              text not null,
  slug              text unique,                 -- URL-safe identifier
  region            text,

  -- Provenance / deduplication
  source_id         uuid references public.sources(id) on delete set null,
  source_feature_id text,                        -- ID in the source dataset (if trail-level)
  geom_hash         text,                        -- hash of concatenated segment geometries

  -- Bounding geometry (derived, for fast spatial filtering)
  bbox              geometry(Polygon, 4326),

  -- Trail-level attributes
  difficulty        text,
  allowed_uses      jsonb not null default '{}',
  status            text not null default 'unknown',
  surface           text,

  -- Flexible metadata
  properties        jsonb not null default '{}',
  description       text,
  tags              text[] not null default '{}',

  -- Bookkeeping
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_geo_trails_bbox
  on public.geo_trails using gist(bbox)
  where bbox is not null;
create index if not exists idx_geo_trails_region
  on public.geo_trails(region)
  where region is not null;
create index if not exists idx_geo_trails_slug
  on public.geo_trails(slug)
  where slug is not null;
create index if not exists idx_geo_trails_status
  on public.geo_trails(status);
create index if not exists idx_geo_trails_source
  on public.geo_trails(source_id)
  where source_id is not null;
create index if not exists idx_geo_trails_source_feature
  on public.geo_trails(source_id, source_feature_id)
  where source_feature_id is not null;
create index if not exists idx_geo_trails_geom_hash
  on public.geo_trails(geom_hash)
  where geom_hash is not null;
create index if not exists idx_geo_trails_tags
  on public.geo_trails using gin(tags);

do $$ begin
  create trigger trg_geo_trails_updated_at
    before update on public.geo_trails
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ============================================================
-- trail_trail_segments  (join: geo_trails ↔ trail_segments)
-- Ordered mapping of segments that compose a logical trail.
-- ============================================================
create table if not exists public.trail_trail_segments (
  id              uuid primary key default gen_random_uuid(),
  trail_id        uuid not null references public.geo_trails(id) on delete cascade,
  segment_id      uuid not null references public.trail_segments(id) on delete cascade,
  sort_order      int not null default 0,        -- ordering within the trail
  reversed        boolean not null default false, -- traverse segment in reverse direction
  created_at      timestamptz not null default now(),

  unique (trail_id, segment_id)
);

create index if not exists idx_tts_trail
  on public.trail_trail_segments(trail_id);
create index if not exists idx_tts_segment
  on public.trail_trail_segments(segment_id);
create index if not exists idx_tts_trail_order
  on public.trail_trail_segments(trail_id, sort_order);

-- ============================================================
-- routes
-- A planned route: an ordered set of trail segments forming
-- a complete drive/ride plan. May span multiple geo_trails.
-- ============================================================
create table if not exists public.routes (
  id                uuid primary key default gen_random_uuid(),

  -- Identity
  name              text not null,
  slug              text unique,
  description       text,
  region            text,

  -- Provenance
  source_id         uuid references public.sources(id) on delete set null,
  source_feature_id text,
  geom_hash         text,

  -- Bounding geometry
  bbox              geometry(Polygon, 4326),

  -- Route attributes
  difficulty        text,
  allowed_uses      jsonb not null default '{}',
  status            text not null default 'unknown',
  estimated_hours   numeric(6,2),               -- estimated drive time in hours
  distance_meters   numeric(12,2),              -- total distance in meters (denormalized cache)

  -- Flexible metadata
  properties        jsonb not null default '{}',
  tags              text[] not null default '{}',

  -- Bookkeeping
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_routes_bbox
  on public.routes using gist(bbox)
  where bbox is not null;
create index if not exists idx_routes_slug
  on public.routes(slug)
  where slug is not null;
create index if not exists idx_routes_region
  on public.routes(region)
  where region is not null;
create index if not exists idx_routes_status
  on public.routes(status);
create index if not exists idx_routes_source
  on public.routes(source_id)
  where source_id is not null;
create index if not exists idx_routes_source_feature
  on public.routes(source_id, source_feature_id)
  where source_feature_id is not null;
create index if not exists idx_routes_geom_hash
  on public.routes(geom_hash)
  where geom_hash is not null;
create index if not exists idx_routes_tags
  on public.routes using gin(tags);

do $$ begin
  create trigger trg_routes_updated_at
    before update on public.routes
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ============================================================
-- route_segments  (join: routes ↔ trail_segments)
-- Ordered trail segments that compose a route.
-- ============================================================
create table if not exists public.route_segments (
  id              uuid primary key default gen_random_uuid(),
  route_id        uuid not null references public.routes(id) on delete cascade,
  segment_id      uuid not null references public.trail_segments(id) on delete cascade,
  sort_order      int not null default 0,        -- ordering within the route
  reversed        boolean not null default false, -- traverse segment in reverse direction
  created_at      timestamptz not null default now(),

  unique (route_id, segment_id, sort_order)
);

create index if not exists idx_route_segments_route
  on public.route_segments(route_id);
create index if not exists idx_route_segments_segment
  on public.route_segments(segment_id);
create index if not exists idx_route_segments_route_order
  on public.route_segments(route_id, sort_order);

-- ============================================================
-- Helper views (non-materialized, safe for Supabase)
-- ============================================================

-- Quick count / status check per source
create or replace view public.v_source_stats as
select
  s.id          as source_id,
  s.slug        as source_slug,
  s.name        as source_name,
  count(ts.id)  as segment_count,
  max(ts.updated_at) as last_updated
from public.sources s
left join public.trail_segments ts on ts.source_id = s.id
group by s.id, s.slug, s.name;

-- ============================================================
-- Row-level security (additive; app tables unchanged)
-- ============================================================
alter table public.sources            enable row level security;
alter table public.trail_segments     enable row level security;
alter table public.geo_trails         enable row level security;
alter table public.trail_trail_segments enable row level security;
alter table public.routes             enable row level security;
alter table public.route_segments     enable row level security;

-- Public read access for geo data (mirrors existing pattern from 001)
do $$ begin
  create policy "sources_read_all"
    on public.sources for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "trail_segments_read_all"
    on public.trail_segments for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "geo_trails_read_all"
    on public.geo_trails for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "trail_trail_segments_read_all"
    on public.trail_trail_segments for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "routes_read_all"
    on public.routes for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "route_segments_read_all"
    on public.route_segments for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
