import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { computeGeomHash } from '@/lib/pipeline/geometry';
import { Coordinate } from '@/lib/pipeline/types';
import { parseGeoJsonSegments } from './importers/geojson';
import { parseOverpassSegments, buildOverpassQuery } from './importers/osm';
import { parseShapefileSegments } from './importers/shapefile';
import { BBox, ImportSegmentCandidate, ImportSummary } from './importers/types';
import { lineStringToWkt } from './importers/normalize';
import { SOURCE_CATALOG } from './sourceCatalog';
import { splitBBox } from './importers/tiling';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

const OSM_IMPORT_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': 'TrailReady/0.1 (+https://trailready.sadham.org)',
  Accept: 'application/json,text/plain,*/*',
};

const OVERPASS_TIMEOUT_MS = 45000;
const OVERPASS_RETRIES = 2;

async function ensureSource(sourceSlug: string) {
  const supabase = createSupabaseServiceClient();
  const catalog = SOURCE_CATALOG[sourceSlug] ?? {
    slug: sourceSlug,
    name: sourceSlug.toUpperCase(),
    license: 'unknown',
    attributionText: sourceSlug,
    attributionRequired: true,
    shareAlike: false,
  };

  await supabase
    .from('sources')
    .upsert(
      {
        slug: catalog.slug,
        name: catalog.name,
        url: catalog.url,
        license: catalog.license,
        description: catalog.termsNotes,
        properties: {
          attribution_text: catalog.attributionText,
          attribution_required: catalog.attributionRequired,
          share_alike: catalog.shareAlike,
        },
      },
      { onConflict: 'slug' }
    );

  const { data } = await supabase.from('sources').select('id').eq('slug', sourceSlug).single();
  return data?.id as string;
}

