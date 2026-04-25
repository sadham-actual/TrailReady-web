'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { Crosshair, Navigation, ExternalLink, Loader2, LocateFixed, LocateOff } from 'lucide-react';
import { Trail, LatLng, VEHICLE_CATEGORIES, ConditionReport } from '@/types';
import { useVehicle } from '@/contexts/VehicleContext';
import { trailService } from '@/services/trailService';
import { getVehicleOutcomeWithFallback, VehicleOutcome, OutcomeStatus } from '@/lib/trailOutcome';
import { calculateGlobalStatus } from '@/lib/intel-utils';
import { getPathLengthKm } from '@/lib/trailPaths';

// Extended trail with baseDifficulty and reports
interface TrailWithData extends Trail {
  baseDifficulty?: number;
  reports?: ConditionReport[];
  pathCoordinates?: LatLng[];
}

// Path styling configuration
type PathStyle = {
  color: string;
  weight: number;
  opacity: number;
  dashArray?: string;
  className: string;
  glowColor?: string;
  label: string;
};

const PATH_STYLES: Record<OutcomeStatus | 'passable', PathStyle> = {
  passable: {
    color: '#16A34A',
    weight: 3,
    opacity: 0.7,
    className: 'path-clear',
    label: 'Clear',
  },
  'high-risk': {
    color: '#FF6B00',
    weight: 5,
    opacity: 0.6,
    dashArray: '12, 8',
    className: 'path-caution',
    label: 'Caution',
  },
  impassable: {
    color: '#DC2626',
    weight: 5,
    opacity: 0.6,
    className: 'path-impassable',
    glowColor: 'rgba(220, 38, 38, 0.4)',
    label: 'Blocked',
  },
  baseline: {
    color: '#78716C',
    weight: 3,
    opacity: 0.5,
    dashArray: '4, 6',
    className: 'path-baseline',
    label: 'Baseline',
  },
  unknown: {
    color: '#78716C',
    weight: 3,
    opacity: 0.5,
    dashArray: '4, 6',
    className: 'path-unknown',
    label: 'Unknown',
  },
};

type LiveTrailStatus = 'CLEAR' | 'CHALLENGING' | 'NOT PASSABLE' | 'UNKNOWN';

function getDifficultyLabel(baseDifficulty?: number): string {
  if (baseDifficulty === 1) return 'EASY';
  if (baseDifficulty === 2) return 'MODERATE';
  if (baseDifficulty === 3) return 'DIFFICULT';
  if (baseDifficulty === 4) return 'EXTREME';
  return 'UNRATED';
}

function getLiveTrailStatus(trail: TrailWithData, reports: ConditionReport[]): LiveTrailStatus {
  if (reports.length > 0) {
    const global = calculateGlobalStatus(reports);
    if (global.status === 'PASSABLE') return 'CLEAR';
    if (global.status === 'CHALLENGING') return 'CHALLENGING';
    if (global.status === 'NOT PASSABLE') return 'NOT PASSABLE';
  }

  if (trail.latestStatus === 'clear') return 'CLEAR';
  if (trail.latestStatus === 'rough') return 'CHALLENGING';
  if (trail.latestStatus === 'impassable') return 'NOT PASSABLE';
  return 'UNKNOWN';
}

// Create small label marker icon
function createLabelMarkerIcon(trailName: string, outcome: VehicleOutcome): L.DivIcon {
  const style = PATH_STYLES[outcome.status] || PATH_STYLES.unknown;

  return L.divIcon({
    html: `
      <div class="label-marker" style="--marker-color: ${style.color}">
        <div class="label-dot"></div>
        <div class="label-text">${trailName}</div>
      </div>
    `,
    iconSize: [120, 24],
    iconAnchor: [60, 12],
    popupAnchor: [0, -12],
    className: 'custom-label-marker',
  });
}

