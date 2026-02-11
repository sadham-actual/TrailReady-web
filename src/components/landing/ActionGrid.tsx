'use client';

import { motion } from 'framer-motion';
import { Map, Car, Radio, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useVehicle } from '@/contexts/VehicleContext';
import { VEHICLE_TYPE_LABELS } from '@/types';

interface ActionGridProps {
  onOpenVehicleModal: () => void;
}

// Mock intel data - would come from API in production
const recentIntel = [
  { trail: 'Rubicon Trail', status: 'impassable', timeAgo: '2h' },
  { trail: 'Fordyce Creek', status: 'caution', timeAgo: '4h' },
  { trail: 'Barrett Lake', status: 'clear', timeAgo: '6h' },
];

// High contrast solid status colors
const statusBlockClasses = {
  clear: 'bg-status-clear',
  caution: 'bg-status-rough',
  impassable: 'bg-status-impassable',
};

const statusLabels = {
  clear: 'Clear',
  caution: 'Caution',
  impassable: 'Blocked',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.5,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function ActionGrid({ onOpenVehicleModal }: ActionGridProps) {
  const { selectedVehicle } = useVehicle();

  return (
    <section className="pb-20 md:pb-28 px-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto"
      >
        {/* The Map Card */}
        <motion.div variants={cardVariants}>
          <Link
            href="/map"
            className="group block h-full p-6 md:p-7 bg-white border border-stone-border rounded-sm shadow-[2px_2px_0_0_var(--color-stone-border)] hover:shadow-[4px_4px_0_0_var(--color-stone-border)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150"
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-sm bg-action-orange/10 border border-action-orange/20">
                <Map className="h-6 w-6 text-action-orange" />
              </div>
              <ChevronRight className="h-5 w-5 text-muted-stone group-hover:text-action-orange group-hover:translate-x-1 transition-all" />
            </div>

            <div className="mt-6">
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-stone">
                01 / Map
              </span>
              <h3 className="mt-2 text-xl font-bold text-deep-stone tracking-tight">
                Browse Trails
              </h3>
              <p className="mt-2 text-sm text-charcoal leading-relaxed">
                Visual intel on 2,400+ trails
              </p>
            </div>

            {/* Mini Map Preview */}
            <div className="mt-6 h-24 rounded-sm bg-stone-light border border-stone-border flex items-center justify-center overflow-hidden bg-dots">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-border rounded-sm shadow-[1px_1px_0_0_var(--color-stone-border)]">
                <div className="w-2 h-2 rounded-full bg-status-clear animate-pulse" />
                <span className="font-mono text-xs text-muted-stone uppercase">
                  Live Map
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* The Garage Card */}
        <motion.div variants={cardVariants}>
          <button
            onClick={onOpenVehicleModal}
            className="group w-full h-full p-6 md:p-7 bg-white border border-stone-border rounded-sm shadow-[2px_2px_0_0_var(--color-stone-border)] hover:shadow-[4px_4px_0_0_var(--color-stone-border)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-150 text-left"
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-sm bg-action-orange/10 border border-action-orange/20">
                <Car className="h-6 w-6 text-action-orange" />
              </div>
              {selectedVehicle && (
                <span className="px-2.5 py-1 rounded-sm bg-status-clear text-white font-mono text-xs font-semibold uppercase tracking-wider">
                  Set
                </span>
              )}
            </div>

            <div className="mt-6">
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-stone">
                02 / Garage
              </span>
              <h3 className="mt-2 text-xl font-bold text-deep-stone tracking-tight">
                Your Rig
              </h3>
              <p className="mt-2 text-sm text-charcoal leading-relaxed">
                Set vehicle capability
              </p>
            </div>

            {/* Vehicle Display */}
            <div className="mt-6 h-24 rounded-sm bg-stone-light border border-stone-border flex items-center justify-center px-4">
              {selectedVehicle ? (
                <div className="text-center">
                  <p className="font-mono text-sm font-bold text-deep-stone uppercase tracking-wide">
                    {VEHICLE_TYPE_LABELS[selectedVehicle]}
                  </p>
                  <p className="mt-2 font-mono text-xs text-muted-stone uppercase">
                    Tap to change
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-mono text-sm font-medium text-muted-stone uppercase">
                    Not configured
                  </p>
                  <p className="mt-2 font-mono text-xs text-action-orange font-bold uppercase">
                    Tap to set
                  </p>
                </div>
              )}
            </div>
          </button>
        </motion.div>

        {/* The Intel Card */}
        <motion.div variants={cardVariants}>
          <div className="h-full p-6 md:p-7 bg-white border border-stone-border rounded-sm shadow-[2px_2px_0_0_var(--color-stone-border)]">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-sm bg-action-orange/10 border border-action-orange/20">
                <Radio className="h-6 w-6 text-action-orange" />
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-status-clear">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>

            <div className="mt-6">
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-muted-stone">
                03 / Intel
              </span>
              <h3 className="mt-2 text-xl font-bold text-deep-stone tracking-tight">
                Trail Reports
              </h3>
              <p className="mt-2 text-sm text-charcoal leading-relaxed">
                Latest field updates
              </p>
            </div>

            {/* Intel Feed */}
            <div className="mt-6 space-y-0 border border-stone-border rounded-sm overflow-hidden">
              {recentIntel.map((intel, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border-b border-stone-border last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-sm ${statusBlockClasses[intel.status as keyof typeof statusBlockClasses]}`}
                    />
                    <span className="text-sm font-medium text-deep-stone truncate max-w-[90px]">
                      {intel.trail}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-stone">
                      {statusLabels[intel.status as keyof typeof statusLabels]}
                    </span>
                    <div className="flex items-center gap-1 text-muted-stone">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono text-xs">{intel.timeAgo}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
