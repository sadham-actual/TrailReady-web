import { NextRequest } from 'next/server';
import { errors, successResponse } from '@/lib/api/response';
import { calculateGlobalStatus, statusToGlobalLabel, type GlobalTrailStatus } from '@/lib/intel-utils';
import { searchMockTrails, getMockReports } from '@/data/sampleTrails';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { fetchGeoTrailRpcRows, mapGeoTrailRpcRowsToTrails } from '@/lib/pipeline/geoTrailList';

interface SearchTrailResult {
  id: string;
  name: string;
  status: GlobalTrailStatus;
}

type ReportSummary = {
  trail_id: string;
  status: 'clear' | 'rough' | 'impassable';
  confidence: 'low' | 'medium' | 'high';
  timestamp: string;
};

function toSearchResult(id: string, name: string, status: GlobalTrailStatus): SearchTrailResult {
  return { id, name: name.toUpperCase(), status };
}

function buildLegacyTrailResult(
  trail: { id: string; name: string },
  reports: ReportSummary[]
): SearchTrailResult {
  const trailReports = reports
    .filter((report) => report.trail_id === trail.id)
    .slice(0, 5)
    .map((report) => ({
      status: report.status,
      confidence: report.confidence,
      timestamp: report.timestamp,
    }));

  if (trailReports.length > 0) {
    const globalResult = calculateGlobalStatus(trailReports);
    return toSearchResult(trail.id, trail.name, globalResult.status);
  }

  return toSearchResult(trail.id, trail.name, statusToGlobalLabel(undefined));
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
    const legacyTrails = trails ?? [];

    const trailIds = legacyTrails.map((trail) => trail.id);
    let reports: ReportSummary[] = [];
    if (trailIds.length > 0) {
      const { data: reportRows } = await supabase
        .from('condition_reports')
        .select('trail_id,status,confidence,timestamp')
        .in('trail_id', trailIds)
        .order('timestamp', { ascending: false });
      reports = (reportRows ?? []) as ReportSummary[];
    }

    const legacyResults = legacyTrails.map((trail) => buildLegacyTrailResult(trail, reports));

    const geoRows = await fetchGeoTrailRpcRows({ limit: 200 });
    const geoQuery = query.toLowerCase();
    const geoResults = mapGeoTrailRpcRowsToTrails(geoRows)
      .filter((trail) => {
        const haystack = [trail.name, trail.region, trail.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(geoQuery);
      })
      .map((trail) =>
        toSearchResult(trail.id, trail.name, statusToGlobalLabel(trail.latestStatus))
      );

    const merged = new Map<string, SearchTrailResult>();
    for (const result of legacyResults) merged.set(result.id, result);
    for (const result of geoResults) {
      if (!merged.has(result.id)) merged.set(result.id, result);
    }

    return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);
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
    if (dbResults !== null) return successResponse(dbResults);

    if (process.env.USE_MOCK_DATA !== 'true') return successResponse<SearchTrailResult[]>([]);

    const mockTrails = searchMockTrails(query).slice(0, 8);
    const results: SearchTrailResult[] = mockTrails.map((trail) => {
      const reports = getMockReports(trail.id);
      if (reports.length > 0) {
        const globalResult = calculateGlobalStatus(reports);
        return toSearchResult(trail.id, trail.name, globalResult.status);
      }
      return toSearchResult(trail.id, trail.name, statusToGlobalLabel(undefined));
    });

    return successResponse(results);
  } catch {
    return errors.internalError('Database query failed');
  }
}
