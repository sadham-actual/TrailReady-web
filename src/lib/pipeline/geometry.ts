/**
 * Stage 2: Shared geometry utilities for the TrailReady pipeline.
 *
 * Provides:
 *  - Coordinate normalization (round to fixed precision)
 *  - Douglas-Peucker simplification
 *  - Deterministic geom_hash (SHA-256 of canonical serialised geometry)
 *  - Deduplication preference helper (authoritative source precedence)
 *
 * All functions are pure and side-effect-free.
 * Node.js crypto is used for hashing (pipeline is server-side).
 */

import { createHash } from 'crypto';
import type { Coordinate, PipelineSegment, SourceSlug } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Decimal places used when rounding coordinates for hash computation.
 * 7 d.p. ≈ 1.1 cm precision — sufficient for trail deduplication.
 */
const HASH_PRECISION = 7;

/**
 * Source authority order (highest precedence first).
 * MVUM = Motor Vehicle Use Map (authoritative USFS data).
 * OSM  = OpenStreetMap (community).
 * NDT  = National Data Trails (secondary federal dataset).
 * Unknown slugs are ranked lowest.
 */
const SOURCE_PRECEDENCE: SourceSlug[] = ['mvum', 'osm', 'ndt'];

// ---------------------------------------------------------------------------
// Coordinate normalisation
// ---------------------------------------------------------------------------

/**
 * Round a single coordinate value to the given number of decimal places.
 */
