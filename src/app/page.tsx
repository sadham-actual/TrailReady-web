'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Compass, Map, Car } from 'lucide-react';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';

export default function Home() {
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background image */}
      <img
        src="/hero-bg.JPG"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />

      {/* Content centered in viewport */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 py-16">
        {/* Max-width container for cards */}
        <div className="w-full max-w-lg flex flex-col items-center gap-8">
          {/* Hero heading - extra large, top-center */}
          <div className="text-center space-y-2">
            <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight drop-shadow-lg">
              TrailReady
            </h1>
            <p className="text-xl text-white/80 font-medium drop-shadow-md">
              Know before you go.
            </p>
          </div>

          {/* Action cards container */}
          <div className="w-full flex flex-col items-center gap-4">
            {/* Explore Trails Card */}
            <Link
              href="/trails/search"
              className="group w-full max-w-sm glass-strong rounded-2xl p-6 shadow-large transition-all duration-200 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-forest)] flex items-center justify-center shadow-soft">
                  <Compass className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white">Explore Trails</h2>
                  <p className="text-sm text-white/70">Search and discover new routes</p>
                </div>
              </div>
            </Link>

            {/* Browse Map Card */}
            <Link
              href="/trails/browse"
              className="group w-full max-w-sm glass-strong rounded-2xl p-6 shadow-large transition-all duration-200 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-stone)] flex items-center justify-center shadow-soft">
                  <Map className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white">Browse Map</h2>
                  <p className="text-sm text-white/70">View trails on an interactive map</p>
                </div>
              </div>
            </Link>

            {/* Select Vehicle Card */}
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="group w-full max-w-sm glass-strong rounded-2xl p-6 shadow-large transition-all duration-200 hover:scale-[1.02] hover:shadow-xl cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-earth)] flex items-center justify-center shadow-soft">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white">
                    {selectedVehicle ? 'Change Vehicle' : 'Select Vehicle'}
                  </h2>
                  <p className="text-sm text-white/70">
                    {selectedVehicle
                      ? selectedVehicle.replace(/_/g, ' ')
                      : 'Set your vehicle for trail matching'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

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
