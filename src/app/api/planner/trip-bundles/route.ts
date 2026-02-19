import { NextRequest } from 'next/server';
import { errors, successResponse } from '@/lib/api/response';
import { requireSoftAuth } from '@/lib/auth/softAuth';

async function getPrisma() {
  if (process.env.USE_MOCK_DATA === 'true') return null;
  try {
    return (await import('@/lib/prisma')).default;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return errors.badRequest('userId is required');

  const prisma = await getPrisma();
  if (!prisma) return successResponse([]);

  const bundles = await prisma.tripBundle.findMany({
    where: { userId },
    include: {
      trails: {
        orderBy: { sortOrder: 'asc' },
        include: { trail: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return successResponse(bundles);
}

export async function POST(request: NextRequest) {
  const auth = requireSoftAuth(request);
  if (auth instanceof Response) return auth;

  const body = await request.json();
  const { user_id, trail_ids, scheduled_date, notes, is_offline_cached } = body ?? {};

  if (!user_id || !Array.isArray(trail_ids) || trail_ids.length !== 3) {
    return errors.badRequest('user_id and exactly 3 trail_ids are required');
  }

  if (user_id !== auth.userId) {
    return errors.unauthorized('Authenticated user does not match requested user_id');
  }

  const prisma = await getPrisma();
  if (!prisma) {
    return successResponse(
      {
        id: `mock-bundle-${Date.now()}`,
        user_id,
        trail_ids,
        scheduled_date: scheduled_date ?? new Date().toISOString(),
        notes: notes ?? '',
        is_offline_cached: Boolean(is_offline_cached),
      },
      201
    );
  }

  const created = await prisma.tripBundle.create({
    data: {
      userId: user_id,
      scheduledDate: new Date(scheduled_date ?? new Date().toISOString()),
      notes: notes ?? '',
      isOfflineCached: Boolean(is_offline_cached),
      trails: {
        create: trail_ids.map((trailId: string, i: number) => ({
          trailId,
          sortOrder: i,
        })),
      },
    },
    include: {
      trails: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return successResponse(created, 201);
}