export function roundCoord(value: number, precision: number = HASH_PRECISION): number {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

/**
 * Normalise a single coordinate: round lng/lat to HASH_PRECISION decimal
 * places and (optionally) elevation to 2 d.p.
 */
export function normalizeCoordinate(coord: Coordinate): Coordinate {
  const [lng, lat, ele] = coord as [number, number, number | undefined];
  if (ele !== undefined) {
    return [roundCoord(lng), roundCoord(lat), roundCoord(ele, 2)];
  }
  return [roundCoord(lng), roundCoord(lat)];
}

/**
 * Normalise an array of coordinates.
 */
export function normalizeCoordinates(coords: Coordinate[]): Coordinate[] {
  return coords.map(normalizeCoordinate);
}

// ---------------------------------------------------------------------------
// Douglas-Peucker simplification
// ---------------------------------------------------------------------------

/**
 * Perpendicular distance from a point to the line defined by start→end.
 * Coordinates are treated as 2D (lng, lat); elevation is ignored.
 */
function perpendicularDistance(
  point: Coordinate,
  lineStart: Coordinate,
  lineEnd: Coordinate,
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    // Degenerate line — return distance to the single point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;
  return Math.sqrt((px - nearestX) ** 2 + (py - nearestY) ** 2);
}

/**
 * Recursive Douglas-Peucker simplification.
 *
 * @param coords  Input coordinate array.
 * @param epsilon Tolerance in the same units as the coordinates (degrees for
 *                WGS-84 lng/lat). A value of 0.00001 ≈ 1.1 m at the equator.
 * @returns Simplified coordinate array (always includes first and last point).
 */
export function simplify(coords: Coordinate[], epsilon: number = 0.00001): Coordinate[] {
  if (coords.length <= 2) return coords.slice();

  // Find the point furthest from the line start→end
  let maxDist = 0;
  let maxIndex = 0;

  const first = coords[0];
  const last = coords[coords.length - 1];

  for (let i = 1; i < coords.length - 1; i++) {
    const d = perpendicularDistance(coords[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    // Recursively simplify each half
    const left = simplify(coords.slice(0, maxIndex + 1), epsilon);
    const right = simplify(coords.slice(maxIndex), epsilon);
    // Merge (drop the duplicated junction point)
    return [...left.slice(0, -1), ...right];
  }

  // All intermediate points are within epsilon — keep only endpoints
  return [first, last];
}

// ---------------------------------------------------------------------------
// Deterministic geometry hash
// ---------------------------------------------------------------------------

/**
 * Canonicalise coordinate direction: always order the geometry so that the
 * lexicographically smaller endpoint comes first.  This ensures that the
 * same physical line always produces the same hash regardless of digitising
 * direction.
 */
function canonicaliseDirection(coords: Coordinate[]): Coordinate[] {
  if (coords.length === 0) return coords;

  const first = coords[0];
  const last = coords[coords.length - 1];

  // Compare as serialised strings for a fully deterministic ordering
  const firstStr = first.join(',');
  const lastStr = last.join(',');

  return firstStr <= lastStr ? coords : [...coords].reverse();
}

/**
 * Compute a deterministic SHA-256 hex digest of the canonical geometry.
 *
 * Algorithm:
 *  1. Normalise each coordinate to HASH_PRECISION decimal places.
 *  2. Canonicalise direction (sort so the smaller endpoint is first).
 *  3. Serialise to a compact JSON string.
 *  4. SHA-256 → hex.
 *
 * @param coordinates Raw coordinate array ([lng, lat] or [lng, lat, ele]).
 * @returns 64-character hex string, or empty string for empty input.
 */
export function computeGeomHash(coordinates: Coordinate[]): string {
  if (coordinates.length === 0) return '';

  const normalised = normalizeCoordinates(coordinates);
  const canonical = canonicaliseDirection(normalised);
  const serialised = JSON.stringify(canonical);

  return createHash('sha256').update(serialised, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Deduplication / source-precedence helper
// ---------------------------------------------------------------------------

/**
 * Return the index in SOURCE_PRECEDENCE for the given slug.
 * Unknown slugs return Infinity (lowest priority).
 */
function sourcePriority(slug: SourceSlug): number {
  const idx = SOURCE_PRECEDENCE.indexOf(slug);
  return idx === -1 ? Infinity : idx;
}

/**
 * Given an array of segments that share the same geom_hash, return the
 * single "winner" according to source authority precedence:
 *   MVUM > OSM > NDT > (other)
 *
 * When two segments have identical precedence the one appearing earlier
 * in the input array is preferred (stable selection).
 *
 * @param candidates One or more segments competing for the same geometry slot.
 * @returns The preferred segment, or undefined for an empty array.
 */
export function pickPreferredSegment(
  candidates: PipelineSegment[],
): PipelineSegment | undefined {
  if (candidates.length === 0) return undefined;

  return candidates.reduce<PipelineSegment>((best, current) => {
    const bestPriority = sourcePriority(best.source_slug);
    const currentPriority = sourcePriority(current.source_slug);
    return currentPriority < bestPriority ? current : best;
  }, candidates[0]);
}

/**
 * Deduplicate an array of pipeline segments by geom_hash.
 *
 * Segments without a geom_hash are passed through unchanged (no dedup).
 * For each group of segments sharing a geom_hash, only the authoritative
 * winner (per pickPreferredSegment) is retained.
 *
 * The output preserves the relative ordering of the winning segments.
 *
 * @param segments Input segment list (may have duplicate hashes).
 * @returns Deduplicated segment list.
 */
export function deduplicateSegments(segments: PipelineSegment[]): PipelineSegment[] {
  const groups = new Map<string, PipelineSegment[]>();
  const noHash: PipelineSegment[] = [];

  for (const seg of segments) {
    if (!seg.geom_hash) {
      noHash.push(seg);
      continue;
    }
    const group = groups.get(seg.geom_hash) ?? [];
    group.push(seg);
    groups.set(seg.geom_hash, group);
  }

  // Pick winners in the order their geom_hash was first seen
  const seen = new Map<string, boolean>();
  const winners: PipelineSegment[] = [];

  for (const seg of segments) {
    if (!seg.geom_hash) continue;
    if (seen.has(seg.geom_hash)) continue;
    seen.set(seg.geom_hash, true);

    const group = groups.get(seg.geom_hash)!;
    const winner = pickPreferredSegment(group);
    if (winner) winners.push(winner);
  }

  return [...winners, ...noHash];
}
