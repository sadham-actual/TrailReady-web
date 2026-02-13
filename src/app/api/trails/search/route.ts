import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { errors, successResponse } from '@/lib/api/response';
import { calculateGlobalStatus, statusToGlobalLabel, type GlobalTrailStatus } from '@/lib/intel-utils';

interface SearchTrailResult {
  id: string;
  name: string;
  status: GlobalTrailStatus;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() ?? '';

    if (!query) {
      return successResponse<SearchTrailResult[]>([]);
    }

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

    const results: SearchTrailResult[] = trails.map((trail) => {
      // Use the full weighted algorithm when we have reports
      if (trail.reports.length > 0) {
        const intelReports = trail.reports.map((r) => ({
          status: r.status,
          confidence: r.confidence,
          timestamp: r.timestamp.toISOString(),
        }));
        const globalResult = calculateGlobalStatus(intelReports);
        return {
          id: trail.id,
          name: trail.name.toUpperCase(),
          status: globalResult.status,
        };
      }

      // Fallback for no reports
      return {
        id: trail.id,
        name: trail.name.toUpperCase(),
        status: statusToGlobalLabel(undefined),
      };
    });

    return successResponse(results);
  } catch {
    return errors.internalError('Database query failed');
  }
}
