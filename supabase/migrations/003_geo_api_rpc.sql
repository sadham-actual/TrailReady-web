-- Stage 4 helper RPCs for geo API endpoints

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
