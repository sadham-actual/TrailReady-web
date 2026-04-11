import { NextRequest } from 'next/server';
import { successResponse, errors } from '@/lib/api/response';
import { Trail } from '@/types';
import { getReportFreshness } from '@/lib/trailOutcome';
import { getMockTrail, getMockReports } from '@/data/sampleTrails';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { mapGeoTrailDetailToTrail } from '@/lib/pipeline/geoTrailAdapters';

interface TrailWithMeta extends Trail {
  baseDifficulty?: number;
  reportMeta?: {
    isFresh: boolean;
    isStale: boolean;
    ageInDays: number;
  };
}

async function trySupabaseTrail(id: string): Promise<TrailWithMeta | null | 'not_found'> {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const supabase = createSupabaseServiceClient();

    const { data: trail, error } = await supabase.from('trails').select('*').eq('id', id).maybeSingle();
    if (error) return null;
    if (!trail) return 'not_found';

    const { data: latestReport } = await supabase
      .from('condition_reports')
      .select('status,timestamp')
      .eq('trail_id', id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle();

    const reportMeta = latestReport ? getReportFreshness(latestReport.timestamp) : undefined;

    return {
      id: trail.id,
      name: trail.name,
      region: trail.region,
      latitude: trail.latitude,
      longitude: trail.longitude,
      description: trail.description ?? undefined,
      baseDifficulty: trail.base_difficulty ?? undefined,
      latestStatus: latestReport?.status,
      lastReportAt: latestReport?.timestamp,
      reportMeta,
      difficultyScore: trail.difficulty_score ?? undefined,
      terrainType: (trail.terrain_type as 'Rock' | 'Sand' | 'Mud' | null) ?? undefined,
      minTireSize: trail.min_tire_size ?? undefined,
      requiredGear: Array.isArray(trail.required_gear) ? (trail.required_gear as string[]) : undefined,
      currentStatus: (trail.current_status as 'Open' | 'Closed' | null) ?? undefined,
      gpxUrl: trail.gpx_url ?? undefined,
    };
  } catch {
    return null;
  }
}

async function trySupabaseGeoTrail(id: string): Promise<TrailWithMeta | null | 'not_found'> {
  try {
    const supabase = createSupabaseServiceClient();

    const [{ data: trail, error: trailErr }, { data: segmentRows, error: segErr }] = await Promise.all([
      supabase.from('geo_trails').select('*').eq('id', id).maybeSingle(),
      supabase.rpc('geo_trail_segments', { p_trail_id: id }),
    ]);

    if (trailErr || segErr) return null;
    if (!trail) return 'not_found';

    return mapGeoTrailDetailToTrail(trail, segmentRows ?? []);
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dbTrail = await trySupabaseTrail(id);
    if (dbTrail !== null && dbTrail !== 'not_found') return successResponse(dbTrail);

    const geoTrail = await trySupabaseGeoTrail(id);
    if (geoTrail !== null && geoTrail !== 'not_found') return successResponse(geoTrail);

    const mockTrail = getMockTrail(id);
    if (!mockTrail) return errors.notFound('Trail');

    const reports = getMockReports(id);
    const latestReport = reports[0];
    const reportMeta = latestReport ? getReportFreshness(new Date(latestReport.timestamp)) : undefined;

    const trailWithMeta: TrailWithMeta = {
      ...mockTrail,
      latestStatus: latestReport?.status,
      lastReportAt: latestReport?.timestamp,
      reportMeta,
    };

    return successResponse(trailWithMeta);
  } catch (error) {
    console.error('Error fetching trail:', error);
    return errors.internalError('Failed to fetch trail');
  }
}
