import { NextRequest } from 'next/server';
import { errors, successResponse } from '@/lib/api/response';

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

  const vehicles = await prisma.userVehicle.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });

  return successResponse(vehicles);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    userId,
    make,
    model,
    clearance_inches,
    tire_size,
    has_low_range,
    has_winch,
    experience_level,
  } = body ?? {};

  if (!userId || !make || !model || !experience_level) {
    return errors.badRequest('userId, make, model, and experience_level are required');
  }

  const prisma = await getPrisma();
  if (!prisma) {
    return successResponse({ id: `mock-${Date.now()}`, ...body }, 201);
  }

  const created = await prisma.userVehicle.create({
    data: {
      userId,
      make,
      model,
      clearanceInches: Number(clearance_inches ?? 0),
      tireSize: Number(tire_size ?? 0),
      hasLowRange: Boolean(has_low_range),
      hasWinch: Boolean(has_winch),
      experienceLevel: experience_level,
    },
  });

  return successResponse(created, 201);
}
