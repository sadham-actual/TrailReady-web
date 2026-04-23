import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { errors, successResponse } from '@/lib/api/response';
import { parseBbox } from '@/lib/pipeline/geoApi';
import { LatLng } from '@/types';

export interface GeoSegmentRow {
  trailId: string;
  trailName: string;
  trailStatus: string | null;
  coords: LatLng[]; // [lat, lng] pairs, Leaflet order
}

type GeoSegmentRpcRow = {
  trail_id: string;
  trail_name: string;
  trail_status: string | null;
  geometry?: {
    coordinates?: [number, number][];
  } | null;
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const bbox = parseBbox(request.nextUrl.searchParams.get('bbox'));
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 2000);

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.rpc('geo_segments_in_bbox', {
      p_min_lng: bbox?.minLng ?? null,
      p_min_lat: bbox?.minLat ?? null,
      p_max_lng: bbox?.maxLng ?? null,
      p_max_lat: bbox?.maxLat ?? null,
      p_limit: Math.min(limit, 5000),
    });

    if (error) return errors.internalError(error.message);

    // Group segments by trail, converting GeoJSON [lng,lat] → Leaflet [lat,lng]
    const byTrail = new Map<string, GeoSegmentRow>();

    for (const row of (data ?? []) as GeoSegmentRpcRow[]) {
      const coords = (row.geometry?.coordinates ?? []) as [number, number][];
      const latLngs: LatLng[] = coords
        .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat))
        .map(([lng, lat]) => [lat, lng]);

      if (latLngs.length < 2) continue;

      const existing = byTrail.get(row.trail_id);
      if (existing) {
        existing.coords.push(...latLngs);
      } else {
        byTrail.set(row.trail_id, {
          trailId: String(row.trail_id),
          trailName: row.trail_name,
          trailStatus: row.trail_status ?? null,
          coords: latLngs,
        });
      }
    }

    return successResponse([...byTrail.values()]);
  } catch (error: unknown) {
    return errors.internalError(error instanceof Error ? error.message : 'Failed to fetch segments');
  }
}
