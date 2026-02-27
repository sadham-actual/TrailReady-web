import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { errors, successResponse } from '@/lib/api/response';
import { parseBbox } from '@/lib/pipeline/geoApi';

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 50);
    const bbox = parseBbox(request.nextUrl.searchParams.get('bbox'));

    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase.rpc('geo_trails_in_bbox', {
      p_min_lng: bbox?.minLng ?? null,
      p_min_lat: bbox?.minLat ?? null,
      p_max_lng: bbox?.maxLng ?? null,
      p_max_lat: bbox?.maxLat ?? null,
      p_limit: Number.isFinite(limit) ? limit : 50,
    });

    if (error) return errors.internalError(error.message);

    const mapped = (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      center: r.center_lng != null && r.center_lat != null ? { lng: r.center_lng, lat: r.center_lat } : null,
      length_m: r.length_m ?? 0,
      attribution: {
        source_slug: r.source_slug,
        source_name: r.source_name,
        attribution_text: r.attribution_text,
      },
    }));

    return successResponse(mapped);
  } catch (e) {
    return errors.internalError('Failed to fetch geo trails');
  }
}
