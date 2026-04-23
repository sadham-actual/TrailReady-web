import { Coordinate, PipelineSegment, SourceAttribution } from './types';

export interface ParsedBbox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

type RpcSegmentRow = {
  segment_id: string;
  source_slug?: string | null;
  source_name?: string | null;
  segment_name?: string | null;
  geometry?: {
    coordinates?: number[][];
  } | null;
  reversed?: boolean | null;
  properties?: Record<string, unknown> | null;
};

export function parseBbox(raw?: string | null): ParsedBbox | null {
  if (!raw) return null;
  const p = raw.split(',').map((n) => Number(n.trim()));
  if (p.length !== 4 || p.some((n) => !Number.isFinite(n))) return null;
  const [minLng, minLat, maxLng, maxLat] = p;
  if (minLng > maxLng || minLat > maxLat) return null;
  return { minLng, minLat, maxLng, maxLat };
}

export function mapRpcRowsToPipelineSegments(rows: RpcSegmentRow[]): PipelineSegment[] {
  return rows.map((r) => {
    const coords = ((r.geometry?.coordinates ?? []) as number[][]).map((c) => {
      if (c.length >= 3) return [c[0], c[1], c[2]] as Coordinate;
      return [c[0], c[1]] as Coordinate;
    });

    return {
      id: String(r.segment_id),
      source_slug: r.source_slug ?? 'unknown',
      name: r.segment_name ?? undefined,
      coordinates: coords,
      reversed: Boolean(r.reversed),
      properties: r.properties ?? {},
    };
  });
}

export function collectAttributions(rows: RpcSegmentRow[]): SourceAttribution[] {
  const map = new Map<string, SourceAttribution>();
  for (const r of rows) {
    const slug = String(r.source_slug ?? 'unknown');
    if (map.has(slug)) continue;
    map.set(slug, {
      slug,
      name: r.source_name ?? slug,
      license: undefined,
      url: undefined,
    });
  }
  return [...map.values()];
}

export function asDownloadFilename(name: string, type: 'trail' | 'route') {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${type}-${base || 'track'}.gpx`;
}
