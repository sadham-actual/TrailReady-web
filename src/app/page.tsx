'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import { CommandBar, useCommandBar } from '@/components/CommandBar';
import { HudNav, Hero, ActionGrid, NearbyTrails } from '@/components/landing';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function Home() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { open: searchOpen, setOpen: setSearchOpen } = useCommandBar();

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(Boolean(data.session));
    };
    void init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

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

      {/* Landing Menu Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-deep-stone/40 backdrop-blur-sm z-50"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.aside
              initial={{ opacity: 0, x: 280 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 280 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="fixed top-0 right-0 h-full w-[86%] max-w-sm z-50 bg-bone border-l border-stone-border shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-deep-stone">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-sm hover:bg-stone-light transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5 text-muted-stone" />
                  </button>
                </div>

                <nav className="space-y-2">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-deep-stone hover:bg-stone-light transition-colors">Home</Link>
                  <Link href="/map" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-deep-stone hover:bg-stone-light transition-colors">Browse Trails</Link>
                  <Link href="/planner" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-deep-stone hover:bg-stone-light transition-colors">Planner</Link>

                  {isAuthenticated && (
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-deep-stone hover:bg-stone-light transition-colors">Profile</Link>
                  )}

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSearchOpen(true);
                    }}
                    className="w-full text-left px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-deep-stone hover:bg-stone-light transition-colors"
                  >
                    Search Trails
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setVehicleModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-action-orange hover:bg-action-orange/10 transition-colors"
                  >
                    {selectedVehicle ? 'Change Vehicle' : 'Set Up Vehicle'}
                  </button>

                  <div className="h-px bg-stone-border my-3" />

                  {isAuthenticated ? (
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-deep-stone hover:bg-stone-light transition-colors"
                    >
                      Sign out
                    </button>
                  ) : (
                    <>
                      <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-deep-stone hover:bg-stone-light transition-colors">Log in</Link>
                      <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3.5 rounded-sm font-mono text-sm font-medium uppercase tracking-wider text-action-orange hover:bg-action-orange/10 transition-colors">Sign up</Link>
                    </>
                  )}
                </nav>
              </div>
            </motion.aside>
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
