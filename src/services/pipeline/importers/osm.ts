import { ImportSegmentCandidate } from './types';
import { deriveAllowedUses, normalizeCoordinates, normalizeStatus } from './normalize';

type OverpassGeometryPoint = {
  lon: number;
  lat: number;
};

type OverpassElement = {
  type: string;
  id: number | string;
  tags?: Record<string, string> | null;
  geometry?: OverpassGeometryPoint[] | null;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

function isOhvRelevant(tags: Record<string, string>): boolean {
  const highway = tags.highway;
  const allowedHighways = new Set(['track', 'path', 'service', 'unclassified']);
  const likelyMotorized =
    ['yes', 'designated', 'permissive'].includes((tags.motor_vehicle || '').toLowerCase()) ||
    ['yes', 'designated'].includes((tags.motorcar || '').toLowerCase()) ||
    ['yes', 'designated'].includes((tags.atv || '').toLowerCase()) ||
    ['yes', 'designated'].includes((tags.motorcycle || '').toLowerCase());

  const clearlyPedestrianOnly = ['footway', 'steps', 'pedestrian'].includes(highway) && !likelyMotorized;
  if (clearlyPedestrianOnly) return false;

  return allowedHighways.has(highway) && (likelyMotorized || highway === 'track' || highway === 'service');
}

export function parseOverpassSegments(input: OverpassResponse): ImportSegmentCandidate[] {
  const elements = Array.isArray(input?.elements) ? input.elements : [];
  const results: ImportSegmentCandidate[] = [];

  for (const el of elements) {
    if (el.type !== 'way' || !Array.isArray(el.geometry)) continue;
    const tags = (el.tags ?? {}) as Record<string, string>;
    if (!isOhvRelevant(tags)) continue;

    const coords = normalizeCoordinates(
      el.geometry.map((g) => [g.lon, g.lat])
    );
    if (coords.length < 2) continue;

    const properties: Record<string, unknown> = {
      ...tags,
      osm_type: el.type,
      osm_id: el.id,
    };

    results.push({
      sourceSlug: 'osm',
      sourceFeatureId: `way/${el.id}`,
      name: tags.name,
      coordinates: coords,
      properties,
      status: normalizeStatus(tags.status),
      allowedUses: deriveAllowedUses(properties),
      surface: tags.surface,
      difficulty: tags.sac_scale,
    });
  }

  return results;
}

export function buildOverpassQuery(bbox: { minLat: number; minLng: number; maxLat: number; maxLng: number }) {
  return `[out:json][timeout:120];\n(\n  way[highway~"track|path|service|unclassified"](${bbox.minLat},${bbox.minLng},${bbox.maxLat},${bbox.maxLng});\n);\nout geom;`;
}
