import { NextRequest } from 'next/server';
import { errors, successResponse } from '@/lib/api/response';
import { calculateGlobalStatus, statusToGlobalLabel, type GlobalTrailStatus } from '@/lib/intel-utils';
import { searchMockTrails, getMockReports } from '@/data/sampleTrails';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

interface SearchTrailResult {
  id: string;
  name: string;
  status: GlobalTrailStatus;
}

async function trySupabaseSearch(query: string): Promise<SearchTrailResult[] | null> {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const supabase = createSupabaseServiceClient();

    const { data: trails, error } = await supabase
      .from('trails')
      .select('id,name,region')
      .or(`name.ilike.%${query}%,region.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(8);

    if (error) return null;
    if (!trails || trails.length === 0) return [];

    const trailIds = trails.map((t) => t.id);
    const { data: reports } = await supabase
      .from('condition_reports')
      .select('trail_id,status,confidence,timestamp')
      .in('trail_id', trailIds)
      .order('timestamp', { ascending: false });

    return trails.map((trail) => {
      const trailReports = (reports ?? [])
        .filter((r) => r.trail_id === trail.id)
        .slice(0, 5)
        .map((r) => ({
          status: r.status,
          confidence: r.confidence,
          timestamp: r.timestamp,
        }));

      if (trailReports.length > 0) {
        const globalResult = calculateGlobalStatus(trailReports as any);
        return { id: trail.id, name: trail.name.toUpperCase(), status: globalResult.status };
      }
      return { id: trail.id, name: trail.name.toUpperCase(), status: statusToGlobalLabel(undefined) };
    });
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() ?? '';

    if (!query) return successResponse<SearchTrailResult[]>([]);

    const dbResults = await trySupabaseSearch(query);
    if (dbResults !== null && dbResults.length > 0) return successResponse(dbResults);

    const mockTrails = searchMockTrails(query).slice(0, 8);
    const results: SearchTrailResult[] = mockTrails.map((trail) => {
      const reports = getMockReports(trail.id);
      if (reports.length > 0) {
        const globalResult = calculateGlobalStatus(reports);
        return { id: trail.id, name: trail.name.toUpperCase(), status: globalResult.status };
      }
      return { id: trail.id, name: trail.name.toUpperCase(), status: statusToGlobalLabel(undefined) };
    });

    return successResponse(results);
  } catch {
    return errors.internalError('Database query failed');
  }
}
