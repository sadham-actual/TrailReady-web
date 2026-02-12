'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { trailService, TrailPhoto } from '@/services/trailService';
import { PhotoGallery, GalleryPhoto } from '@/components/PhotoGallery';
import { toast } from 'sonner';
import {
  Trail,
  ConditionReport,
  VEHICLE_CATEGORIES,
  VehicleCategoryInfo,
  VehicleType,
  VEHICLE_TYPE_LABELS
} from '@/types';
import {
  getVehicleOutcomeWithFallback,
  VehicleOutcome,
  getReportFreshness,
  getCapabilityLabel,
  calculateWeightedStatus,
  WeightedStatusResult
} from '@/lib/trailOutcome';
import { useVehicle } from '@/contexts/VehicleContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Car,
  Info,
  Navigation,
  FileText,
  Sparkles,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Zap
} from 'lucide-react';

// Extended trail type with API response fields
interface TrailWithMeta extends Trail {
  baseDifficulty?: number;
  reportMeta?: {
    isFresh: boolean;
    isStale: boolean;
    ageInDays: number;
  };
}

export default function TrailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const trailParam = params.id;
  const trailId = Array.isArray(trailParam) ? trailParam[0] : String(trailParam);
  const refreshKey = searchParams.get('refresh');
  const { selectedVehicle, setSelectedVehicle } = useVehicle();

  const [trail, setTrail] = useState<TrailWithMeta | null>(null);
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [photos, setPhotos] = useState<TrailPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);

  // Re-fetch data when trailId changes or when returning from report submission
  useEffect(() => {
    loadTrailData();
  }, [trailId, refreshKey]);

  const handleTrailUnavailable = () => {
    toast.error('Trail Intel Unavailable');
    router.replace('/map');
  };

  async function loadTrailData() {
    setIsLoading(true);
    try {
      const [trailData, reportsData, photosData] = await Promise.all([
        trailService.getTrail(trailId),
        trailService.getConditionReports(trailId),
        trailService.getTrailPhotos(trailId),
      ]);

      if (!trailData) {
        handleTrailUnavailable();
        return;
      }

      setTrail(trailData as TrailWithMeta);
      setReports(reportsData);
      setPhotos(photosData);
    } catch {
      handleTrailUnavailable();
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate outcome for selected vehicle
  const selectedOutcome = useMemo(() => {
    if (!selectedVehicle) return null;
    return getVehicleOutcomeWithFallback(reports, selectedVehicle, trail?.baseDifficulty);
  }, [reports, selectedVehicle, trail?.baseDifficulty]);

  // Calculate outcomes for all vehicle categories
  const allOutcomes = useMemo(() => {
    return VEHICLE_CATEGORIES.map(category => ({
      category,
      outcome: getVehicleOutcomeWithFallback(reports, category.mappedType, trail?.baseDifficulty)
    }));
  }, [reports, trail?.baseDifficulty]);

  // Calculate success ratio for selected vehicle
  const successRatio = useMemo(() => {
    if (!selectedVehicle) return null;
    const vehicleReports = reports.filter(r => r.vehicleType === selectedVehicle);
    const successful = vehicleReports.filter(r => r.status === 'clear').length;
    const total = vehicleReports.length;
    return { successful, total };
  }, [reports, selectedVehicle]);

  // Report freshness
  const reportFreshness = useMemo(() => {
    if (reports.length === 0) return null;
    const mostRecent = reports.reduce((latest, r) => {
      const rTime = new Date(r.timestamp).getTime();
      return rTime > latest ? rTime : latest;
    }, 0);
    return getReportFreshness(new Date(mostRecent));
  }, [reports]);

  // Weighted overall trail status (uses last 5 reports)
  const weightedStatus = useMemo(() => {
    return calculateWeightedStatus(reports);
  }, [reports]);

  const galleryPhotos = useMemo<GalleryPhoto[]>(
    () =>
      photos.map((photo) => ({
        id: photo.id,
        url: photo.url,
        vehicleType: photo.report?.vehicleType ?? 'UNKNOWN',
        timestamp: photo.report?.createdAt ?? photo.createdAt,
        fieldNotes: photo.report?.notes ?? undefined,
        confidence: photo.report?.confidence,
      })),
    [photos]
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!trail) {
    return null;
  }

  const currentCategory = VEHICLE_CATEGORIES.find(cat => cat.mappedType === selectedVehicle);

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* Back navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-stone-50/90 border-b border-stone-800"
      >
        <div className="container mx-auto px-4 py-3 max-w-3xl">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-stone-700 hover:text-stone-900 hover:bg-stone-100 -ml-2"
          >
            <Link href="/trails">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 max-w-3xl">
        {/* Trail Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="pt-6 pb-4"
        >
          <h1 className="text-2xl md:text-3xl font-bold font-mono uppercase tracking-wider text-stone-900 mb-2">
            {trail.name}
          </h1>
          <div className="flex items-center gap-3 text-stone-700 font-mono uppercase tracking-wider text-xs">
            <MapPin className="h-4 w-4" />
            <span>{trail.region}</span>
            {trail.baseDifficulty && (
              <>
                <span className="text-stone-400">•</span>
                <span>Difficulty {trail.baseDifficulty}/4</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Overall Trail Status - Weighted Algorithm */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-6"
        >
          <OverallStatusCard
            weightedStatus={weightedStatus}
            reportCount={reports.length}
          />
        </motion.div>

        {/* Hero Verdict Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mb-6"
        >
          <VerdictHeroCard
            outcome={selectedOutcome}
            vehicle={currentCategory}
            successRatio={successRatio}
            reportFreshness={reportFreshness}
            onSelectVehicle={() => setVehicleModalOpen(true)}
          />
        </motion.div>

        {/* Capability Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold font-mono uppercase tracking-wider text-stone-900 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-action-orange" />
            Capability Matrix
          </h2>
          <CapabilityMatrix
            outcomes={allOutcomes}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(vehicleType) => {
              setSelectedVehicle(vehicleType);
            }}
            recentHighConfidenceVehicles={weightedStatus.recentHighConfidenceVehicles}
          />
        </motion.div>

        {/* Photo Intel Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold font-mono uppercase tracking-wider text-stone-900 mb-4">
            Photo Intel
          </h2>
          <PhotoGallery photos={galleryPhotos} />
        </motion.div>

        {/* Recent Reports Section */}
        {reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mb-6"
          >
            <h2 className="text-lg font-semibold font-mono uppercase tracking-wider text-stone-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-stone-700" />
              Recent Reports
              <Badge variant="secondary" className="bg-stone-100 text-stone-700 text-xs ml-auto">
                {reports.length} total
              </Badge>
            </h2>
            <ReportsList reports={reports.slice(0, 5)} />
          </motion.div>
        )}

        {/* Description if exists */}
        {trail.description && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mb-6"
          >
            <div className="bg-stone-100 border border-stone-800 rounded-none p-5">
              <h3 className="text-sm font-mono uppercase tracking-wider text-stone-900 mb-2">About this trail</h3>
              <p className="text-stone-700 text-sm leading-relaxed">
                {trail.description}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sticky Navigation Footer */}
      <NavigationFooter
        trail={trail}
        navMenuOpen={navMenuOpen}
        setNavMenuOpen={setNavMenuOpen}
      />

      <VehicleSelectionModal
        open={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
        currentVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
      />
    </div>
  );
}

// Hero Verdict Card Component
function VerdictHeroCard({
  outcome,
  vehicle,
  successRatio,
  reportFreshness,
  onSelectVehicle
}: {
  outcome: VehicleOutcome | null;
  vehicle: VehicleCategoryInfo | undefined;
  successRatio: { successful: number; total: number } | null;
  reportFreshness: { isFresh: boolean; isStale: boolean; ageInDays: number } | null;
  onSelectVehicle: () => void;
}) {
  // No vehicle selected
  if (!outcome || !vehicle) {
    return (
      <div className="relative overflow-hidden rounded-none bg-stone-100 border border-stone-800 p-8">
        <div className="relative z-10 text-center">
          <div className="inline-flex p-4 bg-stone-50 border border-stone-800 rounded-none mb-4">
            <Car className="h-8 w-8 text-action-orange" />
          </div>
          <h2 className="text-xl font-bold font-mono uppercase tracking-wider text-stone-900 mb-2">
            Select Your Vehicle
          </h2>
          <p className="text-stone-700 text-sm mb-6 max-w-sm mx-auto">
            Get a personalized risk assessment based on your vehicle&apos;s capabilities
          </p>
          <Button
            onClick={onSelectVehicle}
            className="bg-stone-100 hover:bg-stone-50 text-action-orange border border-stone-800 rounded-none font-mono uppercase tracking-wider font-semibold"
          >
            <Car className="h-4 w-4 mr-2" />
            Choose Vehicle
          </Button>
        </div>
      </div>
    );
  }

  const { riskLevel, bgGradient, borderColor, textColor, Icon } = getVerdictStyles(outcome.status);

  return (
    <div className="relative overflow-hidden rounded-none bg-stone-100 border border-stone-800 p-6 md:p-8">

      <div className="relative z-10">
        {/* Top row: Vehicle + Freshness */}
        <div className="flex items-start justify-between mb-6">
          <button
            onClick={onSelectVehicle}
            className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-800 px-3 py-1.5 rounded-none transition-colors"
          >
            <Car className="h-4 w-4 text-action-orange" />
            <span className="text-sm font-mono uppercase tracking-wider text-stone-900">
              {vehicle.shortName}
            </span>
            <ChevronDown className="h-3 w-3 text-stone-700" />
          </button>

          {reportFreshness && (
            <FreshnessBadge freshness={reportFreshness} />
          )}
        </div>

        {/* Main verdict display */}
        <div className="flex items-start gap-5 mb-6">
          <div className="flex-shrink-0 p-4 rounded-none bg-stone-50 border border-stone-800 shadow-sm">
            <Icon className="h-10 w-10 md:h-12 md:w-12 text-action-orange" strokeWidth={2.5} />
          </div>

          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-black font-mono uppercase tracking-wider text-stone-900 mb-2">
              {riskLevel}
            </h2>
            <p className="text-stone-700 text-sm leading-relaxed">
              {outcome.explanation}
            </p>
          </div>
        </div>

        {/* Success Ratio */}
        {successRatio && successRatio.total > 0 && (
          <div className="bg-stone-50 border border-stone-800 rounded-none p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-stone-700 text-sm font-mono uppercase tracking-wider">Success Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-stone-900">
                  {successRatio.successful}
                </span>
                <span className="text-stone-500">of</span>
                <span className="text-2xl font-bold text-stone-900">
                  {successRatio.total}
                </span>
                <span className="text-stone-700 text-sm ml-1">attempts</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-stone-100 border border-stone-800 rounded-none overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(successRatio.successful / successRatio.total) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={`h-full ${outcome.status === 'passable' || outcome.status === 'baseline' ? 'bg-emerald-500' : outcome.status === 'high-risk' ? 'bg-amber-500' : 'bg-rose-500'}`}
              />
            </div>
          </div>
        )}

        {/* Baseline indicator */}
        {outcome.isBaseline && (
          <div className="flex items-start gap-3 bg-stone-50 border border-stone-800 rounded-none p-4">
            <Info className="h-5 w-5 text-action-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-stone-900 text-sm font-mono uppercase tracking-wider mb-1">
                Baseline Assessment
              </p>
              <p className="text-stone-700 text-xs leading-relaxed">
                Based on trail difficulty rating. No reports within the last 30 days.
              </p>
            </div>
          </div>
        )}

        {/* Inherited verdict indicator - Light Industrial theme */}
        {outcome.inheritedFrom && (
          <div className="flex items-start gap-3 bg-stone-100 border border-stone-800 rounded-none p-4">
            <AlertTriangle className="h-5 w-5 text-action-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-action-orange text-sm font-mono uppercase tracking-wider mb-1">
                Based on {getCapabilityLabel(outcome.inheritedFrom.capabilityLevel)} Report
              </p>
              <p className="text-stone-700 text-xs leading-relaxed">
                A higher-capability vehicle reported this trail as not passable{' '}
                {formatRelativeTime(outcome.inheritedFrom.reportTimestamp)}.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Freshness Badge Component
function FreshnessBadge({ freshness }: { freshness: { isFresh: boolean; isStale: boolean; ageInDays: number } }) {
  if (freshness.isFresh) {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 gap-1.5">
        <Sparkles className="h-3 w-3" />
        Fresh ({freshness.ageInDays}d)
      </Badge>
    );
  }
  if (freshness.isStale) {
    return (
      <Badge variant="outline" className="border-amber-500/30 text-amber-400 gap-1.5">
        <AlertCircle className="h-3 w-3" />
        {freshness.ageInDays}d old
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-stone-800 text-stone-700 gap-1.5">
      <Clock className="h-3 w-3" />
      {freshness.ageInDays}d ago
    </Badge>
  );
}

// Overall Trail Status Component - Weighted Algorithm
function OverallStatusCard({
  weightedStatus,
  reportCount
}: {
  weightedStatus: WeightedStatusResult;
  reportCount: number;
}) {
  // No reports
  if (reportCount === 0) {
    return (
      <div className="relative overflow-hidden rounded-none bg-stone-100 border border-stone-800 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-stone-50 border border-stone-800 rounded-none">
            <HelpCircle className="h-8 w-8 text-stone-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-mono uppercase tracking-wider text-stone-400 mb-1">
              NO DATA
            </h2>
            <p className="text-stone-600 text-sm">
              No condition reports submitted yet. Be the first to report!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get status-specific styles
  const getStatusStyles = () => {
    switch (weightedStatus.status) {
      case 'passable':
        return {
          bgClass: 'bg-emerald-500/10',
          borderClass: 'border-emerald-600',
          textClass: 'text-emerald-600',
          Icon: CheckCircle2,
        };
      case 'high-risk':
        return {
          bgClass: 'bg-amber-500/10',
          borderClass: 'border-amber-600',
          textClass: 'text-amber-600',
          Icon: AlertTriangle,
        };
      case 'impassable':
        return {
          bgClass: 'bg-rose-500/10',
          borderClass: 'border-rose-600',
          textClass: 'text-rose-600',
          Icon: XCircle,
        };
      default:
        return {
          bgClass: 'bg-stone-100',
          borderClass: 'border-stone-400',
          textClass: 'text-stone-600',
          Icon: HelpCircle,
        };
    }
  };

  const styles = getStatusStyles();
  const StatusIcon = styles.Icon;

  return (
    <div className={`relative overflow-hidden rounded-none ${styles.bgClass} border-2 ${styles.borderClass} p-6`}>
      {/* Main Status Display */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 bg-white/80 border ${styles.borderClass} rounded-none`}>
          <StatusIcon className={`h-10 w-10 ${styles.textClass}`} strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h2 className={`text-3xl md:text-4xl font-black font-mono uppercase tracking-wider ${styles.textClass}`}>
            {weightedStatus.label}
          </h2>
          <p className="text-stone-600 text-sm font-mono uppercase tracking-wider">
            Based on {reportCount} report{reportCount !== 1 ? 's' : ''} • Weighted by confidence & recency
          </p>
        </div>
      </div>

      {/* Conflicting Intel Warning */}
      {weightedStatus.hasMixedReports && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-amber-500/20 border border-amber-500 rounded-none p-4"
        >
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-700 text-sm font-mono uppercase tracking-wider font-semibold mb-1">
              CAUTION: CONFLICTING INTEL
            </p>
            <p className="text-amber-700 text-xs leading-relaxed">
              {weightedStatus.mixedReportReason || 'Recent reports show conflicting conditions. Exercise extra caution.'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Weight Distribution Bar */}
      {weightedStatus.totalWeight > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-600">Status Distribution</span>
          </div>
          <div className="h-3 bg-stone-200 border border-stone-300 rounded-none overflow-hidden flex">
            {weightedStatus.statusWeights.clear > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(weightedStatus.statusWeights.clear / weightedStatus.totalWeight) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-full bg-emerald-500"
              />
            )}
            {weightedStatus.statusWeights.rough > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(weightedStatus.statusWeights.rough / weightedStatus.totalWeight) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="h-full bg-amber-500"
              />
            )}
            {weightedStatus.statusWeights.impassable > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(weightedStatus.statusWeights.impassable / weightedStatus.totalWeight) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="h-full bg-rose-500"
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] font-mono uppercase tracking-wider font-semibold">
            {weightedStatus.statusWeights.clear > 0 && (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 bg-emerald-500" />
                Passable
              </span>
            )}
            {weightedStatus.statusWeights.rough > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2 h-2 bg-amber-500" />
                Challenging
              </span>
            )}
            {weightedStatus.statusWeights.impassable > 0 && (
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-2 h-2 bg-rose-500" />
                Not Passable
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Capability Matrix Component
function CapabilityMatrix({
  outcomes,
  selectedVehicle,
  onSelectVehicle,
  recentHighConfidenceVehicles = []
}: {
  outcomes: { category: VehicleCategoryInfo; outcome: VehicleOutcome }[];
  selectedVehicle: VehicleType | null;
  onSelectVehicle: (vehicleType: VehicleType) => void;
  recentHighConfidenceVehicles?: { vehicleType: VehicleType; status: string; timestamp: string }[];
}) {
  // Create a set of vehicle types with recent High or Medium confidence reports
  // These are highlighted in the matrix to show which vehicles have reported recently
  const verifiedVehicles = new Set(
    recentHighConfidenceVehicles.map(v => v.vehicleType)
  );

  return (
    <div className="grid grid-cols-2 gap-3">
      {outcomes.map(({ category, outcome }) => {
        const isSelected = selectedVehicle === category.mappedType;
        const isVerified = verifiedVehicles.has(category.mappedType);
        const { Icon, statusColor, statusBg } = getStatusStyles(outcome.status);

        return (
          <motion.button
            key={category.id}
            onClick={() => onSelectVehicle(category.mappedType)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-none p-4 text-left transition-all ${
              isSelected
                ? 'bg-stone-100 border-2 border-stone-800 ring-2 ring-action-orange/20'
                : isVerified
                  ? 'bg-sky-50 border-2 border-sky-400 hover:border-sky-500'
                  : 'bg-stone-100 border border-stone-800 hover:border-stone-900'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-none border border-stone-800 ${statusBg}`}>
                <Icon className={`h-4 w-4 ${statusColor}`} />
              </div>
              <div className="flex flex-col items-end gap-1">
                {isSelected && (
                  <Badge className="bg-stone-50 border border-stone-800 text-stone-900 text-[10px] px-1.5 py-0.5">
                    Selected
                  </Badge>
                )}
                {isVerified && (
                  <Badge className="bg-sky-100 border border-sky-500 text-sky-700 text-[10px] px-1.5 py-0.5 gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    Recent Intel
                  </Badge>
                )}
              </div>
            </div>
            <h3 className="font-semibold font-mono uppercase tracking-wider text-stone-900 text-sm mb-1">
              {category.shortName}
            </h3>
            <p className={`text-xs font-mono uppercase tracking-wider font-semibold ${
              outcome.status === 'passable' ? 'text-emerald-600' :
              outcome.status === 'high-risk' ? 'text-amber-600' :
              outcome.status === 'impassable' ? 'text-rose-600' :
              outcome.status === 'baseline' ? 'text-sky-600' : 'text-stone-500'
            }`}>
              {getStatusLabel(outcome.status)}
            </p>
            {outcome.isBaseline && (
              <p className="text-[10px] text-stone-700 mt-1">Baseline</p>
            )}
            {outcome.inheritedFrom && (
              <p className="text-[10px] text-action-orange mt-1">Inherited</p>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// Reliability badge helper
function getReliabilityBadge(status: string, confidence: string) {
  // High confidence + Passable = VERIFIED (green)
  if (confidence === 'high' && status === 'clear') {
    return {
      label: 'VERIFIED',
      className: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/40'
    };
  }
  // High confidence + any status = RELIABLE
  if (confidence === 'high') {
    return {
      label: 'RELIABLE',
      className: 'bg-sky-500/20 text-sky-600 border-sky-500/40'
    };
  }
  // Medium confidence
  if (confidence === 'medium') {
    return {
      label: 'STANDARD',
      className: 'bg-stone-200 text-stone-600 border-stone-300'
    };
  }
  // Low confidence
  return {
    label: 'UNVERIFIED',
    className: 'bg-amber-500/20 text-amber-600 border-amber-500/40'
  };
}

// Reports List Component
function ReportsList({ reports }: { reports: ConditionReport[] }) {
  return (
    <div className="space-y-2">
      {reports.map((report) => {
        const { Icon, statusColor, statusBg } = getStatusStyles(
          report.status === 'clear' ? 'passable' : report.status === 'rough' ? 'high-risk' : 'impassable'
        );
        const reliability = getReliabilityBadge(report.status, report.confidence);

        return (
          <div key={report.id} className="bg-stone-100 border border-stone-800 rounded-none p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-none border border-stone-800 ${statusBg}`}>
                <Icon className={`h-4 w-4 ${statusColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-semibold font-mono uppercase tracking-wider ${
                    report.status === 'clear' ? 'text-emerald-600' :
                    report.status === 'rough' ? 'text-amber-600' : 'text-rose-600'
                  }`}>
                    {report.status === 'clear' ? 'PASSABLE' : report.status === 'rough' ? 'CHALLENGING' : 'NOT PASSABLE'}
                  </span>
                  <span className="text-stone-400">•</span>
                  <span className="text-xs text-stone-700">
                    {VEHICLE_TYPE_LABELS[report.vehicleType]}
                  </span>
                </div>
                {report.notes && (
                  <p className="text-sm text-stone-700 line-clamp-2">{report.notes}</p>
                )}
                <p className="text-xs text-stone-700 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(report.timestamp)}
                </p>
              </div>
              <Badge variant="outline" className={`text-[10px] font-mono uppercase tracking-wider ${reliability.className}`}>
                {reliability.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Navigation Footer Component
function NavigationFooter({
  trail,
  navMenuOpen,
  setNavMenuOpen
}: {
  trail: TrailWithMeta;
  navMenuOpen: boolean;
  setNavMenuOpen: (open: boolean) => void;
}) {
  const params = useParams();
  const trailId = params.id as string;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${trail.latitude},${trail.longitude}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${trail.latitude},${trail.longitude}`;

  return (
    <>
      {/* Overlay for nav menu */}
      <AnimatePresence>
        {navMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setNavMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Navigation Menu Popup */}
      <AnimatePresence>
        {navMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-4 right-4 z-50 max-w-3xl mx-auto"
          >
            <div className="bg-stone-50 border border-stone-800 rounded-none overflow-hidden shadow-sm">
              <div className="p-4 border-b border-stone-800">
                <h3 className="text-stone-900 font-mono uppercase tracking-wider font-semibold">
                  Navigate to Trailhead
                </h3>
                <p className="text-stone-700 text-sm">Choose your navigation app</p>
              </div>
              <div className="p-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-none hover:bg-stone-100 transition-colors"
                  onClick={() => setNavMenuOpen(false)}
                >
                  <div className="p-2 bg-stone-100 border border-stone-800 rounded-none">
                    <Navigation className="h-5 w-5 text-action-orange" />
                  </div>
                  <div className="flex-1">
                    <p className="text-stone-900 font-mono uppercase tracking-wider font-medium">Google Maps</p>
                    <p className="text-stone-700 text-xs">Open in new tab</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-stone-700" />
                </a>
                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-none hover:bg-stone-100 transition-colors"
                  onClick={() => setNavMenuOpen(false)}
                >
                  <div className="p-2 bg-stone-100 border border-stone-800 rounded-none">
                    <MapPin className="h-5 w-5 text-action-orange" />
                  </div>
                  <div className="flex-1">
                    <p className="text-stone-900 font-mono uppercase tracking-wider font-medium">Apple Maps</p>
                    <p className="text-stone-700 text-xs">Open in new tab</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-stone-700" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-30"
      >
        <div className="bg-stone-50 backdrop-blur-xl border-t border-stone-800">
          <div className="container mx-auto px-4 py-3 max-w-3xl">
            <div className="flex gap-3">
              <Button
                asChild
                className="flex-1 bg-stone-100 hover:bg-stone-50 text-action-orange border border-stone-800 rounded-none font-mono uppercase tracking-wider font-semibold h-12"
              >
                <Link href={`/trails/${trailId}/report`}>
                  <Plus className="h-5 w-5 mr-2" />
                  Report Condition
                </Link>
              </Button>
              <Button
                onClick={() => setNavMenuOpen(!navMenuOpen)}
                variant="outline"
                className="flex-1 border-stone-800 bg-stone-100 hover:bg-stone-50 text-stone-900 rounded-none font-mono uppercase tracking-wider font-semibold h-12"
              >
                <Navigation className="h-5 w-5 mr-2" />
                Navigate
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-stone-50/90 border-b border-stone-800">
        <div className="container mx-auto px-4 py-3 max-w-3xl">
          <div className="h-8 w-16 bg-stone-100 border border-stone-800 rounded-none animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-3xl pt-6">
        <div className="h-8 w-48 bg-stone-100 border border-stone-800 rounded-none mb-2 animate-pulse" />
        <div className="h-4 w-32 bg-stone-100 border border-stone-800 rounded-none mb-8 animate-pulse" />
        <div className="h-64 bg-stone-100 border border-stone-800 rounded-none mb-6 animate-pulse" />
        <div className="h-40 bg-stone-100 border border-stone-800 rounded-none animate-pulse" />
      </div>
    </div>
  );
}

// Helper functions
function getVerdictStyles(status: VehicleOutcome['status']) {
  switch (status) {
    case 'passable':
      return {
        riskLevel: 'PASSABLE',
        bgGradient: 'bg-gradient-to-br from-emerald-600/30 to-emerald-800/20',
        borderColor: 'border-emerald-500/40',
        textColor: 'text-emerald-600',
        Icon: CheckCircle2
      };
    case 'baseline':
      return {
        riskLevel: 'BASELINE',
        bgGradient: 'bg-gradient-to-br from-sky-600/30 to-sky-800/20',
        borderColor: 'border-sky-500/40',
        textColor: 'text-sky-600',
        Icon: Info
      };
    case 'high-risk':
      return {
        riskLevel: 'CHALLENGING',
        bgGradient: 'bg-gradient-to-br from-amber-600/30 to-amber-800/20',
        borderColor: 'border-amber-500/40',
        textColor: 'text-amber-600',
        Icon: AlertTriangle
      };
    case 'impassable':
      return {
        riskLevel: 'NOT PASSABLE',
        bgGradient: 'bg-gradient-to-br from-rose-600/30 to-rose-800/20',
        borderColor: 'border-rose-500/40',
        textColor: 'text-rose-600',
        Icon: XCircle
      };
    default:
      return {
        riskLevel: 'UNKNOWN',
        bgGradient: 'bg-gradient-to-br from-slate-600/30 to-slate-800/20',
        borderColor: 'border-slate-500/40',
        textColor: 'text-slate-600',
        Icon: HelpCircle
      };
  }
}

function getStatusStyles(status: VehicleOutcome['status']) {
  switch (status) {
    case 'passable':
      return {
        Icon: CheckCircle2,
        statusColor: 'text-emerald-600',
        statusBg: 'bg-emerald-500/20'
      };
    case 'baseline':
      return {
        Icon: Info,
        statusColor: 'text-sky-600',
        statusBg: 'bg-sky-500/20'
      };
    case 'high-risk':
      return {
        Icon: AlertTriangle,
        statusColor: 'text-amber-600',
        statusBg: 'bg-amber-500/20'
      };
    case 'impassable':
      return {
        Icon: XCircle,
        statusColor: 'text-rose-600',
        statusBg: 'bg-rose-500/20'
      };
    default:
      return {
        Icon: HelpCircle,
        statusColor: 'text-stone-500',
        statusBg: 'bg-stone-500/20'
      };
  }
}

function getStatusLabel(status: VehicleOutcome['status']) {
  switch (status) {
    case 'passable': return 'PASSABLE';
    case 'baseline': return 'BASELINE';
    case 'high-risk': return 'CHALLENGING';
    case 'impassable': return 'NOT PASSABLE';
    default: return 'UNKNOWN';
  }
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}
