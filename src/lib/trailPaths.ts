import { LatLng, Trail } from '@/types';

/**
 * Trail Path Generator
 *
 * Generates realistic-looking trail polylines from a trail's center point.
 * Used when actual GPS paths aren't available in the database.
 *
 * The generated paths simulate off-road trail characteristics:
 * - Winding routes with natural curves
 * - Varying segment lengths
 * - Realistic heading changes
 */

// Seeded random for consistent path generation per trail
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Convert string ID to numeric seed
function idToSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Generate a trail path from center coordinates
 *
 * @param centerLat - Trail center latitude
 * @param centerLng - Trail center longitude
 * @param trailId - Trail ID for seeded randomness
 * @param difficulty - Trail difficulty (1-4), affects path complexity
 * @returns Array of [lat, lng] coordinate pairs
 */
export function generateTrailPath(
  centerLat: number,
  centerLng: number,
  trailId: string,
  difficulty: number = 2
): LatLng[] {
  const random = seededRandom(idToSeed(trailId));

  // Trail length varies by difficulty (in degrees, roughly)
  const baseLength = 0.02 + (difficulty * 0.01); // ~2-5km depending on difficulty
  const numPoints = 8 + Math.floor(difficulty * 4); // 12-24 points

  // Start with initial heading (random direction)
  let heading = random() * Math.PI * 2;
  const points: LatLng[] = [];

  // Calculate start point (offset from center)
  const startOffset = baseLength * 0.4;
  let currentLat = centerLat - Math.cos(heading) * startOffset;
  let currentLng = centerLng - Math.sin(heading) * startOffset;

  points.push([currentLat, currentLng]);

  // Generate path segments
  const segmentLength = baseLength / numPoints;

  for (let i = 1; i <= numPoints; i++) {
    // Vary heading with more turns for harder trails
    const turnFactor = 0.3 + (difficulty * 0.15);
    const headingChange = (random() - 0.5) * Math.PI * turnFactor;
    heading += headingChange;

    // Vary segment length slightly
    const lengthVar = 0.7 + random() * 0.6;
    const actualLength = segmentLength * lengthVar;

    // Calculate next point
    currentLat += Math.cos(heading) * actualLength;
    currentLng += Math.sin(heading) * actualLength * 1.2; // Adjust for lat/lng ratio

    points.push([currentLat, currentLng]);
  }

  return points;
}

/**
 * Get the center point of a trail path
 */
export function getPathCenter(path: LatLng[]): LatLng {
  if (path.length === 0) return [0, 0];

  const midIndex = Math.floor(path.length / 2);
  return path[midIndex];
}

/**
 * Calculate total path length in approximate kilometers
 */
export function getPathLengthKm(path: LatLng[]): number {
  if (path.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    const [lat1, lng1] = path[i - 1];
    const [lat2, lng2] = path[i];

    // Haversine formula approximation
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
  }

  return Math.round(totalDistance * 10) / 10;
}

/**
 * Enhance a trail with generated path coordinates if not present
 */
export function ensureTrailPath<T extends Trail>(trail: T): T & { pathCoordinates: LatLng[] } {
  if (trail.pathCoordinates && trail.pathCoordinates.length > 0) {
    return trail as T & { pathCoordinates: LatLng[] };
  }

  // Generate path based on trail properties
  const difficulty = (trail as { baseDifficulty?: number }).baseDifficulty || 2;
  const pathCoordinates = generateTrailPath(
    trail.latitude,
    trail.longitude,
    trail.id,
    difficulty
  );

  return {
    ...trail,
    pathCoordinates,
  };
}

/**
 * Pre-defined paths for known trails (more realistic GPS data)
 * These override generated paths for specific trails
 */
export const KNOWN_TRAIL_PATHS: Record<string, LatLng[]> = {
  // Rubicon Trail (iconic California off-road trail)
  'rubicon': [
    [38.9847, -120.1432],
    [38.9865, -120.1398],
    [38.9891, -120.1356],
    [38.9923, -120.1312],
    [38.9958, -120.1289],
    [38.9987, -120.1245],
    [39.0012, -120.1198],
    [39.0045, -120.1156],
    [39.0078, -120.1123],
    [39.0112, -120.1089],
    [39.0145, -120.1045],
    [39.0178, -120.0998],
    [39.0212, -120.0956],
    [39.0245, -120.0912],
  ],
};
