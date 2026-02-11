'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import { CommandBar, useCommandBar } from '@/components/CommandBar';
import { HudNav, Hero, ActionGrid, NearbyTrails } from '@/components/landing';

export default function Home() {
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { open: searchOpen, setOpen: setSearchOpen } = useCommandBar();

  return (
    <div className="min-h-screen bg-bone text-deep-stone antialiased">
      {/* Floating HUD Navigation */}
      <HudNav
        onOpenVehicleModal={() => setVehicleModalOpen(true)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
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
              className="fixed inset-0 bg-deep-stone/40 backdrop-blur-sm z-50"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-bone border-t border-stone-border rounded-t-sm shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)] safe-bottom"
            >
              <div className="p-6">
                {/* Handle */}
                <div className="w-10 h-1 bg-stone-medium rounded-sm mx-auto mb-6" />

                {/* Close Button */}
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-sm hover:bg-stone-light transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5 text-muted-stone" />
                </button>

                {/* Menu Links */}
                <nav className="space-y-2">
                  <Link
                    href="/map"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-deep-stone hover:bg-stone-light transition-colors"
                  >
                    Browse Trails
                  </Link>
                  <Link
                    href="/map"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-deep-stone hover:bg-stone-light transition-colors"
                  >
                    Search Trails
                  </Link>
                  <div className="h-px bg-stone-border my-3" />
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setVehicleModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-action-orange hover:bg-action-orange/10 transition-colors"
                  >
                    {selectedVehicle ? 'Change Vehicle' : 'Set Up Vehicle'}
                  </button>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Command Bar - Global Search */}
      <CommandBar open={searchOpen} onOpenChange={setSearchOpen} />

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
