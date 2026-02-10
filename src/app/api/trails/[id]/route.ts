import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errors } from '@/lib/api/response';
import { Trail } from '@/types';
import { getReportFreshness } from '@/lib/trailOutcome';

/**
 * Extended trail response with freshness metadata
 */
interface TrailWithMeta extends Trail {
  baseDifficulty?: number;
  reportMeta?: {
    isFresh: boolean;   // Report is < 7 days old
    isStale: boolean;   // Report is >= 14 days old
    ageInDays: number;  // Age of most recent report
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch trail with its latest report and baseDifficulty
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

    if (!trail) {
      return errors.notFound('Trail');
    }

    // Calculate report freshness if we have a report
    const latestReport = trail.reports[0];
    const reportMeta = latestReport
      ? getReportFreshness(latestReport.timestamp)
      : undefined;

    // Transform to extended trail response
    const trailWithStatus: TrailWithMeta = {
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

    return successResponse(trailWithStatus);
  } catch (error) {
    console.error('Error fetching trail:', error);
    return errors.internalError('Failed to fetch trail');
  }
}
