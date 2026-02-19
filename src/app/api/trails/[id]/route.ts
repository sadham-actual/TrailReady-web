import { NextRequest } from 'next/server';
import { successResponse, errors } from '@/lib/api/response';
import { Trail } from '@/types';
import { getReportFreshness } from '@/lib/trailOutcome';
import { getMockTrail, getMockReports } from '@/data/sampleTrails';

/**
 * Extended trail response with freshness metadata
 */
interface TrailWithMeta extends Trail {
  baseDifficulty?: number;
  reportMeta?: {
    isFresh: boolean;
    isStale: boolean;
    ageInDays: number;
  };
}

async function tryPrismaTrail(id: string): Promise<TrailWithMeta | null | 'not_found'> {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const prisma = (await import('@/lib/prisma')).default;
    const trail = await prisma.trail.findUnique({
      where: { id },
      include: {
        reports: {
          take: 1,
          orderBy: { timestamp: 'desc' },
          select: { status: true, timestamp: true },
        },
      },
    });
    if (!trail) return 'not_found';
    const latestReport = trail.reports[0];
    const reportMeta = latestReport ? getReportFreshness(latestReport.timestamp) : undefined;
    return {
      id: trail.id,
      name: trail.name,
      region: trail.region,
      latitude: trail.latitude,
      longitude: trail.longitude,
      description: trail.description ?? undefined,
      baseDifficulty: trail.baseDifficulty ?? undefined,
      latestStatus: latestReport?.status,
      lastReportAt: latestReport?.timestamp.toISOString(),
      reportMeta,
    };
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

    const dbTrail = await tryPrismaTrail(id);
    if (dbTrail === 'not_found') return errors.notFound('Trail');
    if (dbTrail !== null) return successResponse(dbTrail);

    // Fallback: mock data
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
