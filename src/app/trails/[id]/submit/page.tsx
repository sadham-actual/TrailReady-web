'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { trailService } from '@/services/trailService';
import { Trail, Status, Confidence, VEHICLE_CATEGORIES, VehicleCategoryInfo } from '@/types';
import { useVehicle } from '@/contexts/VehicleContext';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XOctagon,
  ChevronDown,
  Loader2,
  Check,
  Car,
  Truck,
  Cog,
  Mountain,
} from 'lucide-react';

// Status card configuration
const STATUS_OPTIONS: {
  value: Status;
  label: string;
  description: string;
  colorClass: string;
  borderClass: string;
  glowClass: string;
  bgClass: string;
  icon: typeof CheckCircle2;
}[] = [
  {
    value: 'clear',
    label: 'Clear',
    description: 'Passable for most vehicles',
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/50',
    glowClass: 'shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]',
    bgClass: 'bg-emerald-500/10',
    icon: CheckCircle2,
  },
  {
    value: 'rough',
    label: 'Rough',
    description: 'Technical/Difficult, proceed with caution',
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/50',
    glowClass: 'shadow-[0_0_40px_-10px_rgba(245,158,11,0.5)]',
    bgClass: 'bg-amber-500/10',
    icon: AlertTriangle,
  },
  {
    value: 'impassable',
    label: 'Impassable',
    description: 'Blocked, washed out, or high risk',
    colorClass: 'text-rose-400',
    borderClass: 'border-rose-500/50',
    glowClass: 'shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)]',
    bgClass: 'bg-rose-500/10',
    icon: XOctagon,
  },
];

// Confidence toggle configuration
const CONFIDENCE_OPTIONS: { value: Confidence; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Med' },
  { value: 'high', label: 'High' },
];

// Vehicle icon component
function VehicleIcon({ icon, className }: { icon: VehicleCategoryInfo['icon']; className?: string }) {
  const iconClass = className || 'h-5 w-5';
  switch (icon) {
    case 'crossover':
      return <Car className={iconClass} />;
    case 'truck':
      return <Truck className={iconClass} />;
    case 'lifted':
      return <Cog className={iconClass} />;
    case 'crawler':
      return <Mountain className={iconClass} />;
  }
}

