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

  const { data: bundles, error: bundlesErr } = await supabase
    .from('trip_bundles')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (bundlesErr) return errors.internalError(bundlesErr.message);

  const bundleIds = (bundles ?? []).map((b) => b.id);
  let trails: any[] = [];
  if (bundleIds.length > 0) {
    const { data: t, error: trailsErr } = await supabase
      .from('trip_bundle_trails')
      .select('*')
      .in('trip_bundle_id', bundleIds)
      .order('sort_order', { ascending: true });
    if (trailsErr) return errors.internalError(trailsErr.message);
    trails = t ?? [];
  }

  const merged = (bundles ?? []).map((b) => ({
    ...b,
    trails: trails.filter((t) => t.trip_bundle_id === b.id),
  }));

  return successResponse(merged);
}

export async function POST(request: NextRequest) {
  const authUserId = await requireAuthUserId(request);
  if (!authUserId) {
    return errors.unauthorized('Authentication required for this action. Sign in to continue.');
  }

  const body = await request.json();
  const { user_id, trail_ids, scheduled_date, notes, is_offline_cached } = body ?? {};

  if (!user_id || !Array.isArray(trail_ids) || trail_ids.length !== 3) {
    return errors.badRequest('user_id and exactly 3 trail_ids are required');
  }

  if (authUserId !== user_id) {
    return errors.unauthorized('Authenticated user does not match requested user_id');
  }

  const supabase = createSupabaseServiceClient();

  await supabase.from('users').upsert({ id: user_id, is_anonymous: false });

  const bundleId = crypto.randomUUID();
  const bundle = {
    id: bundleId,
    user_id,
    scheduled_date: scheduled_date ?? new Date().toISOString(),
    notes: notes ?? '',
    is_offline_cached: Boolean(is_offline_cached),
  };

  const { data: insertedBundle, error: bundleErr } = await supabase
    .from('trip_bundles')
    .insert(bundle)
    .select('*')
    .single();

  if (bundleErr) return errors.internalError(bundleErr.message);

  const { data: insertedTrails, error: trailsErr } = await supabase
    .from('trip_bundle_trails')
    .insert(
      trail_ids.map((trailId: string, i: number) => ({
        id: crypto.randomUUID(),
        trip_bundle_id: bundleId,
        trail_id: trailId,
        sort_order: i,
      }))
    )
    .select('*');

  if (trailsErr) return errors.internalError(trailsErr.message);

  return successResponse({ ...insertedBundle, trails: insertedTrails ?? [] }, 201);
}
