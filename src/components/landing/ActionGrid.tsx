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

const statusColors = {
  clear: 'bg-emerald-500',
  caution: 'bg-amber-500',
  impassable: 'bg-rose-500',
};

const statusTextColors = {
  clear: 'text-emerald-400',
  caution: 'text-amber-400',
  impassable: 'text-rose-400',
};

const statusLabels = {
  clear: 'Passable',
  caution: 'Caution',
  impassable: 'Impassable',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.6,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function ActionGrid({ onOpenVehicleModal }: ActionGridProps) {
  const { selectedVehicle } = useVehicle();

  return (
    <section className="pb-20 md:pb-28">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6"
      >
        {/* The Map Card */}
        <motion.div variants={cardVariants}>
          <Link
            href="/trails/browse"
            className="group block h-full p-7 md:p-8 rounded-3xl bg-slate-900/50 backdrop-blur-md border border-slate-800/50 hover:border-emerald-500/30 hover:bg-slate-900/70 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Map className="h-6 w-6 text-emerald-400" />
              </div>
              <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-slate-50 tracking-tight">The Map</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">Visual Intelligence</p>
            </div>

            {/* Mini Map Preview Placeholder */}
            <div className="mt-8 h-28 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-slate-500">
                  Interactive map
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* The Garage Card */}
        <motion.div variants={cardVariants}>
          <button
            onClick={onOpenVehicleModal}
            className="group w-full h-full p-7 md:p-8 rounded-3xl bg-slate-900/50 backdrop-blur-md border border-slate-800/50 hover:border-emerald-500/30 hover:bg-slate-900/70 transition-all duration-300 text-left"
          >
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Car className="h-6 w-6 text-emerald-400" />
              </div>
              {selectedVehicle && (
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  Active
                </span>
              )}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-slate-50 tracking-tight">The Garage</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">Your Rig's Capability</p>
            </div>

            {/* Vehicle Display */}
            <div className="mt-8 h-28 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center px-4">
              {selectedVehicle ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-emerald-400">
                    {VEHICLE_TYPE_LABELS[selectedVehicle]}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Tap to change</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-500">
                    No vehicle selected
                  </p>
                  <p className="mt-2 text-xs text-emerald-400 font-medium">
                    Tap to configure
                  </p>
                </div>
              )}
            </div>
          </button>
        </motion.div>

        {/* The Intel Card */}
        <motion.div variants={cardVariants}>
          <div className="h-full p-7 md:p-8 rounded-3xl bg-slate-900/50 backdrop-blur-md border border-slate-800/50">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Radio className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-400">Live</span>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-slate-50 tracking-tight">The Intel</h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">Latest Trail Reports</p>
            </div>

            {/* Intel Feed */}
            <div className="mt-8 space-y-3">
              {recentIntel.map((intel, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${statusColors[intel.status as keyof typeof statusColors]}`}
                    />
                    <span className="text-sm font-medium text-slate-300 truncate max-w-[100px]">
                      {intel.trail}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium ${statusTextColors[intel.status as keyof typeof statusTextColors]}`}>
                      {statusLabels[intel.status as keyof typeof statusLabels]}
                    </span>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{intel.timeAgo}</span>
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
