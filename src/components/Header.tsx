'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X, Car, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import { VEHICLE_TYPE_LABELS } from '@/types';

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-sm border-b shadow-sm'
          : 'bg-background border-b'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        {/* Logo/Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
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

        {/* Vehicle Selector - Desktop */}
        <div className="hidden md:flex items-center">
          {selectedVehicle ? (
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-light/10 hover:bg-stone-light/20 text-sm font-medium transition-all"
            >
              <Car className="h-4 w-4 text-forest" />
              <span className="text-foreground">
                {VEHICLE_TYPE_LABELS[selectedVehicle].split(' - ')[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          ) : (
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border hover:border-forest/50 text-sm font-medium transition-all"
            >
              <Car className="h-4 w-4" />
              <span>Select Vehicle</span>
            </button>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile Vehicle Button - Icon Only */}
          <button
            onClick={() => setVehicleModalOpen(true)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Select vehicle"
          >
            <Car className={`h-5 w-5 ${selectedVehicle ? 'text-forest' : 'text-muted-foreground'}`} />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t">
          <nav className="container mx-auto px-4 py-4 space-y-1">
            <Link
              href="/trails/browse"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActivePath('/trails/browse')
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              Browse Trails
            </Link>
            <Link
              href="/trails/search"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActivePath('/trails/search')
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              Search Trails
            </Link>

            {/* Vehicle Selection in Mobile Menu */}
            {selectedVehicle && (
              <button
                onClick={() => {
                  setVehicleModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium hover:bg-secondary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-forest" />
                  <span>{VEHICLE_TYPE_LABELS[selectedVehicle]}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </nav>
        </div>
      )}

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