// Coordinate Display Component
function CoordinateReadout({ lat, lng }: { lat: number; lng: number }) {
  const formatCoord = (val: number, isLat: boolean) => {
    const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    return `${Math.abs(val).toFixed(5)}° ${dir}`;
  };

  return (
    <div className="absolute bottom-4 left-4 z-[1000] font-mono text-[10px] tracking-wider">
      <div className="plate-floating px-3 py-2 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-muted-stone uppercase">Lat</span>
          <span className="text-deep-stone font-bold tabular-nums">{formatCoord(lat, true)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-stone uppercase">Lng</span>
          <span className="text-deep-stone font-bold tabular-nums">{formatCoord(lng, false)}</span>
        </div>
      </div>
    </div>
  );
}

// Viewfinder Corners Component
function ViewfinderOverlay() {
  const cornerSize = 40;
  const cornerThickness = 3;
  const cornerColor = 'var(--color-action-orange)';

  return (
    <div className="absolute inset-0 pointer-events-none z-[999]">
      {(['tl', 'tr', 'bl', 'br'] as const).map((position) => {
        const isTop = position.startsWith('t');
        const isLeft = position.endsWith('l');

        return (
          <div
            key={position}
            className="absolute pointer-events-none"
            style={{
              top: isTop ? 16 : 'auto',
              bottom: !isTop ? 16 : 'auto',
              left: isLeft ? 16 : 'auto',
              right: !isLeft ? 16 : 'auto',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: cornerSize,
                height: cornerThickness,
                backgroundColor: cornerColor,
                top: isTop ? 0 : 'auto',
                bottom: !isTop ? 0 : 'auto',
                left: isLeft ? 0 : 'auto',
                right: !isLeft ? 0 : 'auto',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: cornerThickness,
                height: cornerSize,
                backgroundColor: cornerColor,
                top: isTop ? 0 : 'auto',
                bottom: !isTop ? 0 : 'auto',
                left: isLeft ? 0 : 'auto',
                right: !isLeft ? 0 : 'auto',
              }}
            />
          </div>
        );
      })}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Crosshair className="w-8 h-8 text-action-orange opacity-40" strokeWidth={1} />
      </div>
    </div>
  );
}

// Map event handler for coordinates
function MapEventHandler({ onCoordsChange }: { onCoordsChange: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    mousemove: (e) => {
      onCoordsChange(e.latlng.lat, e.latlng.lng);
    },
    move: () => {
      const center = map.getCenter();
      onCoordsChange(center.lat, center.lng);
    },
  });

  useEffect(() => {
    const center = map.getCenter();
    onCoordsChange(center.lat, center.lng);
  }, [map, onCoordsChange]);

  return null;
}

