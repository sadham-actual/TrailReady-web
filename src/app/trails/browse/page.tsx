'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Drawer } from 'vaul';
import {
  Crosshair,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Menu,
  Compass,
  Car,
  X,
} from 'lucide-react';
import { trailService } from '@/services/trailService';
import {
  Trail,
  Status,
  VEHICLE_CATEGORIES,
  VehicleType,
} from '@/types';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';

// Trail with computed match score
export interface TrailWithScore extends Trail {
  matchScore: number;
}

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapWithMarkers = dynamic(() => import('./MapWithMarkers'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading map...</p>
      </motion.div>
    </div>
  ),
});

// Status configuration
const STATUS_CONFIG: Record<
  Status | 'unknown',
  {
    label: string;
    verdict: string;
    icon: typeof CheckCircle2;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  clear: {
    label: 'Clear',
    verdict: 'GO',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
  },
  rough: {
    label: 'Rough',
    verdict: 'CAUTION',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
  },
  impassable: {
    label: 'Impassable',
    verdict: 'NO-GO',
    icon: XCircle,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/15',
    borderColor: 'border-rose-500/40',
  },
  unknown: {
    label: 'Unknown',
    verdict: 'NO DATA',
    icon: HelpCircle,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/15',
    borderColor: 'border-slate-500/40',
  },
};

// Calculate match score based on vehicle capability vs trail status
export function calculateMatchScore(
  status: Status | undefined,
  vehicleType: VehicleType | null
): number {
  if (!vehicleType || !status) return 0.5; // Neutral if no data

  const category = VEHICLE_CATEGORIES.find((c) => c.mappedType === vehicleType);
  if (!category) return 0.5;

  const capabilityLevel = category.capabilityLevel;

  switch (status) {
    case 'clear':
      // All vehicles can handle clear trails
      return 1.0;
    case 'rough':
      // Higher capability = better match
      if (capabilityLevel >= 3) return 0.9;
      if (capabilityLevel === 2) return 0.6;
      return 0.3;
    case 'impassable':
      // Only extreme builds might handle it
      if (capabilityLevel === 4) return 0.5;
      if (capabilityLevel === 3) return 0.2;
      return 0;
    default:
      return 0.5;
  }
}

// Format relative time
function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'No reports';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}

