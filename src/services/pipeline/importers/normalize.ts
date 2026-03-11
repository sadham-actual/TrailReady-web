import { Coordinate } from '@/lib/pipeline/types';
import { ImportSegmentCandidate } from './types';

export function lineStringToWkt(coords: Coordinate[]): string {
  const pairs = coords.map((c) => `${c[0]} ${c[1]}`).join(', ');
  return `SRID=4326;LINESTRING()`;
}

export function normalizeStatus(input?: unknown): ImportSegmentCandidate['status'] {
  const s = String(input ?? 'unknown').toLowerCase();
  if (['open', 'opened', 'yes', 'true'].includes(s)) return 'open';
  if (['closed', 'no', 'false'].includes(s)) return 'closed';
  if (['seasonal', 'winter', 'summer'].includes(s)) return 'seasonal';
  return 'unknown';
}

export function deriveAllowedUses(properties: Record<string, unknown>): Record<string, boolean | 'unknown'> {
  const toBool = (v: unknown): boolean | 'unknown' => {
    const s = String(v ?? '').toLowerCase();
    if (['yes', 'true', '1', 'designated', 'permissive'].includes(s)) return true;
    if (['no', 'false', '0', 'private'].includes(s)) return false;
    return 'unknown';
  };

  return {
    ohv: toBool(properties.ohv ?? properties.motor_vehicle),
    '4x4': toBool(properties['4x4'] ?? properties.motorcar),
    motorcycle: toBool(properties.motorcycle),
    atv: toBool(properties.atv),
  };
}

export function normalizeCoordinates(raw: unknown): Coordinate[] {
  if (!Array.isArray(raw)) return [];
  const out: Coordinate[] = [];
  for (const p of raw) {
    if (!Array.isArray(p) || p.length < 2) continue;
    const lng = Number(p[0]);
    const lat = Number(p[1]);
    const ele = p[2] !== undefined ? Number(p[2]) : undefined;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    if (ele !== undefined && Number.isFinite(ele)) out.push([lng, lat, ele]);
    else out.push([lng, lat]);
  }
  return out;
}
