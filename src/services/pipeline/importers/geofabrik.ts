import fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { BBox, ImportSegmentCandidate } from './types';
import { deriveAllowedUses, normalizeCoordinates, normalizeStatus } from './normalize';

const CACHE_DIR = path.resolve(process.cwd(), 'data/cache');
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const ROADS_LAYER_NAME = 'gis_osm_roads_free_1';
const OHV_FCLASSES = new Set(['track', 'path', 'unclassified', 'service']);

interface GeofabrikProps {
  fclass?: string;
  name?: string;
  osm_id?: number | string;
  motor_veh?: string; // DBF truncates 'motor_vehicle' to 10 chars
  surface?: string;
  status?: string;
  [key: string]: unknown;
}

function deriveCachePath(url: string): string {
  const filename = url.split('/').pop() ?? 'unknown.shp.zip';
  const statePart = filename.replace(/-latest-free\.shp\.zip$/i, '').replace(/[^a-z0-9]/gi, '-');
  return path.join(CACHE_DIR, `geofabrik-${statePart}-roads.geojson`);
}

async function isCacheFresh(cachePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(cachePath);
    return Date.now() - stat.mtimeMs < CACHE_MAX_AGE_MS;
  } catch { return false; }
}

function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

async function downloadZip(url: string): Promise<ArrayBuffer> {
  console.log(`[Geofabrik] Downloading ${url} (this may take several minutes)...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`[Geofabrik] HTTP ${res.status} fetching ${url}`);
  return res.arrayBuffer();
}

function extractRoadsLayer(
  result: GeoJSON.FeatureCollection | GeoJSON.FeatureCollection[]
): GeoJSON.FeatureCollection {
  if (!Array.isArray(result)) return result;
  const layers = result as Array<GeoJSON.FeatureCollection & { fileName?: string }>;
  const roadsLayer = layers.find((fc) => fc.fileName?.includes(ROADS_LAYER_NAME));
  if (!roadsLayer) {
    const available = layers.map((fc) => fc.fileName ?? 'unnamed').join(', ');
    throw new Error(`[Geofabrik] Roads layer "${ROADS_LAYER_NAME}" not found. Available: ${available}`);
  }
  return roadsLayer;
}

function isOhvRelevant(props: GeofabrikProps): boolean {
  const fclass = (props.fclass ?? '').toLowerCase();
  if (!OHV_FCLASSES.has(fclass)) return false;
  // Tracks are OHV-relevant by default (matches OSM importer behavior)
  if (fclass === 'track') return true;
  // For path/unclassified/service, require explicit motor vehicle access
  const motorVeh = (props.motor_veh ?? '').toLowerCase();
  return ['yes', 'designated', 'permissive'].includes(motorVeh);
}

function featureIntersectsBBox(feature: GeoJSON.Feature, bbox: BBox): boolean {
  if (feature.geometry?.type !== 'LineString') return false;
  const coords = feature.geometry.coordinates as [number, number][];
  return coords.some(
    ([lng, lat]) =>
      lng >= bbox.minLng && lng <= bbox.maxLng && lat >= bbox.minLat && lat <= bbox.maxLat
  );
}

export async function parseGeofabrikSegments(
  url: string,
  bbox: BBox
): Promise<ImportSegmentCandidate[]> {
  ensureCacheDir();
  const cachePath = deriveCachePath(url);

  let roadsGeoJson: GeoJSON.FeatureCollection;

  if (await isCacheFresh(cachePath)) {
    console.log(`[Geofabrik] Using cached roads layer: ${cachePath}`);
    roadsGeoJson = JSON.parse(await fs.readFile(cachePath, 'utf-8')) as GeoJSON.FeatureCollection;
  } else {
    const zipBuffer = await downloadZip(url);
    console.log(`[Geofabrik] Parsing shapefile zip...`);
    // shpjs is browser-first and uses `self` — polyfill before dynamic import
    if (typeof self === 'undefined') {
      (globalThis as Record<string, unknown>).self = globalThis;
    }
    const { default: shp } = await import('shpjs');
    roadsGeoJson = extractRoadsLayer(await shp(zipBuffer));
    // Cache asynchronously — failure is non-fatal
    fs.writeFile(cachePath, JSON.stringify(roadsGeoJson), 'utf-8').catch((err: Error) =>
      console.warn(`[Geofabrik] Cache write failed (non-fatal): ${err.message}`)
    );
    console.log(`[Geofabrik] Cached to ${cachePath}`);
  }

  const results: ImportSegmentCandidate[] = [];

  for (const feature of roadsGeoJson.features ?? []) {
    if (feature.geometry?.type !== 'LineString') continue;
    const props = (feature.properties ?? {}) as GeofabrikProps;
    if (!isOhvRelevant(props)) continue;
    if (!featureIntersectsBBox(feature, bbox)) continue;

    const coords = normalizeCoordinates((feature.geometry as GeoJSON.LineString).coordinates);
    if (coords.length < 2) continue;

    results.push({
      sourceSlug: 'mvum',
      sourceFeatureId: props.osm_id != null ? `way/${props.osm_id}` : `geofabrik-${results.length + 1}`,
      name: props.name ?? undefined,
      coordinates: coords,
      properties: { ...props },
      status: normalizeStatus(props.status),
      // Remap DBF-truncated field so deriveAllowedUses can find motor_vehicle
      allowedUses: deriveAllowedUses({ ...props, motor_vehicle: props.motor_veh }),
      surface: props.surface ?? undefined,
      difficulty: undefined,
    });
  }

  console.log(
    `[Geofabrik] ${results.length} OHV segments from ${roadsGeoJson.features?.length ?? 0} total road features`
  );
  return results;
}
