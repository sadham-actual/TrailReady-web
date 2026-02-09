'use client';

import { motion } from 'framer-motion';
import { Car, Compass, Menu } from 'lucide-react';
import Link from 'next/link';
import { useVehicle } from '@/contexts/VehicleContext';
import { VEHICLE_CATEGORIES } from '@/types';

interface HudNavProps {
  onOpenVehicleModal: () => void;
  onOpenMobileMenu: () => void;
}

export function HudNav({ onOpenVehicleModal, onOpenMobileMenu }: HudNavProps) {
  const { selectedVehicle } = useVehicle();

  // Find the matching category for display
  const currentCategory = VEHICLE_CATEGORIES.find(
    (cat) => cat.mappedType === selectedVehicle
  );
  const vehicleLabel = currentCategory?.shortName || null;

  const needsVehicle = !selectedVehicle;

  return (
    <>
      {/* Desktop HUD - Floating pill at top center */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="hidden md:flex sticky top-4 z-50 justify-center pt-4"
      >
        <div className="flex items-center gap-1 px-4 py-2 rounded-full bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 shadow-2xl shadow-black/20">
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
          <Link
            href="/trails/browse"
            className="px-4 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-slate-50 hover:bg-white/5 transition-colors"
          >
            Browse
          </Link>
          <Link
            href="/trails/search"
            className="px-4 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-slate-50 hover:bg-white/5 transition-colors"
          >
            Search
          </Link>

          {/* Divider */}
          <div className="w-px h-5 bg-slate-700/50" />

          {/* Garage Button - with pulse when no vehicle */}
          <button
            onClick={onOpenVehicleModal}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              needsVehicle
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {/* Pulse ring when no vehicle */}
            {needsVehicle && (
              <span className="absolute inset-0 rounded-full animate-ping bg-emerald-500/20" style={{ animationDuration: '2s' }} />
            )}
            <Car className="h-4 w-4 relative" />
            <span className="text-sm font-medium relative">
              {vehicleLabel || 'Set Vehicle'}
            </span>
          </button>
        </div>
      </motion.nav>

      {/* Mobile HUD - Fixed at bottom */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 safe-bottom"
      >
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800/50 shadow-2xl shadow-black/30">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
          >
            <Compass className="h-5 w-5 text-emerald-400" strokeWidth={2.5} />
            <span className="text-sm font-semibold tracking-tight text-slate-50">
              TrailReady
            </span>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Garage Button - with pulse when no vehicle */}
            <button
              onClick={onOpenVehicleModal}
              className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${
                needsVehicle
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              }`}
            >
              {needsVehicle && (
                <span className="absolute inset-0 rounded-xl animate-ping bg-emerald-500/20" style={{ animationDuration: '2s' }} />
              )}
              <Car className="h-4 w-4 relative" />
              <span className="text-sm font-medium relative">
                {vehicleLabel || 'Set Vehicle'}
              </span>
            </button>

            {/* Menu Button */}
            <button
              onClick={onOpenMobileMenu}
              className="p-2.5 rounded-xl hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
