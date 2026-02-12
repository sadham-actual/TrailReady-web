'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Car, ChevronDown, Compass } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import { CommandBar, useCommandBar } from '@/components/CommandBar';
import { VEHICLE_TYPE_LABELS } from '@/types';

export function Header() {
  // All hooks MUST be called before any conditional returns (React rules of hooks)
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const { open: searchOpen, setOpen: setSearchOpen } = useCommandBar();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hide header on landing page (full-screen hero) - AFTER all hooks
  if (pathname === '/' || pathname.startsWith('/map')) {
    return null;
  }

  const isActivePath = (path: string) => {
    if (path === '/map') return pathname.startsWith('/map');
    return pathname === path;
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled
          ? 'bg-bone/95 backdrop-blur-sm border-b border-stone-border shadow-sm'
          : 'bg-bone border-b border-stone-border'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        {/* Logo/Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-deep-stone hover:text-action-orange transition-colors"
        >
          <Compass className="h-5 w-5 text-action-orange" strokeWidth={2.5} />
          <span className="font-mono text-sm font-bold uppercase tracking-wider">
            TrailReady
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/map"
            className={`font-mono text-xs font-medium uppercase tracking-wider transition-colors ${
              isActivePath('/map')
                ? 'text-orange-600'
                : 'text-muted-stone hover:text-orange-600'
            }`}
          >
            Browse
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={`font-mono text-xs font-medium uppercase tracking-wider transition-colors ${
              searchOpen
                ? 'text-orange-600'
                : 'text-muted-stone hover:text-orange-600'
            }`}
          >
            Search
          </button>
        </nav>

        {/* Vehicle Selector - Desktop */}
        <div className="hidden md:flex items-center gap-3">
          {selectedVehicle ? (
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-sm bg-status-clear text-white font-mono text-xs font-semibold uppercase tracking-wider border border-green-700 shadow-[2px_2px_0_0_#15803d] hover:bg-green-500 active:shadow-[1px_1px_0_0_#15803d] active:translate-x-px active:translate-y-px transition-all"
            >
              <Car className="h-4 w-4" />
              <span>{VEHICLE_TYPE_LABELS[selectedVehicle].split(' - ')[0]}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          ) : (
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-sm bg-action-orange text-white font-mono text-xs font-semibold uppercase tracking-wider border border-action-orange-dark shadow-[2px_2px_0_0_var(--color-action-orange-dark)] hover:bg-action-orange-light active:shadow-[1px_1px_0_0_var(--color-action-orange-dark)] active:translate-x-px active:translate-y-px transition-all"
            >
              <Car className="h-4 w-4" />
              <span>Set Rig</span>
            </button>
          )}
          <Link
            href="/waitlist"
            className="px-3 py-2 border-2 border-orange-500 text-orange-500 font-mono text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-orange-500 hover:text-stone-100"
          >
            Join Expedition
          </Link>
        </div>

        {/* Mobile Actions */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile Vehicle Button */}
          <button
            onClick={() => setVehicleModalOpen(true)}
            className={`p-2 rounded-sm border transition-all ${
              selectedVehicle
                ? 'bg-status-clear text-white border-green-700'
                : 'bg-action-orange text-white border-action-orange-dark'
            }`}
            aria-label="Select vehicle"
          >
            <Car className="h-5 w-5" />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-sm border border-stone-border bg-white hover:bg-stone-light shadow-[2px_2px_0_0_var(--color-stone-border)] active:shadow-[1px_1px_0_0_var(--color-stone-border)] active:translate-x-px active:translate-y-px transition-all"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-deep-stone" />
            ) : (
              <Menu className="h-5 w-5 text-deep-stone" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-bone border-t border-stone-border">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <Link
              href="/map"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-sm font-mono text-xs font-medium uppercase tracking-wider transition-all ${
                isActivePath('/map')
                  ? 'bg-action-orange/10 text-action-orange border border-action-orange/20'
                  : 'text-deep-stone hover:bg-stone-light border border-transparent'
              }`}
            >
              Browse Trails
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className={`block px-4 py-3 rounded-sm font-mono text-xs font-medium uppercase tracking-wider transition-all ${
                searchOpen
                  ? 'bg-orange-600/10 text-orange-600 border border-orange-600/20'
                  : 'text-deep-stone hover:bg-stone-light hover:text-orange-600 border border-transparent'
              }`}
            >
              Search Trails
            </button>

            {/* Vehicle Selection in Mobile Menu */}
            {selectedVehicle && (
              <button
                onClick={() => {
                  setVehicleModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-sm font-mono text-xs font-medium uppercase tracking-wider hover:bg-stone-light transition-colors border border-transparent"
              >
                <span className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-status-clear" />
                  <span className="text-deep-stone">{VEHICLE_TYPE_LABELS[selectedVehicle]}</span>
                </span>
                <ChevronDown className="h-4 w-4 text-muted-stone" />
              </button>
            )}

            <Link
              href="/waitlist"
              onClick={() => setIsMobileMenuOpen(false)}
              className="mt-2 block w-full px-4 py-3 text-center border-2 border-orange-500 text-orange-500 font-mono text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-orange-500 hover:text-stone-100"
            >
              Join Expedition
            </Link>
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
      <CommandBar open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
