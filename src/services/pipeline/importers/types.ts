import { Coordinate, SourceSlug } from '@/lib/pipeline/types';

export interface ImportSegmentCandidate {
  sourceSlug: SourceSlug;
  sourceFeatureId: string;
  name?: string;
  coordinates: Coordinate[];
  properties: Record<string, unknown>;
  status?: 'open' | 'closed' | 'seasonal' | 'unknown';
  allowedUses?: Record<string, boolean | 'unknown'>;
  surface?: string;
  difficulty?: string;
}

export interface ImportSummary {
  source: string;
  scanned: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}
