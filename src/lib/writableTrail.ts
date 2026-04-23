import { getMockTrail } from '@/data/sampleTrails';
import { mapGeoTrailDetailToTrail } from '@/lib/pipeline/geoTrailAdapters';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

type WritableTrailSeed = {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  description: string | null;
  base_difficulty: number | null;
  difficulty_score: number | null;
  terrain_type: string | null;
  min_tire_size: number | null;
  required_gear: string[] | null;
  current_status: string | null;
  gpx_url: string | null;
};

async function getGeoTrailSeed(trailId: string): Promise<WritableTrailSeed | null> {
  const supabase = createSupabaseServiceClient();
  const [{ data: geoTrail, error: geoTrailErr }, { data: segmentRows, error: segmentErr }] = await Promise.all([
    supabase.from('geo_trails').select('*').eq('id', trailId).maybeSingle(),
    supabase.rpc('geo_trail_segments', { p_trail_id: trailId }),
  ]);

  if (geoTrailErr || segmentErr || !geoTrail) {
    return null;
  }

  const mapped = mapGeoTrailDetailToTrail(geoTrail, segmentRows ?? []);

  return {
    id: mapped.id,
    name: mapped.name,
    region: mapped.region,
    latitude: mapped.latitude,
    longitude: mapped.longitude,
    description: mapped.description ?? null,
    base_difficulty: mapped.baseDifficulty ?? null,
    difficulty_score: mapped.difficultyScore ?? null,
    terrain_type: mapped.terrainType ?? null,
    min_tire_size: mapped.minTireSize ?? null,
    required_gear: mapped.requiredGear ?? null,
    current_status: mapped.currentStatus ?? null,
    gpx_url: mapped.gpxUrl ?? null,
  };
}

function getMockTrailSeed(trailId: string): WritableTrailSeed | null {
  const mockTrail = getMockTrail(trailId);
  if (!mockTrail) return null;

  return {
    id: mockTrail.id,
    name: mockTrail.name,
    region: mockTrail.region,
    latitude: mockTrail.latitude,
    longitude: mockTrail.longitude,
    description: mockTrail.description ?? null,
    base_difficulty: mockTrail.baseDifficulty ?? null,
    difficulty_score: null,
    terrain_type: null,
    min_tire_size: null,
    required_gear: null,
    current_status: null,
    gpx_url: null,
  };
}

export async function ensureWritableTrailExists(trailId: string): Promise<boolean> {
  const supabase = createSupabaseServiceClient();
  const { data: existingTrail, error: existingTrailErr } = await supabase
    .from('trails')
    .select('id')
    .eq('id', trailId)
    .maybeSingle();

  if (existingTrailErr) return false;
  if (existingTrail) return true;

  const seed = (await getGeoTrailSeed(trailId)) ?? getMockTrailSeed(trailId);
  if (!seed) return false;

  const { error: upsertErr } = await supabase.from('trails').upsert(seed, {
    onConflict: 'id',
  });

  return !upsertErr;
}
