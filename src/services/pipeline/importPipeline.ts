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

  await supabase.from('sources').upsert({
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
  }, { onConflict: 'slug' });

  const { data } = await supabase.from('sources').select('id').eq('slug', sourceSlug).single();
  return data?.id as string;
}

async function parseInput(sourceName: string, inputPathOrUrl: string, bbox?: BBox): Promise<ImportSegmentCandidate[]> {
  if (sourceName === 'geojson') {
    const raw = await fs.readFile(inputPathOrUrl, 'utf-8');
    return parseGeoJsonSegments(JSON.parse(raw), 'mvum');
  }

  if (sourceName === 'shapefile') {
    return parseShapefileSegments(inputPathOrUrl, 'mvum');
  }

  if (sourceName === 'osm') {
    if (inputPathOrUrl.startsWith('http')) {
      const res = await fetch(inputPathOrUrl);
      return parseOverpassSegments(await res.json());
    }

    if (!bbox) throw new Error('bbox is required for OSM import without URL');
    const query = buildOverpassQuery(bbox);
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    return parseOverpassSegments(await res.json());
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