async function parseJsonResponseOrThrow(res: Response, endpointLabel: string) {
  const contentType = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!res.ok) {
    throw new Error(
      `[OSM Import] ${endpointLabel} returned HTTP ${res.status}. Body: ${text.slice(0, 240)}`
    );
  }

  if (!contentType.includes('json')) {
    throw new Error(
      `[OSM Import] ${endpointLabel} returned non-JSON response (${contentType || 'unknown'}). Body: ${text.slice(0, 240)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `[OSM Import] ${endpointLabel} returned invalid JSON. Body: ${text.slice(0, 240)}`
    );
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = OVERPASS_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchOverpassEndpoint(endpoint: string, query: string) {
  let lastErr: Error | null = null;

  for (let attempt = 1; attempt <= OVERPASS_RETRIES + 1; attempt++) {
    try {
      const res = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: OSM_IMPORT_HEADERS,
        body: `data=${encodeURIComponent(query)}`,
      });
      return await parseJsonResponseOrThrow(res, `${endpoint} (attempt ${attempt})`);
    } catch (e) {
      lastErr = e as Error;
      if (attempt <= OVERPASS_RETRIES) {
        const delay = 500 * attempt;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastErr ?? new Error('Unknown Overpass error');
}

async function fetchOverpassWithFallback(query: string) {
  const errors: string[] = [];

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      return await fetchOverpassEndpoint(endpoint, query);
    } catch (e) {
      errors.push(`${endpoint}: ${(e as Error).message}`);
    }
  }

  throw new Error(`[OSM Import] All Overpass endpoints failed. ${errors.join(' | ')}`);
}

function dedupeCandidates(candidates: ImportSegmentCandidate[]) {
  const map = new Map<string, ImportSegmentCandidate>();
  for (const c of candidates) {
    const key = `${c.sourceSlug}:${c.sourceFeatureId}`;
    if (!map.has(key)) map.set(key, c);
  }
  return [...map.values()];
}

async function parseInput(
  sourceName: string,
  inputPathOrUrl: string,
  bbox?: BBox
): Promise<ImportSegmentCandidate[]> {
  if (sourceName === 'geojson') {
    const raw = await fs.readFile(inputPathOrUrl, 'utf-8');
    return parseGeoJsonSegments(JSON.parse(raw), 'mvum');
  }

  if (sourceName === 'shapefile') {
    return parseShapefileSegments(inputPathOrUrl, 'mvum');
  }

  if (sourceName === 'osm') {
    if (inputPathOrUrl.startsWith('http')) {
      const res = await fetchWithTimeout(inputPathOrUrl, {
        headers: { Accept: 'application/json,text/plain,*/*' },
      });
      const json = await parseJsonResponseOrThrow(res, inputPathOrUrl);
      return parseOverpassSegments(json);
    }

    if (!bbox) throw new Error('bbox is required for OSM import without URL');

    // Tile large bounding boxes to improve reliability and reduce timeouts.
    const totalArea = Math.abs((bbox.maxLng - bbox.minLng) * (bbox.maxLat - bbox.minLat));
    const tiles = totalArea > 1.0 ? splitBBox(bbox, 3, 3) : splitBBox(bbox, 2, 2);

    const all: ImportSegmentCandidate[] = [];
    for (const tile of tiles) {
      const query = buildOverpassQuery(tile);
      const json = await fetchOverpassWithFallback(query);
      const parsed = parseOverpassSegments(json);
      // Avoid spread on very large arrays (can throw "Maximum call stack size exceeded")
      for (const seg of parsed) all.push(seg);
    }

    return dedupeCandidates(all);
  }

  throw new Error(`Unsupported source_name: ${sourceName}`);
}

function buildCanonicalHash(candidate: ImportSegmentCandidate): string {
  const fromGeom = computeGeomHash(candidate.coordinates);
  if (fromGeom) return fromGeom;
  return createHash('sha256').update(JSON.stringify(candidate.coordinates)).digest('hex');
}

function computeBBox(coords: Coordinate[]) {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
    return null;
  }

  return { minLng, minLat, maxLng, maxLat };
}

function bboxPolygonToWkt(coords: Coordinate[]) {
  const bbox = computeBBox(coords);
  if (!bbox) return null;
  const { minLng, minLat, maxLng, maxLat } = bbox;
  return `SRID=4326;POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`;
}

function deriveTrailName(candidate: ImportSegmentCandidate) {
  const explicit = candidate.name?.trim();
  if (explicit) return explicit;
  return `${candidate.sourceSlug.toUpperCase()} ${candidate.sourceFeatureId}`;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function buildTrailSlug(candidate: ImportSegmentCandidate) {
  const base = slugify(candidate.name || candidate.sourceFeatureId || candidate.sourceSlug);
  const feature = slugify(candidate.sourceFeatureId || 'trail');
  return [base, feature].filter(Boolean).join('-').slice(0, 120) || `trail-${Date.now()}`;
}

function deriveTrailProperties(candidate: ImportSegmentCandidate) {
  return {
    imported_via: 'stage6-materialization',
    source_slug: candidate.sourceSlug,
    source_feature_id: candidate.sourceFeatureId,
    source_properties: candidate.properties ?? {},
  };
}

async function upsertSegment(supabase: ReturnType<typeof createSupabaseServiceClient>, sourceId: string, candidate: ImportSegmentCandidate, geomHash: string) {
  const payload = {
    source_id: sourceId,
    source_feature_id: candidate.sourceFeatureId,
    name: candidate.name ?? null,
    geom: lineStringToWkt(candidate.coordinates),
    geom_hash: geomHash,
    allowed_uses: candidate.allowedUses ?? {},
    status: candidate.status ?? 'unknown',
    surface: candidate.surface ?? null,
    difficulty: candidate.difficulty ?? null,
    properties: candidate.properties ?? {},
  };

  const { data: existing, error: selErr } = await supabase
    .from('trail_segments')
    .select('id,geom_hash')
    .eq('source_id', sourceId)
    .eq('source_feature_id', candidate.sourceFeatureId)
    .maybeSingle();

  if (selErr) throw selErr;

  if (!existing) {
    const { data, error } = await supabase.from('trail_segments').insert(payload).select('id').single();
    if (error) throw error;
    return { segmentId: data.id as string, action: 'inserted' as const };
  }

  if (existing.geom_hash !== geomHash) {
    const { error } = await supabase.from('trail_segments').update(payload).eq('id', existing.id);
    if (error) throw error;
    return { segmentId: existing.id as string, action: 'updated' as const };
  }

  return { segmentId: existing.id as string, action: 'skipped' as const };
}

async function materializeTrailForSegment(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  sourceId: string,
  candidate: ImportSegmentCandidate,
  segmentId: string,
  geomHash: string
) {
  const trailPayload = {
    name: deriveTrailName(candidate),
    slug: buildTrailSlug(candidate),
    region: (candidate.properties?.region as string | undefined) ?? null,
    source_id: sourceId,
    source_feature_id: candidate.sourceFeatureId,
    geom_hash: geomHash,
    bbox: bboxPolygonToWkt(candidate.coordinates),
    difficulty: candidate.difficulty ?? null,
    allowed_uses: candidate.allowedUses ?? {},
    status: candidate.status ?? 'unknown',
    surface: candidate.surface ?? null,
    properties: deriveTrailProperties(candidate),
    description: (candidate.properties?.description as string | undefined) ?? null,
    tags: [],
  };

  const { data: existingTrail, error: trailSelectError } = await supabase
    .from('geo_trails')
    .select('id')
    .eq('source_id', sourceId)
    .eq('source_feature_id', candidate.sourceFeatureId)
    .maybeSingle();

  if (trailSelectError) throw trailSelectError;

  let trailId: string;
  if (!existingTrail) {
    const { data, error } = await supabase.from('geo_trails').insert(trailPayload).select('id').single();
    if (error) throw error;
    trailId = data.id as string;
  } else {
    const { error } = await supabase.from('geo_trails').update(trailPayload).eq('id', existingTrail.id);
    if (error) throw error;
    trailId = existingTrail.id as string;
  }

  const { error: linkError } = await supabase.from('trail_trail_segments').upsert(
    {
      trail_id: trailId,
      segment_id: segmentId,
      sort_order: 0,
      reversed: false,
    },
    { onConflict: 'trail_id,segment_id' }
  );

  if (linkError) throw linkError;
}

export async function import_source(
  source_name: string,
  input_path_or_url: string,
  bbox_optional?: BBox
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    source: source_name,
    scanned: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  const candidates = await parseInput(source_name, input_path_or_url, bbox_optional);
  summary.scanned = candidates.length;

  const sourceSlug = source_name === 'osm' ? 'osm' : source_name === 'ndt' ? 'ndt' : 'mvum';
  const sourceId = await ensureSource(sourceSlug);

  const supabase = createSupabaseServiceClient();

  for (const c of candidates) {
    try {
      const geom_hash = buildCanonicalHash(c);
      const { segmentId, action } = await upsertSegment(supabase, sourceId, c, geom_hash);
      await materializeTrailForSegment(supabase, sourceId, c, segmentId, geom_hash);

      if (action === 'inserted') summary.inserted++;
      else if (action === 'updated') summary.updated++;
      else summary.skipped++;
    } catch (e) {
      summary.errors++;
      console.error('[import_source row error]', {
        source: source_name,
        feature: c.sourceFeatureId,
        message: e instanceof Error ? e.message : String(e),
        details: e,
      });
    }
  }

  return summary;
}
