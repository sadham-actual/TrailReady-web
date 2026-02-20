import { NextRequest } from 'next/server';
import { errors, successResponse } from '@/lib/api/response';
import { createSupabaseServiceClient, getSupabaseUserIdFromRequestAuthHeader } from '@/lib/supabase/server';

async function requireAuthUserId(request: NextRequest): Promise<string | null> {
  return getSupabaseUserIdFromRequestAuthHeader(request.headers.get('authorization'));
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) return errors.badRequest('userId is required');

  const authUserId = await requireAuthUserId(request);
  if (!authUserId || authUserId !== userId) {
    return errors.unauthorized('Authentication required for this action. Sign in to continue.');
  }

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('user_vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) return errors.internalError(error.message);
  return successResponse(data ?? []);
}

export async function POST(request: NextRequest) {
  const authUserId = await requireAuthUserId(request);
  if (!authUserId) {
    return errors.unauthorized('Authentication required for this action. Sign in to continue.');
  }

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

  if (userId !== authUserId) {
    return errors.unauthorized('Authenticated user does not match requested userId');
  }

  const supabase = createSupabaseServiceClient();

  await supabase.from('users').upsert({ id: userId, is_anonymous: false });

  const payload = {
    id: crypto.randomUUID(),
    user_id: userId,
    make,
    model,
    clearance_inches: Number(clearance_inches ?? 0),
    tire_size: Number(tire_size ?? 0),
    has_low_range: Boolean(has_low_range),
    has_winch: Boolean(has_winch),
    experience_level,
  };

  const { data, error } = await supabase
    .from('user_vehicles')
    .insert(payload)
    .select('*')
    .single();

  if (error) return errors.internalError(error.message);
  return successResponse(data, 201);
}
