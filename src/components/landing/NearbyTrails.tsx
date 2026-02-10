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
      bg: 'bg-stone-100',
      text: 'text-muted-stone',
      border: 'border-stone-border',
      barColor: 'bg-stone-medium',
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
      bg: 'bg-status-clear/10',
      text: 'text-status-clear',
      border: 'border-status-clear/30',
      barColor: 'bg-status-clear',
      icon: <CheckCircle2 className="h-3 w-3" />,
    };
  }

  // Vehicle is 1 level below trail = Caution
  if (diff === -1) {
    return {
      level: 'caution',
      label: 'Caution',
      percent: 65,
      bg: 'bg-status-rough/10',
      text: 'text-status-rough',
      border: 'border-status-rough/30',
      barColor: 'bg-status-rough',
      icon: <AlertTriangle className="h-3 w-3" />,
    };
  }

  // Vehicle is 2+ levels below trail = High Risk
  return {
    level: 'risk',
    label: 'High Risk',
    percent: Math.max(20, 50 + diff * 15),
    bg: 'bg-status-impassable/10',
    text: 'text-status-impassable',
    border: 'border-status-impassable/30',
    barColor: 'bg-status-impassable',
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
      {/* Section Header - Industrial Typography */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85 }}
        className="mb-6 flex items-end justify-between"
      >
        <div>
          <h2 className="font-mono text-xl font-bold uppercase tracking-wider text-charcoal">
            Match Intelligence
          </h2>
          <p className="mt-2 text-sm font-medium text-deep-stone leading-relaxed">
            {selectedVehicle
              ? `Trails matched to your ${currentCategory?.shortName}`
              : 'Select a vehicle for personalized matching'}
          </p>
        </div>
        <Link
          href="/trails/browse"
          className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-medium uppercase tracking-wider text-muted-stone hover:text-action-orange transition-colors"
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
                  className={`group block w-[300px] p-5 rounded-sm bg-white border border-stone-border shadow-[3px_3px_0_0_var(--color-stone-border)] hover:shadow-[4px_4px_0_0_var(--color-action-orange)] hover:border-action-orange/30 transition-all duration-200 flex-shrink-0 ${
                    isRecalculating ? 'animate-pulse' : ''
                  }`}
                >
                  {/* Trail Name & Distance */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-stone-900 group-hover:text-action-orange transition-colors">
                        {trail.name}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-1.5 text-muted-stone">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs">{trail.distance}</span>
                      </div>
                    </div>

                    {/* Match Badge */}
                    <motion.span
                      key={`${trail.id}-${match.level}`}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider border ${match.bg} ${match.text} ${match.border}`}
                    >
                      {match.icon}
                      {match.label}
                    </motion.span>
                  </div>

                  {/* Match Bar - Field Instrument Gauge */}
                  <div className="mt-5">
                    <div className="h-2 rounded-none bg-stone-200 overflow-hidden border border-stone-border">
                      <motion.div
                        key={`${trail.id}-bar-${match.percent}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${match.percent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full ${match.barColor}`}
                      />
                    </div>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-stone">
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
            className="group flex flex-col items-center justify-center w-[140px] h-full min-h-[140px] p-5 rounded-sm bg-stone-light border border-stone-border hover:border-action-orange/30 hover:shadow-[3px_3px_0_0_var(--color-action-orange)] transition-all duration-200 flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-sm bg-white border border-stone-border flex items-center justify-center group-hover:border-action-orange/30 group-hover:bg-action-orange/10 transition-all shadow-[2px_2px_0_0_var(--color-stone-border)]">
              <ChevronRight className="h-5 w-5 text-muted-stone group-hover:text-action-orange transition-colors" />
            </div>
            <span className="mt-3 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-stone group-hover:text-deep-stone transition-colors text-center">
              View all trails
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
