'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Car, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import { VEHICLE_TYPE_LABELS } from '@/types';

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePath = (path: string) => {
    if (path === '/trails/browse') return pathname.startsWith('/trails/browse');
    if (path === '/trails/search') return pathname.startsWith('/trails/search');
    return pathname === path;
  };

  // Hide header on landing page
  if (pathname === '/') {
    return null;
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'glass shadow-soft'
          : 'bg-background border-b'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        {/* Logo/Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            TrailReady
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/trails/browse"
            className={`text-sm font-medium transition-colors ${
              isActivePath('/trails/browse')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Browse
          </Link>
          <Link
            href="/trails/search"
            className={`text-sm font-medium transition-colors ${
              isActivePath('/trails/search')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Search
          </Link>
        </nav>

        {/* Vehicle Selector */}
        <div className="flex items-center">
          {selectedVehicle ? (
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent hover:bg-accent/80 text-sm font-medium transition-all"
            >
              <Car className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline text-foreground">
                {VEHICLE_TYPE_LABELS[selectedVehicle].split(' - ')[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          ) : (
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border hover:border-primary/50 text-sm font-medium transition-all"
            >
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Select Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* Vehicle Selection Modal */}
      <VehicleSelectionModal
        open={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
        currentVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
      />
    </header>
  );
}
