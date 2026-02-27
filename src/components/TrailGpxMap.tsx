'use client';

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GpxPoint } from '@/lib/gpx';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
  iconUrl: icon.src,
  iconRetinaUrl: iconRetina.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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
