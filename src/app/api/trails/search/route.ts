import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { errors, successResponse } from '@/lib/api/response';

type SearchStatus = 'PASSABLE' | 'CHALLENGING' | 'NOT PASSABLE';

interface SearchTrailResult {
  id: string;
  name: string;
  status: SearchStatus;
}

function toStatus(status?: 'clear' | 'rough' | 'impassable'): SearchStatus {
  if (status === 'clear') return 'PASSABLE';
  if (status === 'impassable') return 'NOT PASSABLE';
  return 'CHALLENGING';
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
          take: 1,
          orderBy: { timestamp: 'desc' },
          select: { status: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 8,
    });

    const results: SearchTrailResult[] = trails.map((trail) => ({
      id: trail.id,
      name: trail.name.toUpperCase(),
      status: toStatus(trail.reports[0]?.status),
    }));

    return successResponse(results);
  } catch {
    return errors.internalError('Database query failed');
  }
}
