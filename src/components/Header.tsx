'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Mountain, Menu, X, Car, Settings2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import { VEHICLE_TYPE_LABELS } from '@/types';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled || !isHome
          ? 'bg-[#FAF6F1]/95 backdrop-blur-md border-b border-[#DDD6CA] shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center gap-2.5 transition-colors ${
            isScrolled || !isHome ? 'text-[#2D5A3D]' : 'text-white'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg transition-colors ${
              isScrolled || !isHome ? 'bg-[#2D5A3D]' : 'bg-white/20 backdrop-blur-sm'
            }`}
          >
            <Mountain
              className={`h-5 w-5 ${isScrolled || !isHome ? 'text-white' : 'text-white'}`}
            />
          </div>
          <span
            className="font-semibold text-lg tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            TrailReady
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {!isHome && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={`rounded-lg transition-colors ${
                isScrolled || !isHome
                  ? 'text-[#5C4B3A] hover:text-[#2D5A3D] hover:bg-[#EDE6DC]'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Link href="/">Home</Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={`rounded-lg transition-colors ${
              isScrolled || !isHome
                ? 'text-[#5C4B3A] hover:text-[#2D5A3D] hover:bg-[#EDE6DC]'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Link href="/trails">Browse Trails</Link>
          </Button>

          {/* Vehicle indicator */}
          {selectedVehicle ? (
            <button
              onClick={() => setVehicleModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                isScrolled || !isHome
                  ? 'bg-[#5FA777]/10 hover:bg-[#5FA777]/20 text-[#2D5A3D]'
                  : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
              }`}
            >
              <Car className="h-4 w-4" />
              <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                {VEHICLE_TYPE_LABELS[selectedVehicle].replace(' - ', ' ')}
              </span>
              <Settings2 className="h-3 w-3 opacity-60" />
            </button>
          ) : (
            <button
              onClick={() => setVehicleModalOpen(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                isScrolled || !isHome
                  ? 'border-[#DDD6CA] hover:border-[#5FA777] text-[#5C4B3A] hover:text-[#2D5A3D]'
                  : 'border-white/30 hover:border-white/50 text-white/90 hover:text-white'
              }`}
            >
              <Car className="h-4 w-4" />
              <span className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>Select Vehicle</span>
            </button>
          )}

          <Button
            size="sm"
            asChild
            className={`ml-2 rounded-lg shadow-sm transition-all hover:shadow-md ${
              isScrolled || !isHome
                ? 'bg-[#2D5A3D] hover:bg-[#3D6B4D] text-white'
                : 'bg-white text-[#2D5A3D] hover:bg-white/90'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Link href="/trails">Submit Report</Link>
          </Button>
        </nav>

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile vehicle button - icon only */}
          <button
            onClick={() => setVehicleModalOpen(true)}
            className={`p-2 rounded-full transition-colors ${
              isScrolled || !isHome
                ? 'text-[#2D5A3D] hover:bg-[#EDE6DC]'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Car className={`h-5 w-5 ${selectedVehicle ? 'fill-current opacity-100' : 'opacity-70'}`} />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 rounded-lg transition-colors ${
              isScrolled || !isHome
                ? 'text-[#2D5A3D] hover:bg-[#EDE6DC]'
                : 'text-white hover:bg-white/10'
            }`}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#FAF6F1] border-t border-[#DDD6CA] px-4 py-4 space-y-2">
          {!isHome && (
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-[#5C4B3A] hover:text-[#2D5A3D] hover:bg-[#EDE6DC] rounded-lg transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Home
            </Link>
          )}
          <Link
            href="/trails"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-2 text-[#5C4B3A] hover:text-[#2D5A3D] hover:bg-[#EDE6DC] rounded-lg transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Browse Trails
          </Link>

          {/* Vehicle selection in mobile menu */}
          {selectedVehicle && (
            <button
              onClick={() => {
                setVehicleModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2 text-[#5C4B3A] hover:text-[#2D5A3D] hover:bg-[#EDE6DC] rounded-lg transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                {VEHICLE_TYPE_LABELS[selectedVehicle]}
              </span>
              <Settings2 className="h-4 w-4 opacity-50" />
            </button>
          )}

          <Link
            href="/trails"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-4 py-3 text-center bg-[#2D5A3D] text-white rounded-lg hover:bg-[#3D6B4D] transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Submit Report
          </Link>
        </div>
      )}

      {/* Vehicle selection modal */}
      <VehicleSelectionModal
        open={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
        currentVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
      />
    </header>
  );
}
