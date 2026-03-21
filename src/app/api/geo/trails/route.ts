import { NextRequest } from 'next/server';
import { errors, successResponse } from '@/lib/api/response';
import { parseBbox } from '@/lib/pipeline/geoApi';
import { fetchGeoTrailRpcRows, mapGeoTrailRpcRowsToApiList } from '@/lib/pipeline/geoTrailList';

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 50);
    const bbox = parseBbox(request.nextUrl.searchParams.get('bbox'));

    const rows = await fetchGeoTrailRpcRows({ bbox, limit });
    return successResponse(mapGeoTrailRpcRowsToApiList(rows));
  } catch (error: any) {
    return errors.internalError(error?.message || 'Failed to fetch geo trails');
  }
}
