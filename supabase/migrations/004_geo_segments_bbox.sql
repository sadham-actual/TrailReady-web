-- Bulk segment geometry fetch for map rendering
-- Returns all trail segments with real geometry, optionally filtered by bbox
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
