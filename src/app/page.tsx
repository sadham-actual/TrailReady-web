'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Compass, Search, Car, MapPin } from 'lucide-react';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Hero Background */}
      <div className="absolute inset-0">
        <Image
          src="/hero-bg.JPG"
          alt="Offroad trail in canyon landscape"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-6 pb-12 md:p-12 md:pb-20">
        <div className="max-w-lg mx-auto w-full text-center md:text-left md:mx-0">
          {/* Logo/Brand */}
          <div
            className="flex items-center justify-center md:justify-start gap-2 mb-4 animate-fade-in"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground tracking-tight">
              TrailReady
            </span>
          </div>

          {/* Tagline */}
          <h1
            className="text-4xl md:text-5xl font-bold text-primary-foreground mb-3 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Find offroad trails.
          </h1>
          <p
            className="text-xl md:text-2xl text-primary-foreground/80 mb-8 animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            Know before you go.
          </p>

          {/* Action Buttons */}
          <div
            className="flex flex-col gap-3 max-w-xs mx-auto md:mx-0 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <Button
              variant="hero"
              size="hero"
              asChild
              className="w-full justify-center gap-3"
            >
              <Link href="/trails/browse">
                <Compass className="h-5 w-5" />
                Explore Trails
              </Link>
            </Button>

            <Button
              variant="heroSecondary"
              size="hero"
              asChild
              className="w-full justify-center gap-3"
            >
              <Link href="/trails/search">
                <Search className="h-5 w-5" />
                Search Trails
              </Link>
            </Button>

            <Button
              variant="heroSecondary"
              size="hero"
              onClick={() => setVehicleModalOpen(true)}
              className="w-full justify-center gap-3"
            >
              <Car className="h-5 w-5" />
              {selectedVehicle ? 'Change Vehicle' : 'Select Vehicle'}
            </Button>
          </div>

          {/* Show selected vehicle */}
          {selectedVehicle && (
            <div
              className="mt-4 text-sm text-primary-foreground/70 text-center md:text-left animate-fade-in max-w-xs mx-auto md:mx-0"
            >
              Your vehicle: <span className="font-medium text-primary-foreground">{selectedVehicle.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom gradient fade for extra depth */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />

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
