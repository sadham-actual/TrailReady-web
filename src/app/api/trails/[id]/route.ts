import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errors } from '@/lib/api/response';
import { Trail } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch trail with its latest report
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

    // Transform to match frontend Trail type
    const trailWithStatus: Trail = {
      id: trail.id,
      name: trail.name,
      region: trail.region,
      latitude: trail.latitude,
      longitude: trail.longitude,
      description: trail.description ?? undefined,
      latestStatus: trail.reports[0]?.status,
      lastReportAt: trail.reports[0]?.timestamp.toISOString(),
    };

    return successResponse(trailWithStatus);
  } catch (error) {
    console.error('Error fetching trail:', error);
    return errors.internalError('Failed to fetch trail');
  }
}
