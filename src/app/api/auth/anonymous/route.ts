import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errors } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const existingUserId = body.userId as string | undefined;

    // If user provides an existing ID, verify it exists
    if (existingUserId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: existingUserId },
      });

      if (existingUser) {
        return successResponse({ id: existingUser.id });
      }
    }

    // Create new anonymous user
    const user = await prisma.user.create({
      data: {
        isAnonymous: true,
      },
    });

    return successResponse({ id: user.id }, 201);
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    return errors.internalError('Failed to create anonymous user');
  }
}
