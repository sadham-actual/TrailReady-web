'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useVehicle } from '@/contexts/VehicleContext';
import { VEHICLE_CATEGORIES } from '@/types';

// Trail difficulty: 1 = easy (fire road), 2 = moderate, 3 = difficult, 4 = extreme
interface TrailData {
  id: string;
  name: string;
  distance: string;
  difficulty: 1 | 2 | 3 | 4;
  status: 'clear' | 'caution' | 'impassable';
}

// Mock trail data with difficulty levels
const nearbyTrails: TrailData[] = [
  {
    id: '1',
    name: 'Rubicon Trail',
    distance: '12 mi',
    difficulty: 4, // Extreme - needs extreme build
    status: 'clear',
  },
  {
    id: '2',
    name: 'Fordyce Creek',
    distance: '18 mi',
    difficulty: 3, // Difficult - needs modified 4x4
    status: 'caution',
  },
  {
    id: '3',
    name: 'Barrett Lake Road',
    distance: '24 mi',
    difficulty: 2, // Moderate - HC 4x4 can do it
    status: 'clear',
  },
  {
    id: '4',
    name: 'Slick Rock',
    distance: '45 mi',
    difficulty: 4, // Extreme
    status: 'clear',
  },
  {
    id: '5',
    name: 'Hell Hole Trail',
    distance: '52 mi',
    difficulty: 2, // Moderate
    status: 'clear',
  },
];

type MatchResult = {
  level: 'strong' | 'caution' | 'risk' | 'neutral';
  label: string;
  percent: number;
  bg: string;
  text: string;
  border: string;
  barColor: string;
  icon: React.ReactNode;
};

function calculateMatch(trail: TrailData, vehicleCapability: number | null): MatchResult {
  // No vehicle selected - neutral badge
  if (vehicleCapability === null) {
    return {
      level: 'neutral',
      label: 'Set Vehicle',
      percent: 50,
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/20',
      barColor: 'bg-slate-500',
      icon: <HelpCircle className="h-3 w-3" />,
    };
  }

  const diff = vehicleCapability - trail.difficulty;

  // Vehicle capability >= trail difficulty = Strong Match
  if (diff >= 0) {
    const percent = Math.min(95, 80 + diff * 5);
    return {
      level: 'strong',
      label: 'Strong Match',
      percent,
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      barColor: 'bg-emerald-500',
      icon: <CheckCircle2 className="h-3 w-3" />,
    };
  }

  // Vehicle is 1 level below trail = Caution
  if (diff === -1) {
    return {
      level: 'caution',
      label: 'Caution',
      percent: 65,
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      barColor: 'bg-amber-500',
      icon: <AlertTriangle className="h-3 w-3" />,
    };
  }

  // Vehicle is 2+ levels below trail = High Risk
  return {
    level: 'risk',
    label: 'High Risk',
    percent: Math.max(20, 50 + diff * 15),
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    barColor: 'bg-rose-500',
    icon: <AlertTriangle className="h-3 w-3" />,
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.9,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export function NearbyTrails() {
  const { selectedVehicle } = useVehicle();
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Find current vehicle capability level
  const currentCategory = VEHICLE_CATEGORIES.find(
    (cat) => cat.mappedType === selectedVehicle
  );
  const vehicleCapability = currentCategory?.capabilityLevel ?? null;

  // Flash animation when vehicle changes
  useEffect(() => {
    if (selectedVehicle !== undefined) {
      setIsRecalculating(true);
      const timer = setTimeout(() => setIsRecalculating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [selectedVehicle]);

  return (
    <section className="pb-32 md:pb-28">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85 }}
        className="mb-6 flex items-end justify-between"
      >
        <div>
          <h2 className="text-2xl font-semibold text-slate-50 tracking-tight">
            Match Intelligence
          </h2>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            {selectedVehicle
              ? `Trails matched to your ${currentCategory?.shortName}`
              : 'Select a vehicle for personalized matching'}
          </p>
        </div>
        <Link
          href="/trails/browse"
          className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </motion.div>

      {/* Horizontal Scroll */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <AnimatePresence mode="sync">
          {nearbyTrails.map((trail) => {
            const match = calculateMatch(trail, vehicleCapability);

            return (
              <motion.div
                key={trail.id}
                variants={cardVariants}
                className="snap-start"
              >
                <Link
                  href={`/trails/${trail.id}`}
                  className={`group block w-[300px] p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/5 hover:border-emerald-500/30 transition-all duration-300 flex-shrink-0 ${
                    isRecalculating ? 'animate-pulse' : ''
                  }`}
                >
                  {/* Trail Name & Distance */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-50 group-hover:text-emerald-400 transition-colors">
                        {trail.name}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5 text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="text-sm">{trail.distance}</span>
                      </div>
                    </div>

                    {/* Match Badge */}
                    <motion.span
                      key={`${trail.id}-${match.level}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${match.bg} ${match.text} ${match.border}`}
                    >
                      {match.icon}
                      {match.label}
                    </motion.span>
                  </div>

                  {/* Match Bar */}
                  <div className="mt-6">
                    <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <motion.div
                        key={`${trail.id}-bar-${match.percent}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${match.percent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${match.barColor}`}
                      />
                    </div>
                    <p className="mt-2.5 text-xs text-slate-500">
                      {selectedVehicle ? 'Vehicle compatibility' : 'Select vehicle for match'}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* View More Card */}
        <motion.div variants={cardVariants} className="snap-start">
          <Link
            href="/trails/browse"
            className="group flex flex-col items-center justify-center w-[160px] h-full min-h-[140px] p-5 rounded-2xl bg-slate-900/20 border border-white/5 hover:border-emerald-500/20 hover:bg-slate-900/40 transition-all duration-300 flex-shrink-0"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:border-emerald-500/20 group-hover:bg-emerald-500/10 transition-all">
              <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <span className="mt-4 text-sm font-medium text-slate-500 group-hover:text-slate-300 transition-colors">
              View all trails
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
