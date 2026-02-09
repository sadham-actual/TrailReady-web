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
      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center px-8 py-16">
        {/* Hero heading - visually dominant */}
        <motion.div
          className="text-center mb-12"
          initial="hidden"
          animate="visible"
          variants={fadeSlideUp}
        >
          <h1 className="text-6xl sm:text-7xl font-bold text-white tracking-wide drop-shadow-lg mb-3">
            TrailReady
          </h1>
          <p className="text-xl sm:text-2xl text-white/80 font-medium tracking-wide drop-shadow-md">
            Know before you go.
          </p>
        </motion.div>

        {/* Action cards - centered, floating on background */}
        <motion.div
          className="flex flex-col items-center gap-6"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Explore Trails Card */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
          >
            <Link
              href="/trails/search"
              className="block glass-strong rounded-2xl px-8 py-6 shadow-large hover:shadow-xl cursor-pointer"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-forest)] flex items-center justify-center shadow-soft">
                  <Compass className="h-6 w-6 text-white" />
                </div>
                <div>
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
          >
            <Link
              href="/trails/browse"
              className="block glass-strong rounded-2xl px-8 py-6 shadow-large hover:shadow-xl cursor-pointer"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-stone)] flex items-center justify-center shadow-soft">
                  <Map className="h-6 w-6 text-white" />
                </div>
                <div>
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
            className="glass-strong rounded-2xl px-8 py-6 shadow-large hover:shadow-xl cursor-pointer"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-earth)] flex items-center justify-center shadow-soft">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
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
