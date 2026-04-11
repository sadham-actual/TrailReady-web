'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L, { LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trail, STATUS_LABELS, Status } from '@/types';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Fix for default marker icons in React Leaflet
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

interface MapViewProps {
  trails: Trail[];
  selectedTrailId?: string | null;
  onTrailSelect?: (trailId: string | null) => void;
  onBoundsChange?: (bounds: LatLngBounds) => void;
}

// Component to handle map bounds updates
function BoundsHandler({ onBoundsChange }: { onBoundsChange?: (bounds: LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        onBoundsChange(map.getBounds());
      }
    },
  });

  useEffect(() => {
    // Initial bounds
    if (onBoundsChange) {
      onBoundsChange(map.getBounds());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// Component to handle selected trail centering
function CenterOnTrail({ trail }: { trail: Trail | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (trail && trail.latitude && trail.longitude) {
      map.setView([trail.latitude, trail.longitude], 12, { animate: true });
    }
  }, [trail, map]);

  return null;
}

export default function MapView({
  trails,
  selectedTrailId,
  onTrailSelect,
  onBoundsChange,
}: MapViewProps) {
  const selectedTrail = trails.find((t) => t.id === selectedTrailId);

  // Default center (US - adjust to your primary region)
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  // Create custom markers based on trail status with outdoor-inspired design
  function getMarkerIcon(status?: string, isSelected?: boolean): L.DivIcon {
    const color = status === 'clear' ? '#5FA777'
                : status === 'rough' ? '#C67B4E'
                : status === 'impassable' ? '#D64545'
                : '#8B7E6A';

    const scale = isSelected ? 1.3 : 1;
    const zIndex = isSelected ? 1000 : 500;

    const markerHtml = `
      <div style="
        position: relative;
        width: ${28 * scale}px;
        height: ${28 * scale}px;
        transform: translate(-50%, -50%);
        z-index: ${zIndex};
      ">
        <div style="
          background: ${color};
          width: ${24 * scale}px;
          height: ${24 * scale}px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: ${isSelected ? 3 : 2}px solid white;
          box-shadow: 0 ${isSelected ? 6 : 3}px ${isSelected ? 12 : 8}px rgba(0,0,0,0.3);
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%) rotate(-45deg);
        "></div>
        ${isSelected ? `
          <div style="
            position: absolute;
            width: ${32 * scale}px;
            height: ${32 * scale}px;
            border-radius: 50%;
            border: 2px solid ${color};
            top: -4px;
            left: 50%;
            transform: translateX(-50%);
            animation: pulse 2s infinite;
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.5; transform: translateX(-50%) scale(1.2); }
          100% { opacity: 0; transform: translateX(-50%) scale(1.4); }
        }
      </style>
    `;

    return L.divIcon({
      html: markerHtml,
      iconSize: [28 * scale, 28 * scale],
      iconAnchor: [14 * scale, 28 * scale],
      popupAnchor: [0, -28 * scale],
      className: 'custom-trail-marker',
    });
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="w-full h-full z-0"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      {/* Outdoor-themed map tiles */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <BoundsHandler onBoundsChange={onBoundsChange} />
      <CenterOnTrail trail={selectedTrail} />

      {trails
        .filter((trail) => trail.latitude && trail.longitude)
        .map((trail) => {
          const isSelected = selectedTrailId === trail.id;
          return (
            <Marker
              key={trail.id}
              position={[trail.latitude!, trail.longitude!]}
              icon={getMarkerIcon(trail.latestStatus, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onTrailSelect) {
                    onTrailSelect(trail.id);
                  }
                },
              }}
            >
              <Popup className="trail-popup">
                <div className="p-2 min-w-[200px]" style={{ fontFamily: 'var(--font-body)' }}>
                  <h3 className="font-bold text-base mb-1 text-[#2D5A3D]" style={{ fontFamily: 'var(--font-display)' }}>
                    {trail.name}
                  </h3>
                  <p className="text-sm text-[#5C4B3A] mb-3">{trail.region}</p>
                  {trail.latestStatus && (
                    <Badge
                      className={`text-xs mb-3 ${
                        trail.latestStatus === 'clear' ? 'bg-[#5FA777] hover:bg-[#5FA777]' :
                        trail.latestStatus === 'rough' ? 'bg-[#C67B4E] hover:bg-[#C67B4E]' :
                        'bg-[#D64545] hover:bg-[#D64545]'
                      } text-white`}
                    >
                      {STATUS_LABELS[trail.latestStatus as Status]}
                    </Badge>
                  )}
                  <Link
                    href={`/trails/${trail.id}`}
                    className="inline-flex items-center text-sm font-medium text-[#2D5A3D] hover:text-[#3D6B4D] transition-colors"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    View Details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
