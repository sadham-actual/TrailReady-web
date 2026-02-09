'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Compass, Map, Car } from 'lucide-react';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';

// Animation variants
const fadeSlideUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

export default function Home() {
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background image */}
      <img
        src="/hero-bg.JPG"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle gradient overlay for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />

      {/* Content centered in viewport */}
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-6 py-16">
        {/* Max-width container for cards */}
        <div className="w-full max-w-lg flex flex-col items-center gap-8">
          {/* Hero heading - extra large, top-center */}
          <motion.div
            className="text-center space-y-2"
            initial="hidden"
            animate="visible"
            variants={fadeSlideUp}
          >
            <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight drop-shadow-lg">
              TrailReady
            </h1>
            <p className="text-xl text-white/80 font-medium drop-shadow-md">
              Know before you go.
            </p>
          </motion.div>

          {/* Action cards container */}
          <motion.div
            className="w-full flex flex-col items-center gap-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Explore Trails Card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
              className="w-full max-w-sm"
            >
              <Link
                href="/trails/search"
                className="block w-full glass-strong rounded-2xl p-6 shadow-large hover:shadow-xl cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-forest)] flex items-center justify-center shadow-soft">
                    <Compass className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white">Explore Trails</h2>
                    <p className="text-sm text-white/70">Search and discover new routes</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Browse Map Card */}
            <motion.div
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
              className="w-full max-w-sm"
            >
              <Link
                href="/trails/browse"
                className="block w-full glass-strong rounded-2xl p-6 shadow-large hover:shadow-xl cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-stone)] flex items-center justify-center shadow-soft">
                    <Map className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white">Browse Map</h2>
                    <p className="text-sm text-white/70">View trails on an interactive map</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Select Vehicle Card */}
            <motion.button
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
              onClick={() => setVehicleModalOpen(true)}
              className="w-full max-w-sm glass-strong rounded-2xl p-6 shadow-large hover:shadow-xl cursor-pointer text-left"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--color-earth)] flex items-center justify-center shadow-soft">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white">
                    {selectedVehicle ? 'Change Vehicle' : 'Select Vehicle'}
                  </h2>
                  <p className="text-sm text-white/70">
                    {selectedVehicle
                      ? selectedVehicle.replace(/_/g, ' ')
                      : 'Set your vehicle for trail matching'}
                  </p>
                </div>
              </div>
            </motion.button>
          </motion.div>
        </div>
      </div>

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
