import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createSupabaseServiceClient } from '@/lib/supabase/server';
import { computeGeomHash } from '@/lib/pipeline/geometry';
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
      const payload = {
        source_id: sourceId,
        source_feature_id: c.sourceFeatureId,
        name: c.name ?? null,
        geom: lineStringToWkt(c.coordinates),
        geom_hash,
        allowed_uses: c.allowedUses ?? {},
        status: c.status ?? 'unknown',
        surface: c.surface ?? null,
        difficulty: c.difficulty ?? null,
        properties: c.properties ?? {},
      };

      const { data: existing, error: selErr } = await supabase
        .from('trail_segments')
        .select('id,geom_hash')
        .eq('source_id', sourceId)
        .eq('source_feature_id', c.sourceFeatureId)
        .maybeSingle();

      if (selErr) throw selErr;

      if (!existing) {
        const { error } = await supabase.from('trail_segments').insert(payload);
        if (error) throw error;
        summary.inserted++;
      } else if (existing.geom_hash !== geom_hash) {
        const { error } = await supabase.from('trail_segments').update(payload).eq('id', existing.id);
        if (error) throw error;
        summary.updated++;
      } else {
        summary.skipped++;
      }
    } catch {
      summary.errors++;
    }
  }

  return summary;
}
