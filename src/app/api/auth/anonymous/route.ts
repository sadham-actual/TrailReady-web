import { NextRequest } from 'next/server';
import { successResponse, errors } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const existingUserId = body.userId as string | undefined;

    if (existingUserId && typeof existingUserId === 'string') {
      return successResponse({ id: existingUserId }, 200);
    }

    return successResponse({ id: crypto.randomUUID() }, 201);
  } catch (error) {
    console.error('Error creating anonymous user:', error);
    return errors.internalError('Failed to create anonymous user');
  }
}