// Success animation component
function SuccessAnimation({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_60px_-10px_rgba(16,185,129,0.8)]"
        >
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Check className="w-14 h-14 text-slate-950" strokeWidth={3} />
          </motion.div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-slate-50 tracking-tight"
        >
          Report Submitted!
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-slate-400"
        >
          Thank you for helping the community
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export default function SubmitReportPage() {
  const params = useParams();
  const router = useRouter();
  const trailId = params.id as string;
  const { selectedVehicle, setSelectedVehicle } = useVehicle();

  // State
  const [trail, setTrail] = useState<Trail | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  // Form state
  const [status, setStatus] = useState<Status | null>(null);
  const [confidence, setConfidence] = useState<Confidence>('medium');
  const [notes, setNotes] = useState('');

  // Get current vehicle category info
  const currentVehicleCategory = VEHICLE_CATEGORIES.find(
    (cat) => cat.mappedType === selectedVehicle
  );

  // Initialize auth and load trail
  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      try {
        // Initialize auth
        const id = await trailService.getAnonymousUserId();
        setUserId(id);

        // Load trail
        const trailData = await trailService.getTrail(trailId);
        if (!trailData) {
          router.push('/trails');
          return;
        }
        setTrail(trailData);
      } catch (err) {
        setError('Failed to load. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [trailId, router]);

  // Handle form submission
  async function handleSubmit() {
    if (!userId) {
      setError('Authentication required. Please refresh the page.');
      return;
    }

    if (!status) {
      setError('Please select a trail status.');
      return;
    }

    if (!selectedVehicle) {
      setVehicleModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await trailService.submitReport(trailId, userId, {
        status,
        confidence,
        vehicleType: selectedVehicle,
        notes: notes || undefined,
      });

      setShowSuccess(true);
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  }

  // Handle success animation complete
  const handleSuccessComplete = useCallback(() => {
    // Navigate back and force a refresh by adding a cache-busting query
    router.push(`/trails/${trailId}?refresh=${Date.now()}`);
  }, [router, trailId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-slate-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && <SuccessAnimation onComplete={handleSuccessComplete} />}
      </AnimatePresence>

      {/* Main Content */}
      <div className="min-h-screen bg-slate-950">
        {/* Header with Back Button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5"
        >
          <div className="px-4 py-4">
            <Link
              href={`/trails/${trailId}`}
              className="inline-flex items-center gap-3 px-5 py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-white/10 rounded-2xl text-slate-200 font-medium transition-all active:scale-[0.98]"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Trail</span>
            </Link>
          </div>
        </motion.div>

        {/* Content */}
        <div className="px-4 pb-32">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="py-6"
          >
            <h1 className="text-3xl font-bold text-slate-50 tracking-tight mb-1">
              Report Condition
            </h1>
            {trail && (
              <p className="text-slate-400">{trail.name}</p>
            )}
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Cards - The Big Three */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <p className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
              Trail Status
            </p>
            <div className="space-y-4">
              {STATUS_OPTIONS.map((option, index) => {
                const Icon = option.icon;
                const isSelected = status === option.value;

                return (
                  <motion.button
                    key={option.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + index * 0.1 }}
                    onClick={() => setStatus(option.value)}
                    className={`w-full p-6 rounded-3xl border-2 text-left transition-all duration-300 active:scale-[0.98] ${
                      isSelected
                        ? `${option.borderClass} ${option.bgClass} ${option.glowClass}`
                        : 'border-slate-700/50 bg-slate-900/50 hover:border-slate-600/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? `${option.bgClass} ${option.colorClass}`
                            : 'bg-slate-800/50 text-slate-500'
                        }`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-xl font-bold transition-colors ${
                            isSelected ? option.colorClass : 'text-slate-200'
                          }`}
                        >
                          {option.label}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${option.bgClass}`}
                        >
                          <Check className={`w-5 h-5 ${option.colorClass}`} />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Vehicle Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <p className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
              Your Vehicle
            </p>
            <button
              onClick={() => setVehicleModalOpen(true)}
              className="w-full p-5 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-between hover:bg-slate-800/60 transition-all active:scale-[0.98]"
            >
              {currentVehicleCategory ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <VehicleIcon
                      icon={currentVehicleCategory.icon}
                      className="w-6 h-6 text-emerald-400"
                    />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-100">
                      {currentVehicleCategory.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {currentVehicleCategory.description}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                    <Car className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="font-medium text-slate-400">Select your vehicle</p>
                </div>
              )}
              <ChevronDown className="w-5 h-5 text-slate-500" />
            </button>
          </motion.div>

          {/* Confidence Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <p className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
              Confidence
            </p>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex">
              {CONFIDENCE_OPTIONS.map((option) => {
                const isSelected = confidence === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => setConfidence(option.value)}
                    className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all relative ${
                      isSelected
                        ? 'text-slate-50'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="confidence-bg"
                        className="absolute inset-0 bg-slate-700/50 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8"
          >
            <p className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
              Notes (Optional)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Deep mud at the creek crossing, or downed tree at mile 4."
              maxLength={500}
              rows={4}
              className="w-full p-5 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl text-slate-100 placeholder:text-slate-600 resize-none focus:outline-none focus:border-slate-600 transition-colors"
            />
            <p className="text-xs text-slate-600 mt-2 text-right">
              {notes.length}/500
            </p>
          </motion.div>
        </div>

        {/* Sticky Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/90 backdrop-blur-xl border-t border-white/5"
        >
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !status}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${
              status && !isSubmitting
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Report</span>
            )}
          </button>
          <div className="h-safe-bottom" />
        </motion.div>

        {/* Vehicle Selection Modal */}
        <VehicleSelectionModal
          open={vehicleModalOpen}
          onOpenChange={setVehicleModalOpen}
          currentVehicle={selectedVehicle}
          onSelectVehicle={setSelectedVehicle}
        />
      </div>
    </>
  );
}
