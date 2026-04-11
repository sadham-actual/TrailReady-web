import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { errors } from '@/lib/api/response';
import { collectAttributions, mapRpcRowsToPipelineSegments, asDownloadFilename } from '@/lib/pipeline/geoApi';
import { generateGpx } from '@/services/pipeline/gpxGenerator';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseServiceClient();

  const [{ data: trail, error: trailErr }, { data: rows, error: rowsErr }] = await Promise.all([
    supabase.from('geo_trails').select('id,name,description').eq('id', id).maybeSingle(),
    supabase.rpc('geo_trail_segments', { p_trail_id: id }),
  ]);

  if (trailErr) return errors.internalError(trailErr.message);
  if (rowsErr) return errors.internalError(rowsErr.message);
  if (!trail) return errors.notFound('Trail');

  const segments = mapRpcRowsToPipelineSegments(rows ?? []);
  const attributions = collectAttributions(rows ?? []);

  const gpx = generateGpx({
    name: trail.name,
    description: trail.description ?? undefined,
    segments,
    attributions,
  });

  return new NextResponse(gpx.gpx, {
    status: 200,
    headers: {
      'Content-Type': 'application/gpx+xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${asDownloadFilename(trail.name, 'trail')}"`,
      'Cache-Control': 'public, max-age=60',
    },
  });
}
