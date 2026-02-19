import { NextRequest } from 'next/server';
import { successResponse, errors } from '@/lib/api/response';
import { searchMockTrails } from '@/data/sampleTrails';

// Lazy import prisma to avoid crashing when DB is unavailable
async function tryPrismaTrails(search?: string, region?: string) {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const prisma = (await import('@/lib/prisma')).default;
    const whereClause: Record<string, unknown> = {};
    if (search || region) {
      whereClause.AND = [];
      const and = whereClause.AND as unknown[];
      if (search) {
        and.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { region: { contains: search, mode: 'insensitive' } },
          ],
        });
      }
      if (region) {
        and.push({ region });
      }
    }
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
    return trails.map((trail) => ({
      id: trail.id,
      name: trail.name,
      region: trail.region,
      latitude: trail.latitude,
      longitude: trail.longitude,
      description: trail.description ?? undefined,
      baseDifficulty: trail.baseDifficulty ?? undefined,
      latestStatus: trail.reports[0]?.status,
      lastReportAt: trail.reports[0]?.timestamp.toISOString(),
      difficultyScore: trail.difficultyScore ?? undefined,
      terrainType: (trail.terrainType as 'Rock' | 'Sand' | 'Mud' | null) ?? undefined,
      minTireSize: trail.minTireSize ?? undefined,
      requiredGear: Array.isArray(trail.requiredGear) ? (trail.requiredGear as string[]) : undefined,
      currentStatus: (trail.currentStatus as 'Open' | 'Closed' | null) ?? undefined,
    }));
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const region = searchParams.get('region') ?? undefined;

    const dbTrails = await tryPrismaTrails(search, region);
    if (dbTrails !== null) {
      return successResponse(dbTrails);
    }

    // Fallback: rich mock data
    const mockTrails = searchMockTrails(search, region);
    return successResponse(mockTrails);
  } catch (error) {
    console.error('Error fetching trails:', error);
    return errors.internalError('Failed to fetch trails');
  }
}
