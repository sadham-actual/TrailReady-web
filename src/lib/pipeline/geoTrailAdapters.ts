import { Trail, Status, LatLng } from '@/types';

export type GeoMappedTrail = Trail;

type GeoSegmentRow = {
  geometry?: {
    coordinates?: unknown[];
  } | null;
};

type GeoTrailListRow = {
  id: string;
  name: string;
  region?: string | null;
  source_name?: string | null;
  center_lat?: number | null;
  center_lng?: number | null;
  description?: string | null;
  difficulty?: string | null;
  status?: string | null;
};

type GeoTrailDetailRow = {
  id: string;
  name: string;
  region?: string | null;
  properties?: {
    source_slug?: string | null;
  } | null;
  description?: string | null;
  difficulty?: string | null;
  status?: string | null;
};

function mapGeoStatus(status?: string | null): Status | undefined {
  const normalized = String(status ?? 'unknown').toLowerCase();
  if (normalized === 'open') return 'clear';
  if (normalized === 'seasonal') return 'rough';
  if (normalized === 'closed') return 'impassable';
  return undefined;
}

function mapDifficultyToBase(difficulty?: string | null): number | undefined {
  const normalized = String(difficulty ?? '').toLowerCase();
  if (!normalized) return undefined;
  if (['easy', 'beginner', 'green'].includes(normalized)) return 1;
  if (['moderate', 'intermediate', 'blue'].includes(normalized)) return 2;
  if (['hard', 'difficult', 'advanced', 'black'].includes(normalized)) return 3;
  if (['extreme', 'expert', 'double-black'].includes(normalized)) return 4;
  return undefined;
}

function coordsFromSegments(rows: GeoSegmentRow[]): LatLng[] {
  const out: LatLng[] = [];

  for (const row of rows ?? []) {
    const coords = Array.isArray(row?.geometry?.coordinates) ? row.geometry.coordinates : [];
    for (const coord of coords) {
      if (!Array.isArray(coord) || coord.length < 2) continue;
      const lng = Number(coord[0]);
      const lat = Number(coord[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      out.push([lat, lng]);
    }
  }

  return out;
}

export function mapGeoTrailListRowToTrail(row: GeoTrailListRow): Trail {
  return {
    id: String(row.id),
    name: row.name,
    region: row.region ?? row.source_name ?? 'Imported',
    latitude: row.center_lat ?? 0,
    longitude: row.center_lng ?? 0,
    description: row.description ?? undefined,
    baseDifficulty: mapDifficultyToBase(row.difficulty),
    latestStatus: mapGeoStatus(row.status),
    lastReportAt: undefined,
    difficultyScore: undefined,
    terrainType: undefined,
    minTireSize: undefined,
    requiredGear: undefined,
    currentStatus: row.status === 'closed' ? 'Closed' : 'Open',
    gpxUrl: `/api/geo/trails/${row.id}/gpx`,
  };
}

export function mapGeoTrailDetailToTrail(trail: GeoTrailDetailRow, segmentRows: GeoSegmentRow[]): Trail {
  const coords = coordsFromSegments(segmentRows);
  const first = coords[0];

  return {
    id: String(trail.id),
    name: trail.name,
    region: trail.region ?? trail.properties?.source_slug ?? 'Imported',
    latitude: first?.[0] ?? 0,
    longitude: first?.[1] ?? 0,
    description: trail.description ?? undefined,
    baseDifficulty: mapDifficultyToBase(trail.difficulty),
    latestStatus: mapGeoStatus(trail.status),
    lastReportAt: undefined,
    pathCoordinates: coords,
    difficultyScore: undefined,
    terrainType: undefined,
    minTireSize: undefined,
    requiredGear: undefined,
    currentStatus: trail.status === 'closed' ? 'Closed' : 'Open',
    gpxUrl: `/api/geo/trails/${trail.id}/gpx`,
  };
}
