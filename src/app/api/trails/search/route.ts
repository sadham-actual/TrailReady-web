import { NextRequest } from 'next/server';
import { errors, successResponse } from '@/lib/api/response';
import { calculateGlobalStatus, statusToGlobalLabel, type GlobalTrailStatus } from '@/lib/intel-utils';
import { searchMockTrails, getMockReports } from '@/data/sampleTrails';

interface SearchTrailResult {
  id: string;
  name: string;
  status: GlobalTrailStatus;
}

async function tryPrismaSearch(query: string): Promise<SearchTrailResult[] | null> {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const prisma = (await import('@/lib/prisma')).default;
    const trails = await prisma.trail.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { region: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        reports: {
          take: 5,
          orderBy: { timestamp: 'desc' },
          select: { status: true, confidence: true, timestamp: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 8,
    });
    return trails.map((trail) => {
      if (trail.reports.length > 0) {
        const intelReports = trail.reports.map((r) => ({
          status: r.status,
          confidence: r.confidence,
          timestamp: r.timestamp.toISOString(),
        }));
        const globalResult = calculateGlobalStatus(intelReports);
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

    const dbResults = await tryPrismaSearch(query);
    if (dbResults !== null) return successResponse(dbResults);

    // Fallback: mock search
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