// Field Intel Popup Content
function FieldIntelPopup({
  trail,
  outcome,
  liveStatus,
  vehicleName,
  pathLength,
}: {
  trail: TrailWithData;
  outcome: VehicleOutcome;
  liveStatus: LiveTrailStatus;
  vehicleName: string | null;
  pathLength: number;
}) {
  const liveStatusClasses: Record<LiveTrailStatus, string> = {
    CLEAR: 'border-emerald-600 bg-emerald-50 text-emerald-700',
    CHALLENGING: 'border-amber-600 bg-amber-50 text-amber-700',
    'NOT PASSABLE': 'border-rose-600 bg-rose-50 text-rose-700',
    UNKNOWN: 'border-stone-400 bg-stone-100 text-stone-700',
  };

  return (
    <div className="min-w-[240px] p-1">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="font-bold text-base text-deep-stone leading-tight">
            {trail.name}
          </h3>
          <p className="text-xs text-muted-stone mt-0.5">{trail.region}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${liveStatusClasses[liveStatus]}`}
        >
          <span className="text-[11px] leading-none">●</span>
          {liveStatus}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-[10px] font-mono uppercase tracking-wider">
        <div className="bg-stone-light p-2 rounded-sm">
          <span className="text-muted-stone">Diff</span>
          <p className="text-deep-stone font-bold text-sm mt-0.5">
            {getDifficultyLabel(trail.baseDifficulty)}
          </p>
        </div>
        <div className="bg-stone-light p-2 rounded-sm">
          <span className="text-muted-stone">Length</span>
          <p className="text-deep-stone font-bold text-sm mt-0.5">
            {pathLength}km
          </p>
        </div>
        <div className="bg-stone-light p-2 rounded-sm">
          <span className="text-muted-stone">Vehicle</span>
          <p className="text-deep-stone font-bold text-sm mt-0.5 truncate">
            {vehicleName || '—'}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-stone mb-3 leading-relaxed">
        {outcome.explanation}
      </p>

      <Link
        href={`/trails/${trail.id}`}
        onClick={(event) => event.stopPropagation()}
        className="btn-industrial-primary w-full text-center text-xs"
      >
        <Navigation className="w-3.5 h-3.5" />
        View Full Specs
        <ExternalLink className="w-3 h-3 opacity-60" />
      </Link>
    </div>
  );
}

// Legend Component with path styles
function MapLegend() {
  const [open, setOpen] = useState(false);
  const items = [
    { status: 'passable' as const, label: 'Clear', description: 'Passable' },
    { status: 'high-risk' as const, label: 'Caution', description: 'Challenging' },
    { status: 'impassable' as const, label: 'Blocked', description: 'Not Passable' },
    { status: 'unknown' as const, label: 'Unknown', description: 'No Data' },
  ];

  const difficultyItems = [
    { level: 1, label: 'Easy', color: 'text-emerald-600' },
    { level: 2, label: 'Moderate', color: 'text-amber-500' },
    { level: 3, label: 'Difficult', color: 'text-amber-600' },
    { level: 4, label: 'Extreme', color: 'text-rose-600' },
  ];

  return (
    <div className="absolute top-4 right-4 z-[1002]">
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="sm:hidden mb-1 ml-auto flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100/90 border border-stone-800 rounded-sm shadow-[2px_2px_0_0_var(--color-stone-800)] font-mono text-[9px] uppercase tracking-wider text-stone-800 font-bold"
        aria-label="Toggle map legend"
      >
        Legend {open ? '▲' : '▼'}
      </button>
      <div className={`${open ? 'block' : 'hidden'} sm:block bg-stone-100/90 border border-stone-800 px-3 py-2.5 rounded-sm shadow-[2px_2px_0_0_var(--color-stone-800)]`}>
        {/* Trail Status Section */}
        <p className="text-[9px] font-mono uppercase tracking-wider text-stone-800 font-bold mb-2">
          Trail Status
        </p>
        <div className="space-y-1.5 mb-3">
          {items.map(({ status, label, description }) => {
            const style = PATH_STYLES[status];
            return (
              <div key={status} className="flex items-center gap-2">
                <div className="w-8 h-1 rounded-full relative" style={{ opacity: style.opacity }}>
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: style.color,
                      height: status === 'impassable' || status === 'high-risk' ? 4 : 2,
                      top: status === 'impassable' || status === 'high-risk' ? -1 : 0,
                    }}
                  />
                  {style.dashArray && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundImage: `repeating-linear-gradient(90deg, ${style.color} 0, ${style.color} 4px, transparent 4px, transparent 8px)`,
                        height: status === 'high-risk' ? 4 : 2,
                        top: status === 'high-risk' ? -1 : 0,
                      }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-mono font-medium text-stone-800">
                  {label} <span className="text-stone-500">({description})</span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-stone-300 my-2" />

        {/* Difficulty Section */}
        <p className="text-[9px] font-mono uppercase tracking-wider text-stone-800 font-bold mb-2">
          Difficulty Rating
        </p>
        <div className="space-y-1.5">
          {difficultyItems.map(({ level, label, color }) => (
            <div key={level} className="flex items-center gap-2">
              <div className={`text-[10px] font-mono font-bold ${color} w-6`}>
                D{level}
              </div>
              <span className="text-[10px] font-mono font-medium text-stone-800">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Trail Path Component (renders both polyline and label marker)
function TrailPath({
  trail,
  outcome,
  liveStatus,
  vehicleName,
  isHovered,
  onHover,
  onLeave,
}: {
  trail: TrailWithData & { pathCoordinates: LatLng[] };
  outcome: VehicleOutcome;
  liveStatus: LiveTrailStatus;
  vehicleName: string | null;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const style = PATH_STYLES[outcome.status] || PATH_STYLES.unknown;
  const hasRealPath = trail.pathCoordinates.length >= 2;
  const markerPosition: LatLng = [trail.latitude, trail.longitude];
  const pathLength = hasRealPath ? getPathLengthKm(trail.pathCoordinates) : 0;

  // Enhanced styles when hovered
  const hoverWeight = isHovered ? style.weight + 2 : style.weight;
  const hoverOpacity = isHovered ? Math.min(style.opacity + 0.2, 0.9) : style.opacity;

  return (
    <>
      {/* Glow layer for impassable trails — only with real GPS path */}
      {hasRealPath && style.glowColor && (
        <Polyline
          positions={trail.pathCoordinates}
          pathOptions={{
            color: style.glowColor,
            weight: hoverWeight + 6,
            opacity: isHovered ? 0.5 : 0.3,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {/* Main path polyline — only with real GPS path */}
      {hasRealPath && (
        <Polyline
          positions={trail.pathCoordinates}
          pathOptions={{
            color: style.color,
            weight: hoverWeight,
            opacity: hoverOpacity,
            dashArray: style.dashArray,
            lineCap: 'round',
            lineJoin: 'round',
          }}
          eventHandlers={{
            mouseover: onHover,
            mouseout: onLeave,
          }}
        >
          <Popup className="discovery-map-popup" maxWidth={280}>
            <FieldIntelPopup
              trail={trail}
              outcome={outcome}
              liveStatus={liveStatus}
              vehicleName={vehicleName}
              pathLength={pathLength}
            />
          </Popup>
        </Polyline>
      )}

      {/* Label marker at trail center */}
      <Marker
        position={markerPosition}
        icon={createLabelMarkerIcon(trail.name, outcome)}
        eventHandlers={{
          mouseover: onHover,
          mouseout: onLeave,
        }}
      >
        <Popup className="discovery-map-popup" maxWidth={280}>
          <FieldIntelPopup
            trail={trail}
            outcome={outcome}
            liveStatus={liveStatus}
            vehicleName={vehicleName}
            pathLength={pathLength}
          />
        </Popup>
      </Marker>
    </>
  );
}

// Barnwell Mountain Recreation Area — demo default
// TODO(production): replace with user region preference from profile
const DEMO_CENTER: [number, number] = [32.80, -94.87];
const DEMO_ZOOM = 13;

type GpsMode = 'off' | 'active' | 'following' | 'error';

// Watches the user's GPS position continuously when active.
// Preserves the one-shot locate=true fly-to for the existing URL param flow.
function UserLocationTracker({
  locate,
  gpsMode,
  onLocationUpdate,
  onError,
}: {
  locate: boolean;
  gpsMode: GpsMode;
  onLocationUpdate: (coords: GeolocationCoordinates) => void;
  onError: () => void;
}) {
  const map = useMap();
  const isActive = gpsMode === 'active' || gpsMode === 'following';
  const isFollowing = gpsMode === 'following';

  // One-shot fly-to on mount when locate=true (existing ?locate=true URL param behavior)
  useEffect(() => {
    if (!locate || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 13, { duration: 1.5 });
      },
      () => {}
    );
  }, [locate, map]);

  // Continuous watch when GPS button is active
  useEffect(() => {
    if (!isActive || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onLocationUpdate(pos.coords);
        if (isFollowing) {
          map.panTo([pos.coords.latitude, pos.coords.longitude]);
        }
      },
      onError,
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isActive, isFollowing, map, onLocationUpdate, onError]);

  return null;
}

// Pulsing blue dot + accuracy radius shown at the user's current position.
function UserLocationMarker({ coords }: { coords: GeolocationCoordinates }) {
  const userIcon = useMemo(
    () =>
      L.divIcon({
        html: '<div class="user-dot"><div class="user-dot-inner"></div></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: 'user-location-marker',
      }),
    []
  );

  return (
    <>
      <Circle
        center={[coords.latitude, coords.longitude]}
        radius={coords.accuracy}
        pathOptions={{
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.08,
          weight: 1,
          opacity: 0.35,
        }}
      />
      <Marker
        position={[coords.latitude, coords.longitude]}
        icon={userIcon}
        interactive={false}
        zIndexOffset={1000}
      />
    </>
  );
}

// FlyTo component - auto-centers on a specific trail
function FlyToTrail({ trailId, trails }: { trailId: string | null; trails: TrailWithData[] }) {
  const map = useMap();

  useEffect(() => {
    if (!trailId) return;

    const trail = trails.find(t => t.id === trailId);
    if (trail && trail.latitude && trail.longitude) {
      // Fly to trail with animation
      map.flyTo([trail.latitude, trail.longitude], 13, {
        duration: 1.5,
      });
    }
  }, [trailId, trails, map]);

  return null;
}

type FilterMode = 'featured' | 'all';
const DIFFICULTY_LEVELS = [1, 2, 3, 4] as const;
const DIFFICULTY_LABELS: Record<number, string> = { 1: 'Easy', 2: 'Moderate', 3: 'Difficult', 4: 'Extreme' };

// Main DiscoveryMap Component
export function DiscoveryMap({
  focusTrailId,
  searchQuery,
  onFilteredTrailsChange,
  locate = false,
}: {
  focusTrailId?: string | null;
  searchQuery?: string | null;
  onFilteredTrailsChange?: (trails: Trail[]) => void;
  locate?: boolean;
}) {
  const { selectedVehicle } = useVehicle();
  const [trails, setTrails] = useState<TrailWithData[]>([]);
  const [trailReports, setTrailReports] = useState<Record<string, ConditionReport[]>>({});
  const [geoSegmentPaths, setGeoSegmentPaths] = useState<Map<string, LatLng[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [coords, setCoords] = useState({ lat: 39.8283, lng: -98.5795 });
  const [hoveredTrailId, setHoveredTrailId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('featured');
  const [activeDifficulties, setActiveDifficulties] = useState<Set<number>>(new Set([1, 2, 3, 4]));
  const [userLocation, setUserLocation] = useState<GeolocationCoordinates | null>(null);
  const [gpsMode, setGpsMode] = useState<GpsMode>('off');

  const currentCategory = VEHICLE_CATEGORIES.find(
    (cat) => cat.mappedType === selectedVehicle
  );

  const normalizedQuery = useMemo(() => {
    return searchQuery?.trim().toLowerCase() ?? '';
  }, [searchQuery]);

  const filteredTrails = useMemo(() => {
    let result = trails;

    if (normalizedQuery) {
      result = result.filter((trail) => {
        const haystack = [trail.name, trail.region, trail.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }

    // Difficulty filter — only apply when not all levels are selected
    if (activeDifficulties.size < 4) {
      result = result.filter((trail) => {
        const d = (trail as TrailWithData & { baseDifficulty?: number }).baseDifficulty;
        if (!d) return true; // always show trails without difficulty set
        return activeDifficulties.has(d);
      });
    }

    return result;
  }, [trails, normalizedQuery, activeDifficulties]);

  useEffect(() => {
    onFilteredTrailsChange?.(filteredTrails as Trail[]);
  }, [filteredTrails, onFilteredTrailsChange]);

  // Fetch trails, their reports, and real segment geometry
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [trailData, segmentsRes] = await Promise.all([
          trailService.getTrails(undefined, undefined, filterMode === 'featured'),
          fetch('/api/geo/segments').then((r) => r.json()).catch(() => null),
        ]);

        // Build trailId → LatLng[] map from real segment geometry
        if (segmentsRes?.success && Array.isArray(segmentsRes.data)) {
          const pathMap = new Map<string, LatLng[]>();
          for (const seg of segmentsRes.data) {
            if (seg.trailId && Array.isArray(seg.coords) && seg.coords.length >= 2) {
              pathMap.set(seg.trailId, seg.coords);
            }
          }
          setGeoSegmentPaths(pathMap);
        }

        setTrails(trailData as TrailWithData[]);

        const reportPromises = trailData.map((trail) =>
          trailService.getConditionReports(trail.id).then((reports) => ({
            trailId: trail.id,
            reports,
          }))
        );

        const reportResults = await Promise.all(reportPromises);
        const reportsMap: Record<string, ConditionReport[]> = {};
        reportResults.forEach(({ trailId, reports }) => {
          reportsMap[trailId] = reports;
        });
        setTrailReports(reportsMap);
      } catch (error) {
        console.error('Failed to fetch trail data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [filterMode]);

  // Calculate outcome for a trail
  const getTrailOutcome = useCallback(
    (trail: TrailWithData): VehicleOutcome => {
      if (!selectedVehicle) {
        return {
          status: 'unknown',
          confidence: 'low',
          explanation: 'Select a vehicle to see personalized verdicts',
        };
      }

      const reports = trailReports[trail.id] || [];
      return getVehicleOutcomeWithFallback(reports, selectedVehicle, trail.baseDifficulty);
    },
    [selectedVehicle, trailReports]
  );

  const handleCoordsChange = useCallback((lat: number, lng: number) => {
    setCoords({ lat, lng });
  }, []);

  const handleGpsToggle = useCallback(() => {
    setGpsMode((prev) => {
      if (prev === 'off' || prev === 'error') return 'active';
      if (prev === 'active') return 'following';
      return 'off';
    });
  }, []);

  const handleLocationUpdate = useCallback((coords: GeolocationCoordinates) => {
    setUserLocation(coords);
  }, []);

  const handleGpsError = useCallback(() => {
    setGpsMode('error');
    setUserLocation(null);
  }, []);

  useEffect(() => {
    if (gpsMode === 'off') setUserLocation(null);
  }, [gpsMode]);

  // Default to Barnwell for the demo.
  // FlyToUserLocation will override this if locate=true and permission granted.
  const defaultCenter = DEMO_CENTER;
  const defaultZoom = DEMO_ZOOM;

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-stone-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-action-orange animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">
            Loading Trail Intel...
          </p>
        </div>
        <ViewfinderOverlay />
      </div>
    );
  }

  // Merge real segment geometry into trails — no fake path generation
  const trailsWithPaths = filteredTrails
    .filter((trail) => trail.latitude && trail.longitude)
    .map((trail) => {
      const realPath = geoSegmentPaths.get(trail.id);
      const pathCoordinates: LatLng[] =
        realPath && realPath.length >= 2
          ? realPath
          : [[trail.latitude, trail.longitude] as LatLng];
      return { ...trail, pathCoordinates };
    });

  return (
    <div className="relative w-full h-full bg-bone touch-none">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="w-full h-full z-0"
        zoomControl={false}
        scrollWheelZoom={true}
        style={{ touchAction: 'none' }}
      >
        {/* Topographic-style tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.opentopomap.org">OpenTopoMap</a>'
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          maxZoom={17}
        />

        <MapEventHandler onCoordsChange={handleCoordsChange} />
        <UserLocationTracker
          locate={locate}
          gpsMode={gpsMode}
          onLocationUpdate={handleLocationUpdate}
          onError={handleGpsError}
        />
        <FlyToTrail trailId={focusTrailId || null} trails={trails} />
        {userLocation && <UserLocationMarker coords={userLocation} />}

        {/* Trail Paths with Red-Zoning */}
        {trailsWithPaths.map((trail) => {
          const outcome = getTrailOutcome(trail);
          const reports = trailReports[trail.id] || [];
          const liveStatus = getLiveTrailStatus(trail, reports);
          const isHovered = hoveredTrailId === trail.id;

          return (
            <TrailPath
              key={trail.id}
              trail={trail}
              outcome={outcome}
              liveStatus={liveStatus}
              vehicleName={currentCategory?.shortName || null}
              isHovered={isHovered}
              onHover={() => setHoveredTrailId(trail.id)}
              onLeave={() => setHoveredTrailId(null)}
            />
          );
        })}
      </MapContainer>

      {/* Hardware UI Overlays */}
      <ViewfinderOverlay />
      <CoordinateReadout lat={coords.lat} lng={coords.lng} />
      <MapLegend />

      {/* Filter Bar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 flex-wrap justify-center">
        {/* Layer toggle */}
        <div className="flex bg-stone-100/95 border border-stone-800 shadow-[2px_2px_0_0_var(--color-stone-800)] rounded-sm overflow-hidden">
          {(['featured', 'all'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider transition-colors ${
                filterMode === mode
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200'
              }`}
            >
              {mode === 'featured' ? 'Featured' : 'All Trails'}
            </button>
          ))}
        </div>

        {/* Difficulty chips */}
        <div className="flex gap-1">
          {DIFFICULTY_LEVELS.map((d) => {
            const active = activeDifficulties.has(d);
            const colors: Record<number, string> = {
              1: active ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-stone-100/95 text-stone-500 border-stone-400',
              2: active ? 'bg-amber-500 text-white border-amber-600' : 'bg-stone-100/95 text-stone-500 border-stone-400',
              3: active ? 'bg-orange-500 text-white border-orange-600' : 'bg-stone-100/95 text-stone-500 border-stone-400',
              4: active ? 'bg-rose-600 text-white border-rose-700' : 'bg-stone-100/95 text-stone-500 border-stone-400',
            };
            return (
              <button
                key={d}
                type="button"
                title={DIFFICULTY_LABELS[d]}
                onClick={() => {
                  setActiveDifficulties((prev) => {
                    const next = new Set(prev);
                    if (next.has(d)) {
                      if (next.size > 1) next.delete(d);
                    } else {
                      next.add(d);
                    }
                    return next;
                  });
                }}
                className={`w-8 h-7 border font-mono text-[9px] font-bold rounded-sm shadow-[1px_1px_0_0_rgba(0,0,0,0.3)] transition-colors ${colors[d]}`}
              >
                D{d}
              </button>
            );
          })}
        </div>

        {/* GPS button — lives in the filter bar so it's always visible above iOS Safari chrome */}
        <button
          type="button"
          onClick={handleGpsToggle}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 border font-mono text-[9px] uppercase tracking-wider rounded-sm shadow-[1px_1px_0_0_rgba(0,0,0,0.3)] transition-all ${
            gpsMode === 'off'
              ? 'bg-stone-100/95 border-stone-800 text-stone-700 hover:text-blue-600 hover:border-blue-500'
              : gpsMode === 'active'
              ? 'bg-blue-500 border-blue-600 text-white'
              : gpsMode === 'following'
              ? 'bg-blue-700 border-blue-800 text-white'
              : 'bg-red-50 border-red-400 text-red-600'
          }`}
        >
          {gpsMode === 'error' ? (
            <LocateOff className="w-3 h-3" />
          ) : (
            <LocateFixed className={`w-3 h-3 ${gpsMode === 'active' || gpsMode === 'following' ? 'animate-pulse' : ''}`} />
          )}
          <span>
            {gpsMode === 'off' && 'My Location'}
            {gpsMode === 'active' && `GPS On${userLocation ? ` ±${Math.round(userLocation.accuracy)}m` : ''}`}
            {gpsMode === 'following' && 'Following'}
            {gpsMode === 'error' && 'No GPS'}
          </span>
        </button>
      </div>

      {/* Vehicle Indicator */}
      <div className="absolute top-4 left-4 z-[1000]">
        <div className="plate-floating px-3 py-2">
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted-stone mb-1">
            Active Vehicle
          </p>
          <p className="text-sm font-bold text-deep-stone">
            {currentCategory?.shortName || 'Not Selected'}
          </p>
        </div>
      </div>

      {/* Custom styles for paths and popups */}
      <style jsx global>{`
        .discovery-map-popup .leaflet-popup-content-wrapper {
          background: var(--color-surface);
          border: 1px solid var(--color-stone-border);
          border-radius: 4px;
          box-shadow: 4px 4px 0 0 var(--color-stone-border);
          padding: 0;
        }

        .discovery-map-popup .leaflet-popup-content {
          margin: 12px;
        }

        .discovery-map-popup .leaflet-popup-tip-container {
          display: none;
        }

        .discovery-map-popup .leaflet-popup-close-button {
          color: var(--color-muted-stone) !important;
          font-size: 18px !important;
          padding: 6px 8px !important;
        }

        .discovery-map-popup .leaflet-popup-close-button:hover {
          color: var(--color-action-orange) !important;
        }

        /* Label marker styles */
        .custom-label-marker {
          background: transparent !important;
          border: none !important;
        }

        .label-marker {
          display: flex;
          align-items: center;
          gap: 6px;
          pointer-events: auto;
        }

        .label-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--marker-color);
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          flex-shrink: 0;
        }

        .label-text {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-deep-stone);
          background: rgba(255, 255, 255, 0.9);
          padding: 2px 6px;
          border-radius: 2px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          white-space: nowrap;
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Path hover effects */
        .leaflet-interactive:hover {
          cursor: pointer;
        }

        /* OpenTopoMap adjustments for Industrial theme */
        .leaflet-container {
          background: var(--color-stone-light);
          font-family: var(--font-mono);
          touch-action: none;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }

        .leaflet-control-zoom {
          border: 1px solid var(--color-stone-border) !important;
          box-shadow: 2px 2px 0 0 var(--color-stone-border) !important;
        }

        .leaflet-control-zoom a {
          background: var(--color-surface) !important;
          color: var(--color-deep-stone) !important;
          border-color: var(--color-stone-border) !important;
        }

        .leaflet-control-zoom a:hover {
          background: var(--color-stone-light) !important;
        }

        /* Red-Zone glow animation for impassable paths */
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }

        .path-impassable {
          filter: drop-shadow(0 0 8px rgba(220, 38, 38, 0.4));
        }

        /* User GPS location marker */
        .user-location-marker {
          background: transparent !important;
          border: none !important;
        }

        .user-dot {
          width: 20px;
          height: 20px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-dot::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.4);
          animation: user-pulse 2s ease-out infinite;
        }

        .user-dot-inner {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3B82F6;
          border: 2.5px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
          position: relative;
          z-index: 1;
        }

        @keyframes user-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default DiscoveryMap;