export default function BrowseMapPage() {
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [peekOpen, setPeekOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Fetch trails on mount
  useEffect(() => {
    async function loadTrails() {
      try {
        const data = await trailService.getTrails();
        setTrails(data);
      } catch (error) {
        console.error('Failed to load trails:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadTrails();
  }, []);

  // Find current vehicle category for display
  const currentCategory = useMemo(
    () => VEHICLE_CATEGORIES.find((cat) => cat.mappedType === selectedVehicle),
    [selectedVehicle]
  );

  // Calculate match scores for all trails
  const trailsWithScores: TrailWithScore[] = useMemo(() => {
    return trails.map((trail) => ({
      ...trail,
      matchScore: calculateMatchScore(trail.latestStatus, selectedVehicle),
    }));
  }, [trails, selectedVehicle]);

  // Handle marker click
  const handleMarkerClick = useCallback((trail: Trail) => {
    setSelectedTrail(trail);
    setPeekOpen(true);
  }, []);

  // Handle locate me
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Get status config for selected trail
  const selectedStatus = selectedTrail?.latestStatus || 'unknown';
  const statusConfig = STATUS_CONFIG[selectedStatus as keyof typeof STATUS_CONFIG];
  const selectedMatchScore = selectedTrail
    ? calculateMatchScore(selectedTrail.latestStatus, selectedVehicle)
    : 0.5;

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      {/* Full-Screen Map */}
      <div className="absolute inset-0">
        {!isLoading && (
          <MapWithMarkers
            trails={trailsWithScores}
            selectedVehicle={selectedVehicle}
            onMarkerClick={handleMarkerClick}
            userLocation={userLocation}
          />
        )}
      </div>

      {/* HUD Navigation Overlay - Desktop */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden md:flex absolute top-4 left-1/2 -translate-x-1/2 z-[1000]"
      >
        <div className="flex items-center gap-1 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 shadow-2xl shadow-black/30">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-4 py-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <Compass className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              TrailReady
            </span>
          </Link>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-700/50" />

          {/* Nav Links */}
          <div className="px-4 py-2 rounded-full text-sm font-medium text-emerald-400 bg-emerald-500/10">
            Browse
          </div>
          <Link
            href="/trails/search"
            className="px-4 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-slate-50 hover:bg-white/5 transition-colors"
          >
            Search
          </Link>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-700/50" />

          {/* Garage Button */}
          <button
            onClick={() => setVehicleModalOpen(true)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              !selectedVehicle
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {!selectedVehicle && (
              <span
                className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20"
                style={{ animationDuration: '2s' }}
              />
            )}
            <Car className="h-4 w-4 relative" />
            <span className="text-sm font-medium relative">
              {currentCategory?.shortName || 'Set Vehicle'}
            </span>
          </button>
        </div>
      </motion.nav>

      {/* Mobile HUD - Fixed at top */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="md:hidden absolute top-0 left-0 right-0 z-[1000] p-3 safe-top"
      >
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 shadow-2xl shadow-black/30">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 px-2 py-2">
            <Compass className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              TrailReady
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Garage Button */}
            <button
              onClick={() => setVehicleModalOpen(true)}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                !selectedVehicle
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              }`}
            >
              <Car className="h-4 w-4 relative" />
              <span className="text-xs font-medium relative">
                {currentCategory?.shortName || 'Set Rig'}
              </span>
            </button>

            {/* Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Locate Me Button - Bottom Right */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        onClick={handleLocateMe}
        disabled={isLocating}
        className="absolute bottom-24 md:bottom-6 right-4 z-[1000] w-12 h-12 rounded-full bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl shadow-black/30 flex items-center justify-center transition-all hover:bg-slate-800/90 hover:border-emerald-500/30 active:scale-95 disabled:opacity-50"
        aria-label="Locate me"
      >
        {isLocating ? (
          <div className="w-5 h-5 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        ) : (
          <Crosshair
            className={`h-5 w-5 transition-colors ${
              userLocation ? 'text-emerald-400' : 'text-slate-400'
            }`}
          />
        )}
      </motion.button>

      {/* Legend - Desktop Only */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="hidden md:block absolute bottom-6 left-4 z-[1000]"
      >
        <div className="px-4 py-3 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 shadow-2xl shadow-black/30">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Trail Status
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-xs text-slate-300">Clear</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-xs text-slate-300">Rough</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <span className="text-xs text-slate-300">Impassable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="text-xs text-slate-300">No Data</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Trail Count Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="absolute top-20 md:top-20 left-4 z-[1000]"
      >
        <div className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 shadow-lg">
          <span className="text-xs font-medium text-slate-400">
            {trails.length} trails
          </span>
        </div>
      </motion.div>

      {/* Trail Peek Bottom Sheet */}
      <Drawer.Root open={peekOpen} onOpenChange={setPeekOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1001]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[1002] outline-none">
            <div className="bg-slate-900 border-t border-white/10 rounded-t-3xl safe-bottom">
              {/* Drag Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-10 h-1 rounded-full bg-slate-700" />
              </div>

              {selectedTrail && (
                <div className="px-6 pb-8">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 pr-4">
                      <Drawer.Title className="text-xl font-bold text-slate-50 tracking-tight mb-1">
                        {selectedTrail.name}
                      </Drawer.Title>
                      <div className="flex items-center gap-2 text-slate-400">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-sm">{selectedTrail.region}</span>
                      </div>
                    </div>

                    {/* Verdict Badge */}
                    <div
                      className={`px-4 py-2 rounded-xl ${statusConfig.bgColor} ${statusConfig.borderColor} border`}
                    >
                      <div className="flex items-center gap-2">
                        <statusConfig.icon
                          className={`h-5 w-5 ${statusConfig.color}`}
                        />
                        <span
                          className={`text-sm font-bold tracking-wide ${statusConfig.color}`}
                        >
                          {statusConfig.verdict}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="flex items-center gap-6 mb-6">
                    {/* Last Report */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-400">
                        {formatRelativeTime(selectedTrail.lastReportAt)}
                      </span>
                    </div>

                    {/* Match Score (if vehicle selected) */}
                    {selectedVehicle && (
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-2 w-3 rounded-sm ${
                                level <= Math.round(selectedMatchScore * 5)
                                  ? selectedMatchScore >= 0.7
                                    ? 'bg-emerald-500'
                                    : selectedMatchScore >= 0.4
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                  : 'bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-slate-400">
                          Match for {currentCategory?.shortName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {selectedTrail.description && (
                    <Drawer.Description className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-2">
                      {selectedTrail.description}
                    </Drawer.Description>
                  )}

                  {/* View Details Button */}
                  <Link
                    href={`/trails/${selectedTrail.id}`}
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base transition-all active:scale-[0.98] shadow-lg shadow-emerald-600/20"
                  >
                    View Details
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Mobile Menu Drawer */}
      <Drawer.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[1002] outline-none">
            <div className="bg-slate-900 border-t border-white/10 rounded-t-3xl safe-bottom">
              {/* Drag Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-10 h-1 rounded-full bg-slate-700" />
              </div>

              <div className="px-6 pb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Drawer.Title className="text-xl font-bold text-slate-50">
                    Menu
                  </Drawer.Title>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-400" />
                  </button>
                </div>

                {/* Nav Links */}
                <div className="space-y-2">
                  <Link
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Compass className="h-5 w-5 text-slate-400" />
                    <span className="text-base font-medium text-slate-200">
                      Home
                    </span>
                  </Link>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10">
                    <MapPin className="h-5 w-5 text-emerald-400" />
                    <span className="text-base font-medium text-emerald-400">
                      Browse Map
                    </span>
                  </div>
                  <Link
                    href="/trails/search"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg
                      className="h-5 w-5 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                    <span className="text-base font-medium text-slate-200">
                      Search
                    </span>
                  </Link>
                </div>

                {/* Legend */}
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Trail Status Legend
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm text-slate-300">Clear</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-sm text-slate-300">Rough</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="text-sm text-slate-300">Impassable</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-500" />
                      <span className="text-sm text-slate-300">No Data</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        open={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
        currentVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
      />
    </div>
  );
}
