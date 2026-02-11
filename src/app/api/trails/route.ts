import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errors } from '@/lib/api/response';
import { Trail } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const region = searchParams.get('region');

    // Build where clause for filtering
    const whereClause: any = {};

    if (search || region) {
      whereClause.AND = [];

      if (search) {
        whereClause.AND.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { region: { contains: search, mode: 'insensitive' } },
          ],
        });
      }

      if (region) {
        whereClause.AND.push({ region });
      }
    }

    // Fetch trails with their latest report
    const trails = await prisma.trail.findMany({
      where: whereClause,
      include: {
        reports: {
          take: 1,
          orderBy: { timestamp: 'desc' },
          select: { status: true, timestamp: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform to match frontend Trail type (with baseDifficulty for matching)
    const trailsWithStatus = trails.map((trail) => ({
      id: trail.id,
      name: trail.name,
      region: trail.region,
      latitude: trail.latitude,
      longitude: trail.longitude,
      description: trail.description ?? undefined,
      baseDifficulty: trail.baseDifficulty ?? undefined,
      latestStatus: trail.reports[0]?.status,
      lastReportAt: trail.reports[0]?.timestamp.toISOString(),
    }));

    return successResponse(trailsWithStatus);
  } catch (error) {
    console.error('Error fetching trails:', error);
    return errors.internalError('Failed to fetch trails');
  }
}
