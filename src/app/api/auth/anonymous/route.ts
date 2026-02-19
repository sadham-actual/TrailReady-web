import { NextRequest } from 'next/server';
import { successResponse, errors } from '@/lib/api/response';

async function tryPrismaAuth(existingUserId?: string) {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;
    const prisma = (await import('@/lib/prisma')).default;
    if (existingUserId) {
      const user = await prisma.user.findUnique({ where: { id: existingUserId } });
      if (user) return { id: user.id, isNew: false };
    }
    const user = await prisma.user.create({ data: { isAnonymous: true } });
    return { id: user.id, isNew: true };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const existingUserId = body.userId as string | undefined;

    const dbResult = await tryPrismaAuth(existingUserId);
    if (dbResult !== null) {
      return successResponse({ id: dbResult.id }, dbResult.isNew ? 201 : 200);
    }

    // Fallback: generate or reuse a mock user ID
    const mockId = existingUserId && existingUserId.startsWith('mock-')
      ? existingUserId
      : `mock-user-${Math.random().toString(36).slice(2, 9)}`;

    return successResponse({ id: mockId }, 201);
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    return errors.internalError('Failed to create anonymous user');
  }
}
