'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Map, Car } from 'lucide-react';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';

export default function Home() {
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      {/* Hero Section - Full Viewport */}
      <section className="relative min-h-screen flex items-center justify-center px-6 md:px-4">
        {/* Background Image */}
        <Image
          src="/hero-bg.JPG"
          alt=""
          fill
          className="object-cover"
          priority
          style={{ zIndex: -2 }}
        />

        {/* Dark Overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"
          style={{ zIndex: -1 }}
        />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-sm mx-auto text-center px-8">
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            TrailReady
          </h1>

          {/* Tagline */}
          <p className="text-lg md:text-xl text-white/90 mb-12">
            Know before you go
          </p>

          {/* Three Action Buttons */}
          <div className="flex flex-col gap-8 w-full">
            {/* Browse Trails */}
            <Link
              href="/trails/browse"
              className="group flex items-center justify-center gap-3 w-full min-h-[84px] px-8 bg-forest hover:bg-forest-dark text-white rounded-2xl shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-200"
            >
              <Map className="h-6 w-6 group-hover:scale-110 transition-transform" strokeWidth={2} />
              <span className="text-lg font-semibold">Browse Trails</span>
            </Link>

            {/* Search Trails */}
            <Link
              href="/trails/search"
              className="group flex items-center justify-center gap-3 w-full min-h-[84px] px-8 bg-earth hover:bg-earth-dark text-white rounded-2xl shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-200"
            >
              <Search className="h-6 w-6 group-hover:scale-110 transition-transform" strokeWidth={2} />
              <span className="text-lg font-semibold">Search Trails</span>
            </Link>

            {/* Select Vehicle */}
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="group flex items-center justify-center gap-3 w-full min-h-[84px] px-8 bg-stone hover:bg-stone-dark text-white rounded-2xl shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-200"
            >
              <Car className="h-6 w-6 group-hover:scale-110 transition-transform" strokeWidth={2} />
              <span className="text-lg font-semibold">
                {selectedVehicle ? 'Change Vehicle' : 'Select Vehicle'}
              </span>
            </button>
          </div>

          {/* Optional: Show selected vehicle */}
          {selectedVehicle && (
            <div className="mt-6 text-sm text-white/70">
              Currently: <span className="font-medium text-white">{selectedVehicle.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>
      </section>

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
