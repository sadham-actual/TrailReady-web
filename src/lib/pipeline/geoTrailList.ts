import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { ParsedBbox } from '@/lib/pipeline/geoApi';
import { GeoMappedTrail, mapGeoTrailListRowToTrail } from '@/lib/pipeline/geoTrailAdapters';

export interface GeoTrailListItem {
  id: string;
  name: string;
  status: string | null;
  center: { lng: number; lat: number } | null;
  length_m: number;
  attribution: {
    source_slug: string | null;
    source_name: string | null;
    attribution_text: string | null;
  };
}

export async function fetchGeoTrailRpcRows(options?: { bbox?: ParsedBbox | null; limit?: number }) {
  const supabase = createSupabaseServiceClient();
  const bbox = options?.bbox;
  const limit = options?.limit ?? 50;

  const { data, error } = await supabase.rpc('geo_trails_in_bbox', {
    p_min_lng: bbox?.minLng ?? null,
    p_min_lat: bbox?.minLat ?? null,
    p_max_lng: bbox?.maxLng ?? null,
    p_max_lat: bbox?.maxLat ?? null,
    p_limit: Number.isFinite(limit) ? limit : 50,
  });

  if (error) throw error;
  return data ?? [];
}

export function mapGeoTrailRpcRowsToApiList(rows: any[]): GeoTrailListItem[] {
  return rows.map((r: any) => ({
    id: String(r.id),
    name: r.name,
    status: r.status ?? null,
    center: r.center_lng != null && r.center_lat != null ? { lng: r.center_lng, lat: r.center_lat } : null,
    length_m: r.length_m ?? 0,
    attribution: {
      source_slug: r.source_slug ?? null,
      source_name: r.source_name ?? null,
      attribution_text: r.attribution_text ?? null,
    },
  }));
}

export function mapGeoTrailRpcRowsToTrails(rows: any[]): GeoMappedTrail[] {
  return rows.map((r: any) =>
    mapGeoTrailListRowToTrail({
      id: r.id,
      name: r.name,
      status: r.status,
      center_lat: r.center_lat ?? null,
      center_lng: r.center_lng ?? null,
      source_name: r.source_name,
      source_slug: r.source_slug,
    })
  );
}
