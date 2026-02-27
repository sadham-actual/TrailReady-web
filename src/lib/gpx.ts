import { gpx as toGeoJSON } from '@tmcw/togeojson';

export interface GpxPoint {
  lat: number;
  lng: number;
  ele?: number;
  distanceKm: number;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export function parseGpxToPoints(gpxText: string): GpxPoint[] {
  const xml = new DOMParser().parseFromString(gpxText, 'application/xml');
  const geo = toGeoJSON(xml as unknown as Document);

  const lineFeature = geo.features.find((f) => f.geometry?.type === 'LineString');
  if (!lineFeature || lineFeature.geometry.type !== 'LineString') return [];

  const coords = lineFeature.geometry.coordinates;
  const points: GpxPoint[] = [];

  let distance = 0;
  for (let i = 0; i < coords.length; i++) {
    const [lng, lat, ele] = coords[i] as [number, number, number?];
    if (i > 0) {
      const prev = points[i - 1];
      distance += haversineKm(prev, { lat, lng });
    }
    points.push({ lat, lng, ele, distanceKm: distance });
  }

  return points;
}
