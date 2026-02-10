'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trail, VehicleType, Status } from '@/types';
import { TrailWithScore } from './page';

interface MapWithMarkersProps {
  trails: TrailWithScore[];
  selectedVehicle: VehicleType | null;
  onMarkerClick: (trail: Trail) => void;
  userLocation: [number, number] | null;
}

// Component to handle centering on user location
function UserLocationHandler({
  userLocation,
}: {
  userLocation: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.flyTo(userLocation, 10, { duration: 1.5 });
    }
  }, [map, userLocation]);

  return null;
}

// Create custom SVG marker icon based on status and match score
function createMarkerIcon(
  status: Status | undefined,
  matchScore: number
): L.DivIcon {
  // Status-based colors
  const colors = {
    clear: { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.5)' },
    rough: { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)' },
    impassable: { fill: '#f43f5e', glow: 'rgba(244, 63, 94, 0.5)' },
    unknown: { fill: '#64748b', glow: 'rgba(100, 116, 139, 0.3)' },
  };

  const statusKey = status || 'unknown';
  const { fill, glow } = colors[statusKey];

  // Scale marker size based on match score (0.8 - 1.3 range)
  const baseSize = 28;
  const scale = 0.8 + matchScore * 0.5;
  const size = Math.round(baseSize * scale);
  const innerSize = Math.round(size * 0.7);

  // Create SVG marker with glow effect
  const svg = `
    <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-${statusKey}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id="grad-${statusKey}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${fill};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${fill};stop-opacity:0.7" />
        </linearGradient>
      </defs>

      <!-- Main pin shape -->
      <g filter="url(#glow-${statusKey})">
        <path
          d="M${size / 2} ${size + 4}
             C${size / 2} ${size + 4} ${size * 0.15} ${size * 0.6} ${size * 0.15} ${size * 0.4}
             C${size * 0.15} ${size * 0.15} ${size * 0.3} 0 ${size / 2} 0
             C${size * 0.7} 0 ${size * 0.85} ${size * 0.15} ${size * 0.85} ${size * 0.4}
             C${size * 0.85} ${size * 0.6} ${size / 2} ${size + 4} ${size / 2} ${size + 4}Z"
          fill="url(#grad-${statusKey})"
          stroke="#0f172a"
          stroke-width="1.5"
        />

        <!-- Inner circle -->
        <circle
          cx="${size / 2}"
          cy="${size * 0.38}"
          r="${innerSize * 0.28}"
          fill="#0f172a"
          stroke="${fill}"
          stroke-width="1"
        />
      </g>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'custom-trail-marker',
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
}

// Custom CSS for markers (to disable default Leaflet icon styles)
const markerStyles = `
  .custom-trail-marker {
    background: transparent !important;
    border: none !important;
  }

  .leaflet-container {
    background: #0f172a;
    font-family: inherit;
  }

  .leaflet-control-zoom {
    border: none !important;
    box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5) !important;
  }

  .leaflet-control-zoom a {
    background: rgba(15, 23, 42, 0.9) !important;
    color: #94a3b8 !important;
    border: 1px solid rgba(71, 85, 105, 0.5) !important;
    backdrop-filter: blur(12px);
  }

  .leaflet-control-zoom a:hover {
    background: rgba(30, 41, 59, 0.95) !important;
    color: #e2e8f0 !important;
  }

  .leaflet-control-zoom-in {
    border-radius: 12px 12px 0 0 !important;
  }

  .leaflet-control-zoom-out {
    border-radius: 0 0 12px 12px !important;
  }

  .leaflet-control-attribution {
    background: rgba(15, 23, 42, 0.8) !important;
    color: #64748b !important;
    backdrop-filter: blur(8px);
    padding: 2px 8px !important;
    border-radius: 4px 0 0 0;
  }

  .leaflet-control-attribution a {
    color: #94a3b8 !important;
  }

  .user-location-marker {
    animation: pulse-location 2s ease-in-out infinite;
  }

  @keyframes pulse-location {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
  }
`;

export default function MapWithMarkers({
  trails,
  selectedVehicle,
  onMarkerClick,
  userLocation,
}: MapWithMarkersProps) {
  // Default center (continental US)
  const defaultCenter: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 5;

  // Memoize marker icons to prevent unnecessary re-renders
  const markerIcons = useMemo(() => {
    const icons = new Map<string, L.DivIcon>();
    trails.forEach((trail) => {
      const key = `${trail.id}-${trail.latestStatus}-${trail.matchScore}`;
      icons.set(key, createMarkerIcon(trail.latestStatus, trail.matchScore));
    });
    return icons;
  }, [trails]);

  // Inject custom styles
  useEffect(() => {
    const styleId = 'leaflet-dark-theme';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = markerStyles;
      document.head.appendChild(style);
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="w-full h-full"
      zoomControl={true}
      scrollWheelZoom={true}
    >
      {/* CartoDB Dark Matter - High-end dark tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />

      {/* Handle user location changes */}
      <UserLocationHandler userLocation={userLocation} />

      {/* User location marker */}
      {userLocation && (
        <>
          {/* Outer pulse ring */}
          <CircleMarker
            center={userLocation}
            radius={20}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.15,
              weight: 1,
              opacity: 0.5,
            }}
            className="user-location-marker"
          />
          {/* Inner solid dot */}
          <CircleMarker
            center={userLocation}
            radius={8}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#10b981',
              fillOpacity: 1,
              weight: 2,
            }}
          />
        </>
      )}

      {/* Trail markers */}
      {trails
        .filter((trail) => trail.latitude && trail.longitude)
        .map((trail) => {
          const key = `${trail.id}-${trail.latestStatus}-${trail.matchScore}`;
          const icon = markerIcons.get(key) || createMarkerIcon(trail.latestStatus, trail.matchScore);

          return (
            <Marker
              key={trail.id}
              position={[trail.latitude, trail.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick(trail),
              }}
            />
          );
        })}
    </MapContainer>
  );
}
