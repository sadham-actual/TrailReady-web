/**
 * Stage 2: Shared pipeline type definitions.
 * Used by geometry utilities and the GPX generator service.
 */

/**
 * GeoJSON-style coordinate pair or triple.
 * Ordering: [longitude, latitude] with optional elevation (meters).
 */
export type Coordinate = [number, number] | [number, number, number];

/**
 * Source authority slugs recognised by the pipeline.
 * Precedence (highest → lowest): mvum > osm > ndt
 */
export type SourceSlug = 'mvum' | 'osm' | 'ndt' | string;

/**
 * A geometry segment as it flows through the pipeline.
 * coordinates are in GeoJSON order: [lng, lat] (optionally with ele).
 */
export interface PipelineSegment {
  /** Stable identifier (e.g. UUID from trail_segments). */
  id: string;
  /** Source slug, e.g. 'mvum', 'osm', 'ndt'. */
  source_slug: SourceSlug;
  /** Human-readable name for the segment / trail feature. */
  name?: string;
  /** SHA-256 hex digest of canonical geometry, used for dedup. */
  geom_hash?: string;
  /**
   * Ordered coordinate pairs [lng, lat] or [lng, lat, ele].
   * GeoJSON convention.
   */
  coordinates: Coordinate[];
  /**
   * When true the segment must be traversed in reverse order
   * to maintain route continuity.
   */
  reversed?: boolean;
  /** Arbitrary source-specific properties. */
  properties?: Record<string, unknown>;
}

/**
 * Metadata about a contributing data source, used for GPX attribution.
 */
export interface SourceAttribution {
  slug: SourceSlug;
  /** Display name. */
  name: string;
  /** Homepage / data download URL. */
  url?: string;
  /** SPDX identifier or free-text license string. */
  license?: string;
}

/**
 * Input descriptor for the GPX generator.
 */
export interface GpxGeneratorInput {
  /** Trail or route name written into GPX <metadata>/<trk> name tags. */
  name: string;
  /** Optional description written into GPX <metadata>. */
  description?: string;
  /**
   * Ordered list of segments to include in the track.
   * Segments are direction-aware (see PipelineSegment.reversed).
   */
  segments: PipelineSegment[];
  /**
   * Source attributions for all contributing data sources.
   * Written into GPX <metadata><desc>.
   */
  attributions?: SourceAttribution[];
}

/**
 * Output of the GPX generator.
 */
export interface GpxGeneratorResult {
  /** UTF-8 GPX 1.1 XML string. */
  gpx: string;
  /** Number of <trkseg> elements emitted (≥1; >1 means discontinuities were found). */
  trackSegmentCount: number;
  /** Total number of trackpoints across all segments. */
  trackpointCount: number;
}
