import { NextRequest } from 'next/server';
import { errors } from '@/lib/api/response';

export function getSoftAuthUserId(request: NextRequest): string | null {
  const userId = request.headers.get('x-trailready-user-id');
  const authState = request.headers.get('x-trailready-authenticated');

  if (!userId) return null;
  if (authState !== 'true') return null;
  return userId;
}

export function requireSoftAuth(request: NextRequest): { userId: string } | Response {
  const userId = getSoftAuthUserId(request);
  if (!userId) {
    return errors.unauthorized('Authentication required for this action. Sign in to continue.');
  }

  return { userId };
}
