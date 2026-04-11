'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GpxPoint } from '@/lib/gpx';

const DEFAULT_MARKER_ICON = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const DEFAULT_MARKER_ICON_2X = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const DEFAULT_MARKER_SHADOW = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconUrl: DEFAULT_MARKER_ICON,
    iconRetinaUrl: DEFAULT_MARKER_ICON_2X,
    shadowUrl: DEFAULT_MARKER_SHADOW,
  });
}

export function TrailGpxMap({ points }: { points: GpxPoint[] }) {
  if (points.length === 0) return null;

  const center: [number, number] = [points[0].lat, points[0].lng];
  const polyline: [number, number][] = points.map((p) => [p.lat, p.lng]);
  const last = points[points.length - 1];

  return (
    <div className="h-80 border border-stone-800 overflow-hidden">
      <MapContainer center={center} zoom={12} className="w-full h-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polyline positions={polyline} pathOptions={{ color: '#f97316', weight: 4 }} />

        <Marker position={center}>
          <Popup>Trail start</Popup>
        </Marker>
        <Marker position={[last.lat, last.lng]}>
          <Popup>Trail end</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
