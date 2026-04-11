import * as shapefile from 'shapefile';
import { ImportSegmentCandidate } from './types';
import { deriveAllowedUses, normalizeCoordinates, normalizeStatus } from './normalize';

export async function parseShapefileSegments(path: string, sourceSlug: string): Promise<ImportSegmentCandidate[]> {
  const source = await shapefile.open(path);
  const results: ImportSegmentCandidate[] = [];

  while (true) {
    const { done, value } = await source.read();
    if (done) break;
    if (!value || value.geometry?.type !== 'LineString') continue;

    const properties = (value.properties ?? {}) as Record<string, unknown>;
    const coords = normalizeCoordinates(value.geometry.coordinates);
    if (coords.length < 2) continue;

    const sourceFeatureId = String(
      properties.id ?? properties.fid ?? properties.objectid ?? `${sourceSlug}-${results.length + 1}`
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
