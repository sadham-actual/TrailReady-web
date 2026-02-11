'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { trailService } from '@/services/trailService';
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
  getCapabilityLabel
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
  const trailId = params.id as string;
  const refreshKey = searchParams.get('refresh');
  const { selectedVehicle, setSelectedVehicle } = useVehicle();

  const [trail, setTrail] = useState<TrailWithMeta | null>(null);
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);

  // Re-fetch data when trailId changes or when returning from report submission
  useEffect(() => {
    loadTrailData();
  }, [trailId, refreshKey]);

  async function loadTrailData() {
    setIsLoading(true);
    try {
      const [trailData, reportsData] = await Promise.all([
        trailService.getTrail(trailId),
        trailService.getConditionReports(trailId),
      ]);

      if (!trailData) {
        router.push('/trails');
        return;
      }

      setTrail(trailData as TrailWithMeta);
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to load trail:', error);
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

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!trail) {
    return null;
  }

  const currentCategory = VEHICLE_CATEGORIES.find(cat => cat.mappedType === selectedVehicle);

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* Back navigation */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50"
      >
        <div className="container mx-auto px-4 py-3 max-w-3xl">
          <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white hover:bg-slate-800/50 -ml-2">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
            {trail.name}
          </h1>
          <div className="flex items-center gap-3 text-slate-400">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{trail.region}</span>
            {trail.baseDifficulty && (
              <>
                <span className="text-slate-600">•</span>
                <span className="text-sm">Difficulty {trail.baseDifficulty}/4</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Hero Verdict Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
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
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            Capability Matrix
          </h2>
          <CapabilityMatrix
            outcomes={allOutcomes}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(vehicleType) => {
              setSelectedVehicle(vehicleType);
            }}
          />
        </motion.div>

        {/* Recent Reports Section */}
        {reports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-6"
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-400" />
              Recent Reports
              <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs ml-auto">
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
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-6"
          >
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-slate-400 mb-2">About this trail</h3>
              <p className="text-slate-300 text-sm leading-relaxed">
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
        <div className="relative z-10 text-center">
          <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl mb-4">
            <Car className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Select Your Vehicle</h2>
          <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
            Get a personalized risk assessment based on your vehicle&apos;s capabilities
          </p>
          <Button
            onClick={onSelectVehicle}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold"
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
    <div className={`relative overflow-hidden rounded-3xl backdrop-blur-xl border ${borderColor} p-6 md:p-8`}>
      {/* Background gradient */}
      <div className={`absolute inset-0 ${bgGradient}`} />

      {/* Decorative glow */}
      <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${bgGradient.replace('to-br', 'to-r')}`} />

      <div className="relative z-10">
        {/* Top row: Vehicle + Freshness */}
        <div className="flex items-start justify-between mb-6">
          <button
            onClick={onSelectVehicle}
            className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-700/60 backdrop-blur px-3 py-1.5 rounded-full transition-colors"
          >
            <Car className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">{vehicle.shortName}</span>
            <ChevronDown className="h-3 w-3 text-slate-500" />
          </button>

          {reportFreshness && (
            <FreshnessBadge freshness={reportFreshness} />
          )}
        </div>

        {/* Main verdict display */}
        <div className="flex items-start gap-5 mb-6">
          <div className={`flex-shrink-0 p-4 rounded-2xl ${bgGradient} shadow-2xl`}>
            <Icon className="h-10 w-10 md:h-12 md:w-12 text-white" strokeWidth={2.5} />
          </div>

          <div className="flex-1">
            <h2 className={`text-3xl md:text-4xl font-black tracking-tight mb-2 ${textColor}`}>
              {riskLevel}
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {outcome.explanation}
            </p>
          </div>
        </div>

        {/* Success Ratio */}
        {successRatio && successRatio.total > 0 && (
          <div className="bg-slate-800/40 backdrop-blur rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Success Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  {successRatio.successful}
                </span>
                <span className="text-slate-500">of</span>
                <span className="text-2xl font-bold text-white">
                  {successRatio.total}
                </span>
                <span className="text-slate-400 text-sm ml-1">attempts</span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
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
          <div className="flex items-start gap-3 bg-slate-800/40 backdrop-blur rounded-xl p-4">
            <Info className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sky-400 text-sm font-medium mb-1">Baseline Assessment</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Based on trail difficulty rating. No reports within the last 30 days.
              </p>
            </div>
          </div>
        )}

        {/* Inherited verdict indicator - Light Industrial theme */}
        {outcome.inheritedFrom && (
          <div className="flex items-start gap-3 bg-stone-200/50 backdrop-blur rounded-xl p-4">
            <AlertTriangle className="h-5 w-5 text-action-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-action-orange text-sm font-medium mb-1">
                Based on {getCapabilityLabel(outcome.inheritedFrom.capabilityLevel)} Report
              </p>
              <p className="text-deep-stone text-xs leading-relaxed">
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
    <Badge variant="outline" className="border-slate-600 text-slate-400 gap-1.5">
      <Clock className="h-3 w-3" />
      {freshness.ageInDays}d ago
    </Badge>
  );
}

// Capability Matrix Component
function CapabilityMatrix({
  outcomes,
  selectedVehicle,
  onSelectVehicle
}: {
  outcomes: { category: VehicleCategoryInfo; outcome: VehicleOutcome }[];
  selectedVehicle: VehicleType | null;
  onSelectVehicle: (vehicleType: VehicleType) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {outcomes.map(({ category, outcome }) => {
        const isSelected = selectedVehicle === category.mappedType;
        const { Icon, statusColor, statusBg } = getStatusStyles(outcome.status);

        return (
          <motion.button
            key={category.id}
            onClick={() => onSelectVehicle(category.mappedType)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative overflow-hidden rounded-xl p-4 text-left transition-all ${
              isSelected
                ? 'bg-slate-800 border-2 border-slate-600 ring-2 ring-slate-500/30'
                : 'bg-slate-900/50 border border-slate-800/50 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${statusBg}`}>
                <Icon className={`h-4 w-4 ${statusColor}`} />
              </div>
              {isSelected && (
                <Badge className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5">
                  Selected
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-white text-sm mb-1">{category.shortName}</h3>
            <p className={`text-xs font-medium ${statusColor}`}>
              {getStatusLabel(outcome.status)}
            </p>
            {outcome.isBaseline && (
              <p className="text-[10px] text-slate-500 mt-1">Baseline</p>
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

// Reports List Component
function ReportsList({ reports }: { reports: ConditionReport[] }) {
  return (
    <div className="space-y-2">
      {reports.map((report) => {
        const { Icon, statusColor, statusBg } = getStatusStyles(
          report.status === 'clear' ? 'passable' : report.status === 'rough' ? 'high-risk' : 'impassable'
        );

        return (
          <div
            key={report.id}
            className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${statusBg}`}>
                <Icon className={`h-4 w-4 ${statusColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">
                    {report.status === 'clear' ? 'Passable' : report.status === 'rough' ? 'Rough' : 'Impassable'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs text-slate-500">
                    {VEHICLE_TYPE_LABELS[report.vehicleType]}
                  </span>
                </div>
                {report.notes && (
                  <p className="text-sm text-slate-400 line-clamp-2">{report.notes}</p>
                )}
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(report.timestamp)}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                {report.confidence}
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
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-white font-semibold">Navigate to Trailhead</h3>
                <p className="text-slate-400 text-sm">Choose your navigation app</p>
              </div>
              <div className="p-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                  onClick={() => setNavMenuOpen(false)}
                >
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Navigation className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Google Maps</p>
                    <p className="text-slate-400 text-xs">Open in new tab</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                </a>
                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-700/50 transition-colors"
                  onClick={() => setNavMenuOpen(false)}
                >
                  <div className="p-2 bg-slate-500/20 rounded-lg">
                    <MapPin className="h-5 w-5 text-slate-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Apple Maps</p>
                    <p className="text-slate-400 text-xs">Open in new tab</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-500" />
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
        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-800">
          <div className="container mx-auto px-4 py-3 max-w-3xl">
            <div className="flex gap-3">
              <Button
                asChild
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-12"
              >
                <Link href={`/trails/${trailId}/submit`}>
                  <Plus className="h-5 w-5 mr-2" />
                  Report Condition
                </Link>
              </Button>
              <Button
                onClick={() => setNavMenuOpen(!navMenuOpen)}
                variant="outline"
                className="flex-1 border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-white font-semibold h-12"
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
    <div className="min-h-screen bg-slate-950 pb-24">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50">
        <div className="container mx-auto px-4 py-3 max-w-3xl">
          <div className="h-8 w-16 bg-slate-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-3xl pt-6">
        <div className="h-8 w-48 bg-slate-800 rounded mb-2 animate-pulse" />
        <div className="h-4 w-32 bg-slate-800 rounded mb-8 animate-pulse" />
        <div className="h-64 bg-slate-800/50 rounded-3xl mb-6 animate-pulse" />
        <div className="h-40 bg-slate-800/50 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}

// Helper functions
function getVerdictStyles(status: VehicleOutcome['status']) {
  switch (status) {
    case 'passable':
      return {
        riskLevel: 'LOW RISK',
        bgGradient: 'bg-gradient-to-br from-emerald-600/30 to-emerald-800/20',
        borderColor: 'border-emerald-500/40',
        textColor: 'text-emerald-400',
        Icon: CheckCircle2
      };
    case 'baseline':
      return {
        riskLevel: 'BASELINE',
        bgGradient: 'bg-gradient-to-br from-sky-600/30 to-sky-800/20',
        borderColor: 'border-sky-500/40',
        textColor: 'text-sky-400',
        Icon: Info
      };
    case 'high-risk':
      return {
        riskLevel: 'HIGH RISK',
        bgGradient: 'bg-gradient-to-br from-amber-600/30 to-amber-800/20',
        borderColor: 'border-amber-500/40',
        textColor: 'text-amber-400',
        Icon: AlertTriangle
      };
    case 'impassable':
      return {
        riskLevel: 'NOT PASSABLE',
        bgGradient: 'bg-gradient-to-br from-rose-600/30 to-rose-800/20',
        borderColor: 'border-rose-500/40',
        textColor: 'text-rose-400',
        Icon: XCircle
      };
    default:
      return {
        riskLevel: 'UNKNOWN',
        bgGradient: 'bg-gradient-to-br from-slate-600/30 to-slate-800/20',
        borderColor: 'border-slate-500/40',
        textColor: 'text-slate-400',
        Icon: HelpCircle
      };
  }
}

function getStatusStyles(status: VehicleOutcome['status']) {
  switch (status) {
    case 'passable':
      return {
        Icon: CheckCircle2,
        statusColor: 'text-emerald-400',
        statusBg: 'bg-emerald-500/20'
      };
    case 'baseline':
      return {
        Icon: Info,
        statusColor: 'text-sky-400',
        statusBg: 'bg-sky-500/20'
      };
    case 'high-risk':
      return {
        Icon: AlertTriangle,
        statusColor: 'text-amber-400',
        statusBg: 'bg-amber-500/20'
      };
    case 'impassable':
      return {
        Icon: XCircle,
        statusColor: 'text-rose-400',
        statusBg: 'bg-rose-500/20'
      };
    default:
      return {
        Icon: HelpCircle,
        statusColor: 'text-slate-400',
        statusBg: 'bg-slate-500/20'
      };
  }
}

function getStatusLabel(status: VehicleOutcome['status']) {
  switch (status) {
    case 'passable': return 'Low Risk';
    case 'baseline': return 'Baseline';
    case 'high-risk': return 'High Risk';
    case 'impassable': return 'Not Passable';
    default: return 'Unknown';
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
