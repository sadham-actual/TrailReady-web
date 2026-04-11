import { ImportSegmentCandidate } from './types';
import { deriveAllowedUses, normalizeCoordinates, normalizeStatus } from './normalize';

export function parseGeoJsonSegments(input: any, sourceSlug: string): ImportSegmentCandidate[] {
  const features = Array.isArray(input?.features) ? input.features : [];
  const results: ImportSegmentCandidate[] = [];

  for (const f of features) {
    if (f?.geometry?.type !== 'LineString') continue;
    const properties = (f.properties ?? {}) as Record<string, unknown>;
    const coords = normalizeCoordinates(f.geometry.coordinates);
    if (coords.length < 2) continue;

    const sourceFeatureId = String(
      f.id ?? properties.id ?? properties.feature_id ?? `${sourceSlug}-${results.length + 1}`
    );

    results.push({
      sourceSlug,
      sourceFeatureId,
      name: (properties.name as string | undefined) ?? undefined,
      coordinates: coords,
      properties,
      status: normalizeStatus(properties.status),
      allowedUses: deriveAllowedUses(properties),
      surface: (properties.surface as string | undefined) ?? undefined,
      difficulty: (properties.difficulty as string | undefined) ?? undefined,
    });
  }

  return results;
}
