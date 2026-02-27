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

  const [{ data: route, error: routeErr }, { data: rows, error: rowsErr }] = await Promise.all([
    supabase.from('routes').select('id,name,description').eq('id', id).maybeSingle(),
    supabase.rpc('geo_route_segments', { p_route_id: id }),
  ]);

  if (routeErr) return errors.internalError(routeErr.message);
  if (rowsErr) return errors.internalError(rowsErr.message);
  if (!route) return errors.notFound('Route');

  const segments = mapRpcRowsToPipelineSegments(rows ?? []);
  const attributions = collectAttributions(rows ?? []);

  const gpx = generateGpx({
    name: route.name,
    description: route.description ?? undefined,
    segments,
    attributions,
  });

  return new NextResponse(gpx.gpx, {
    status: 200,
    headers: {
      'Content-Type': 'application/gpx+xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${asDownloadFilename(route.name, 'route')}"`,
      'Cache-Control': 'public, max-age=60',
    },
  });
}
