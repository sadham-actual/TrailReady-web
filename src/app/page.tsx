'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import { HudNav, Hero, ActionGrid, NearbyTrails } from '@/components/landing';

export default function Home() {
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 antialiased bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]">
      {/* Floating HUD Navigation */}
      <HudNav
        onOpenVehicleModal={() => setVehicleModalOpen(true)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6">
        {/* Hero Section */}
        <Hero />

        {/* Action Grid - The Three Cards */}
        <ActionGrid onOpenVehicleModal={() => setVehicleModalOpen(true)} />

        {/* Nearby Trails - Horizontal Scroll */}
        <NearbyTrails />
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-white/10 rounded-t-3xl shadow-2xl safe-bottom"
            >
              <div className="p-6">
                {/* Handle */}
                <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

                {/* Close Button */}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>

                {/* Menu Links */}
                <nav className="space-y-2">
                  <Link
                    href="/trails/browse"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3.5 rounded-xl text-base font-medium text-slate-100 hover:bg-white/5 transition-colors"
                  >
                    Browse Trails
                  </Link>
                  <Link
                    href="/trails/search"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3.5 rounded-xl text-base font-medium text-slate-100 hover:bg-white/5 transition-colors"
                  >
                    Search Trails
                  </Link>
                  <div className="h-px bg-white/10 my-3" />
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setVehicleModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-3.5 rounded-xl text-base font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    {selectedVehicle ? 'Change Vehicle' : 'Set Up Vehicle'}
                  </button>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
