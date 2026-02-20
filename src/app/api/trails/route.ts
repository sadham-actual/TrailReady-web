import { NextRequest } from 'next/server';
import { successResponse, errors } from '@/lib/api/response';
import { searchMockTrails } from '@/data/sampleTrails';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

async function trySupabaseTrails(search?: string, region?: string) {
  try {
    if (process.env.USE_MOCK_DATA === 'true') return null;

    const supabase = createSupabaseServiceClient();
    let query = supabase.from('trails').select('*').order('name', { ascending: true });

    if (search) query = query.or(`name.ilike.%${search}%,region.ilike.%${search}%`);
    if (region) query = query.eq('region', region);

    const { data: trails, error } = await query;
    if (error) return null;
    if (!trails || trails.length === 0) return [];

    const trailIds = trails.map((t) => t.id);
    const { data: reports } = await supabase
      .from('condition_reports')
      .select('trail_id,status,timestamp')
      .in('trail_id', trailIds)
      .order('timestamp', { ascending: false });

    const latestByTrail = new Map<string, { status: string; timestamp: string }>();
    for (const r of reports ?? []) {
      if (!latestByTrail.has(r.trail_id)) {
        latestByTrail.set(r.trail_id, { status: r.status, timestamp: r.timestamp });
      }
    }

    return trails.map((trail) => {
      const latest = latestByTrail.get(trail.id);
      return {
        id: trail.id,
        name: trail.name,
        region: trail.region,
        latitude: trail.latitude,
        longitude: trail.longitude,
        description: trail.description ?? undefined,
        baseDifficulty: trail.base_difficulty ?? undefined,
        latestStatus: latest?.status,
        lastReportAt: latest?.timestamp,
        difficultyScore: trail.difficulty_score ?? undefined,
        terrainType: (trail.terrain_type as 'Rock' | 'Sand' | 'Mud' | null) ?? undefined,
        minTireSize: trail.min_tire_size ?? undefined,
        requiredGear: Array.isArray(trail.required_gear) ? (trail.required_gear as string[]) : undefined,
        currentStatus: (trail.current_status as 'Open' | 'Closed' | null) ?? undefined,
      };
    });
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const region = searchParams.get('region') ?? undefined;

    const dbTrails = await trySupabaseTrails(search, region);
    if (dbTrails !== null) {
      return successResponse(dbTrails);
    }

    const mockTrails = searchMockTrails(search, region);
    return successResponse(mockTrails);
  } catch (error) {
    console.error('Error fetching trails:', error);
    return errors.internalError('Failed to fetch trails');
  }
}
