-- ============================================================
-- TrailReady Security Fixes
-- Migration: 006_security_fixes.sql
-- Resolves all Supabase security advisor findings:
--   1. waitlist RLS disabled (ERROR)
--   2. v_source_stats SECURITY DEFINER view (ERROR)
--   3. trip_bundle_trails RLS enabled but no policies (INFO)
--   4. Mutable search_path on 4 RPC functions (WARN x4)
-- Note: leaked password protection must be enabled in the
--       Supabase dashboard under Auth > Password Settings.
-- ============================================================


-- ============================================================
-- 1. Enable RLS on waitlist + public insert policy
--    Anyone can submit their email; only service role can read.
-- ============================================================
alter table public.waitlist enable row level security;

do $$ begin
  create policy "waitlist_insert_public"
    on public.waitlist for insert to anon, authenticated
    with check (true);
exception when duplicate_object then null; end $$;


-- ============================================================
-- 2. Fix SECURITY DEFINER view → SECURITY INVOKER
--    Ensures v_source_stats respects the querying user's RLS
--    permissions rather than the view creator's.
-- ============================================================
create or replace view public.v_source_stats
  with (security_invoker = true)
as
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
-- 3. Add RLS policies for trip_bundle_trails
--    Users can only manage trails belonging to their own bundles.
-- ============================================================
do $$ begin
  create policy "trip_bundle_trails_owner_all"
    on public.trip_bundle_trails for all to authenticated
    using (
      trip_bundle_id in (
        select id from public.trip_bundles
        where user_id = auth.uid()::text
      )
    )
    with check (
      trip_bundle_id in (
        select id from public.trip_bundles
        where user_id = auth.uid()::text
      )
    );
exception when duplicate_object then null; end $$;


-- ============================================================
-- 4. Fix mutable search_path on all 4 RPC functions
--    Pins search_path to 'public, extensions' so callers cannot
--    inject a malicious schema. PostGIS operators require
--    'extensions' to be in the path and cannot be schema-qualified.
-- ============================================================

create or replace function public.geo_trails_in_bbox(
  p_min_lng double precision default null,
  p_min_lat double precision default null,
  p_max_lng double precision default null,
  p_max_lat double precision default null,
  p_limit int default 50
)
returns table (
  id uuid,
  name text,
  status text,
  source_slug text,
  source_name text,
  attribution_text text,
  center_lng double precision,
  center_lat double precision,
  length_m double precision
)
language sql
stable
set search_path = public, extensions
as $$
  with seg as (
    select
      tts.trail_id,
      ts.geom,
      s.slug as source_slug,
      s.name as source_name,
      coalesce((s.properties->>'attribution_text')::text, s.name) as attribution_text
    from public.trail_trail_segments tts
    join public.trail_segments ts on ts.id = tts.segment_id
    left join public.sources s on s.id = ts.source_id
  ), agg as (
    select
      gt.id,
      gt.name,
      gt.status,
      min(seg.source_slug) as source_slug,
      min(seg.source_name) as source_name,
      min(seg.attribution_text) as attribution_text,
      ST_X(ST_Centroid(ST_Collect(seg.geom))) as center_lng,
      ST_Y(ST_Centroid(ST_Collect(seg.geom))) as center_lat,
      sum(ST_Length(seg.geom::geography)) as length_m
    from public.geo_trails gt
    left join seg on seg.trail_id = gt.id
    group by gt.id, gt.name, gt.status
  )
  select *
  from agg
  where (
    p_min_lng is null or p_min_lat is null or p_max_lng is null or p_max_lat is null
    or (
      center_lng between p_min_lng and p_max_lng
      and center_lat between p_min_lat and p_max_lat
    )
  )
  order by name asc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

create or replace function public.geo_trail_segments(p_trail_id uuid)
returns table (
  trail_id uuid,
  trail_name text,
  trail_status text,
  segment_id uuid,
  sort_order int,
  reversed boolean,
  source_slug text,
  source_name text,
  attribution_text text,
  segment_name text,
  segment_status text,
  allowed_uses jsonb,
  properties jsonb,
  geometry jsonb
)
language sql
stable
set search_path = public, extensions
as $$
  select
    gt.id as trail_id,
    gt.name as trail_name,
    gt.status as trail_status,
    ts.id as segment_id,
    tts.sort_order,
    tts.reversed,
    s.slug as source_slug,
    s.name as source_name,
    coalesce((s.properties->>'attribution_text')::text, s.name) as attribution_text,
    ts.name as segment_name,
    ts.status as segment_status,
    ts.allowed_uses,
    ts.properties,
    ST_AsGeoJSON(ts.geom)::jsonb as geometry
  from public.geo_trails gt
  join public.trail_trail_segments tts on tts.trail_id = gt.id
  join public.trail_segments ts on ts.id = tts.segment_id
  left join public.sources s on s.id = ts.source_id
  where gt.id = p_trail_id
  order by tts.sort_order asc;
$$;

create or replace function public.geo_route_segments(p_route_id uuid)
returns table (
  route_id uuid,
  route_name text,
  segment_id uuid,
  sort_order int,
  reversed boolean,
  source_slug text,
  source_name text,
  attribution_text text,
  segment_name text,
  segment_status text,
  allowed_uses jsonb,
  properties jsonb,
  geometry jsonb
)
language sql
stable
set search_path = public, extensions
as $$
  select
    r.id as route_id,
    r.name as route_name,
    ts.id as segment_id,
    rs.sort_order,
    rs.reversed,
    s.slug as source_slug,
    s.name as source_name,
    coalesce((s.properties->>'attribution_text')::text, s.name) as attribution_text,
    ts.name as segment_name,
    ts.status as segment_status,
    ts.allowed_uses,
    ts.properties,
    ST_AsGeoJSON(ts.geom)::jsonb as geometry
  from public.routes r
  join public.route_segments rs on rs.route_id = r.id
  join public.trail_segments ts on ts.id = rs.segment_id
  left join public.sources s on s.id = ts.source_id
  where r.id = p_route_id
  order by rs.sort_order asc;
$$;

create or replace function public.geo_segments_in_bbox(
  p_min_lng double precision default null,
  p_min_lat double precision default null,
  p_max_lng double precision default null,
  p_max_lat double precision default null,
  p_limit int default 1000
)
returns table (
  trail_id   uuid,
  trail_name text,
  trail_status text,
  segment_id uuid,
  geometry   jsonb
)
language sql
stable
set search_path = public, extensions
as $$
  select
    tts.trail_id,
    gt.name  as trail_name,
    gt.status as trail_status,
    ts.id    as segment_id,
    ST_AsGeoJSON(ts.geom)::jsonb as geometry
  from public.trail_trail_segments tts
  join public.trail_segments ts  on ts.id  = tts.segment_id
  join public.geo_trails    gt   on gt.id  = tts.trail_id
  where (
    p_min_lng is null
    or p_min_lat is null
    or p_max_lng is null
    or p_max_lat is null
    or ts.geom && ST_MakeEnvelope(p_min_lng, p_min_lat, p_max_lng, p_max_lat, 4326)
  )
  order by gt.name asc, tts.sort_order asc
  limit greatest(1, least(coalesce(p_limit, 1000), 5000));
$$;
