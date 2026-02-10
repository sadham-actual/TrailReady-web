'use client';

import { motion } from 'framer-motion';
import { Car, Compass, Menu, Search } from 'lucide-react';
import Link from 'next/link';
import { useVehicle } from '@/contexts/VehicleContext';
import { VEHICLE_CATEGORIES } from '@/types';
import { KeyboardBadge } from '@/components/CommandBar';

interface HudNavProps {
  onOpenVehicleModal: () => void;
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
}

// Corner bracket component for hardware feel
function CornerBracket({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const positionClasses = {
    tl: 'top-2 left-2 border-l border-t',
    tr: 'top-2 right-2 border-r border-t',
    bl: 'bottom-2 left-2 border-l border-b',
    br: 'bottom-2 right-2 border-r border-b',
  };

  return (
    <span
      className={`absolute w-2 h-2 border-stone-medium ${positionClasses[position]}`}
      aria-hidden="true"
    />
  );
}

export function HudNav({ onOpenVehicleModal, onOpenMobileMenu, onOpenSearch }: HudNavProps) {
  const { selectedVehicle } = useVehicle();

  // Find the matching category for display
  const currentCategory = VEHICLE_CATEGORIES.find(
    (cat) => cat.mappedType === selectedVehicle
  );
  const vehicleLabel = currentCategory?.shortName || null;

  const needsVehicle = !selectedVehicle;

  return (
    <>
      {/* Desktop HUD - Floating Plate with Hardware Details */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden md:flex sticky top-6 z-50 justify-center"
      >
        <div className="relative flex items-center gap-1 px-6 py-3 bg-white border border-stone-border rounded-sm shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08),2px_2px_0_0_var(--color-stone-border)]">
          {/* Corner Brackets for Hardware Feel */}
          <CornerBracket position="tl" />
          <CornerBracket position="tr" />
          <CornerBracket position="bl" />
          <CornerBracket position="br" />

          {/* System Version Serial - Top Left Corner */}
          <span className="absolute -top-5 left-2 font-mono text-[8px] uppercase tracking-widest text-stone-medium select-none">
            TR-v1.0 // 40.7128° N
          </span>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-sm hover:bg-stone-light transition-colors"
          >
            <Compass className="h-5 w-5 text-action-orange" strokeWidth={2.5} />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-deep-stone">
              TrailReady
            </span>
          </Link>

          {/* Divider */}
          <div className="w-px h-6 bg-stone-border mx-2" />

          {/* Nav Links */}
          <Link
            href="/trails/browse"
            className="px-3 py-2 rounded-sm font-mono text-xs font-medium uppercase tracking-wider text-muted-stone hover:text-deep-stone hover:bg-stone-light transition-colors"
          >
            Browse
          </Link>
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-sm font-mono text-xs font-medium uppercase tracking-wider text-muted-stone hover:text-deep-stone hover:bg-stone-light transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
            <KeyboardBadge className="ml-1" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-stone-border mx-2" />

          {/* Garage Button */}
          <button
            onClick={onOpenVehicleModal}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-sm font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
              needsVehicle
                ? 'bg-action-orange text-white border border-action-orange-dark shadow-[2px_2px_0_0_var(--color-action-orange-dark)] hover:bg-action-orange-light active:shadow-[1px_1px_0_0_var(--color-action-orange-dark)] active:translate-x-px active:translate-y-px'
                : 'bg-status-clear text-white border border-green-700 shadow-[2px_2px_0_0_#15803d] hover:bg-green-500 active:shadow-[1px_1px_0_0_#15803d] active:translate-x-px active:translate-y-px'
            }`}
          >
            <Car className="h-4 w-4" />
            <span>{vehicleLabel || 'Set Rig'}</span>
          </button>
        </div>
      </motion.nav>

      {/* Mobile HUD - Fixed at bottom, Plate Style */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom"
      >
        <div className="relative flex items-center justify-between px-4 py-3 bg-white border border-stone-border rounded-sm shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08),2px_2px_0_0_var(--color-stone-border)]">
          {/* Corner Brackets */}
          <CornerBracket position="tl" />
          <CornerBracket position="tr" />
          <CornerBracket position="bl" />
          <CornerBracket position="br" />

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 px-2 py-1.5"
          >
            <Compass className="h-5 w-5 text-action-orange" strokeWidth={2.5} />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-deep-stone">
              TrailReady
            </span>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button - Mobile */}
            <button
              onClick={onOpenSearch}
              className="p-2.5 rounded-sm border border-stone-border bg-white hover:bg-stone-light shadow-[2px_2px_0_0_var(--color-stone-border)] active:shadow-[1px_1px_0_0_var(--color-stone-border)] active:translate-x-px active:translate-y-px transition-all"
              aria-label="Search trails"
            >
              <Search className="h-5 w-5 text-muted-stone" />
            </button>

            {/* Garage Button */}
            <button
              onClick={onOpenVehicleModal}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm font-mono text-xs font-semibold uppercase tracking-wider transition-all ${
                needsVehicle
                  ? 'bg-action-orange text-white border border-action-orange-dark shadow-[2px_2px_0_0_var(--color-action-orange-dark)]'
                  : 'bg-status-clear text-white border border-green-700 shadow-[2px_2px_0_0_#15803d]'
              }`}
            >
              <Car className="h-4 w-4" />
              <span>{vehicleLabel || 'Set Rig'}</span>
            </button>

            {/* Menu Button */}
            <button
              onClick={onOpenMobileMenu}
              className="p-2.5 rounded-sm border border-stone-border bg-white hover:bg-stone-light shadow-[2px_2px_0_0_var(--color-stone-border)] active:shadow-[1px_1px_0_0_var(--color-stone-border)] active:translate-x-px active:translate-y-px transition-all"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-deep-stone" />
            </button>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
