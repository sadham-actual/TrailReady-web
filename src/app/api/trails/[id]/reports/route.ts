import { NextRequest } from 'next/server';
import { successResponse, errors } from '@/lib/api/response';
import { ConditionReport } from '@/types';
import { getMockReports, getMockTrail } from '@/data/sampleTrails';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

async function trySupabaseReports(trailId: string): Promise<ConditionReport[] | null | 'not_found'> {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const supabase = createSupabaseServiceClient();

    const { data: trail, error: trailErr } = await supabase
      .from('trails')
      .select('id')
      .eq('id', trailId)
      .maybeSingle();

    if (trailErr) return null;
    if (!trail) return 'not_found';

    const { data: reports, error } = await supabase
      .from('condition_reports')
      .select('*')
      .eq('trail_id', trailId)
      .order('timestamp', { ascending: false });

    if (error) return null;

    return (reports ?? []).map((r) => ({
      id: r.id,
      trailId: r.trail_id,
      userId: r.user_id,
      status: r.status,
      confidence: r.confidence,
      vehicleType: r.vehicle_type,
      notes: r.notes ?? undefined,
      timestamp: r.timestamp,
    }));
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: trailId } = await params;

    const dbReports = await trySupabaseReports(trailId);
    if (dbReports !== null && dbReports !== 'not_found' && dbReports.length > 0) {
      return successResponse(dbReports);
    }

    const mockTrail = getMockTrail(trailId);
    if (!mockTrail) return errors.notFound('Trail');

    const mockReports = getMockReports(trailId).map((r) => ({
      id: r.id,
      trailId: r.trailId,
      userId: r.userId,
      status: r.status,
      confidence: r.confidence,
      vehicleType: r.vehicleType,
      notes: r.notes,
      timestamp: r.timestamp,
    }));

    return successResponse(mockReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return errors.internalError('Failed to fetch reports');
  }
}
