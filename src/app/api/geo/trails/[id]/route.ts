import { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { errors, successResponse } from '@/lib/api/response';

type GeoTrailSegmentAttributionRow = {
  source_slug: string | null;
  source_name: string | null;
  attribution_text: string | null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const [{ data: trail, error: trailErr }, { data: rows, error: rowsErr }] = await Promise.all([
    supabase.from('geo_trails').select('*').eq('id', id).maybeSingle(),
    supabase.rpc('geo_trail_segments', { p_trail_id: id }),
  ]);

  if (trailErr) return errors.internalError(trailErr.message);
  if (rowsErr) return errors.internalError(rowsErr.message);
  if (!trail) return errors.notFound('Trail');

  const attributions = Array.from(
    new Map(((rows ?? []) as GeoTrailSegmentAttributionRow[]).map((r) => [r.source_slug, {
      source_slug: r.source_slug,
      source_name: r.source_name,
      attribution_text: r.attribution_text,
    }])).values()
  );

  return successResponse({
    id: trail.id,
    name: trail.name,
    description: trail.description,
    status: trail.status,
    allowed_uses: trail.allowed_uses,
    properties: trail.properties,
    segments: rows ?? [],
    attributions,
  });
}
