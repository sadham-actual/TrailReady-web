import { NextRequest } from 'next/server';
import { errors, successResponse } from '@/lib/api/response';
import { createSupabaseServiceClient, getSupabaseUserIdFromRequestAuthHeader } from '@/lib/supabase/server';

async function requireAuth(request: NextRequest): Promise<string | null> {
  return getSupabaseUserIdFromRequestAuthHeader(request.headers.get('authorization'));
}

export async function GET(request: NextRequest) {
  const userId = await requireAuth(request);
  if (!userId) return errors.unauthorized();

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from('saved_trails')
    .select('trail_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return errors.internalError(error.message);
  return successResponse(data ?? []);
}

export async function POST(request: NextRequest) {
  const userId = await requireAuth(request);
  if (!userId) return errors.unauthorized();

  const body = await request.json();
  const { trail_id } = body ?? {};
  if (!trail_id) return errors.badRequest('trail_id is required');

  const supabase = createSupabaseServiceClient();

  await supabase.from('users').upsert({ id: userId, is_anonymous: false });

  const { data, error } = await supabase
    .from('saved_trails')
    .upsert({ id: crypto.randomUUID(), user_id: userId, trail_id }, { onConflict: 'user_id,trail_id' })
    .select('trail_id, created_at')
    .single();

  if (error) return errors.internalError(error.message);
  return successResponse(data, 201);
}

export async function DELETE(request: NextRequest) {
  const userId = await requireAuth(request);
  if (!userId) return errors.unauthorized();

  const trailId = request.nextUrl.searchParams.get('trail_id');
  if (!trailId) return errors.badRequest('trail_id query param is required');

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase
    .from('saved_trails')
    .delete()
    .eq('user_id', userId)
    .eq('trail_id', trailId);

  if (error) return errors.internalError(error.message);
  return successResponse({ trail_id: trailId });
}
