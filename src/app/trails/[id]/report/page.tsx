'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, X, AlertCircle, CheckCircle2, AlertTriangle, XCircle, FileText, Camera, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ImageUpload, ImageFile } from '@/components/intel/ImageUpload';
import { submitFieldReport, type ReportState } from '@/app/intel/actions';
import { trailService } from '@/services/trailService';
import { Trail, Status, Confidence, VEHICLE_CATEGORIES, VehicleCategoryInfo } from '@/types';
import { useVehicle } from '@/contexts/VehicleContext';
import { toast } from 'sonner';
import { useUploadThing } from '@/lib/uploadthing';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

// Viewfinder corners for tactical aesthetic
function ViewfinderCorners({ color = 'border-action-orange' }: { color?: string }) {
  return (
    <>
      <span className={`absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 ${color}`} />
      <span className={`absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 ${color}`} />
      <span className={`absolute left-0 bottom-0 h-6 w-6 border-l-2 border-b-2 ${color}`} />
      <span className={`absolute right-0 bottom-0 h-6 w-6 border-r-2 border-b-2 ${color}`} />
    </>
  );
}

// Status option configuration
const STATUS_OPTIONS: { value: Status; label: string; description: string; icon: typeof CheckCircle2; color: string }[] = [
  {
    value: 'clear',
    label: 'PASSABLE',
    description: 'Trail is clear and accessible',
    icon: CheckCircle2,
    color: 'text-emerald-600 border-emerald-600 bg-emerald-50',
  },
  {
    value: 'rough',
    label: 'CHALLENGING',
    description: 'Proceed with caution',
    icon: AlertTriangle,
    color: 'text-amber-600 border-amber-600 bg-amber-50',
  },
  {
    value: 'impassable',
    label: 'NOT PASSABLE',
    description: 'Trail is blocked or unsafe',
    icon: XCircle,
    color: 'text-red-600 border-red-600 bg-red-50',
  },
];

// Confidence option configuration
const CONFIDENCE_OPTIONS: { value: Confidence; label: string; description: string; icon: typeof Shield }[] = [
  {
    value: 'low',
    label: 'LOW',
    description: 'Significant effort/spotting required',
    icon: ShieldAlert,
  },
  {
    value: 'medium',
    label: 'MED',
    description: 'Standard trail obstacles; no major issues',
    icon: Shield,
  },
  {
    value: 'high',
    label: 'HIGH',
    description: 'Easy transit; high confidence in rating',
    icon: ShieldCheck,
  },
];

function rigTierToVehicleType(tier?: string) {
  if (tier === 'highClearance4x4') return 'stockSUV_IFS';
  if (tier === 'modified4x4') return 'lifted4x4_solidAxle';
  if (tier === 'extremeBuild') return 'lifted4x4_IFS';
  return 'stockSUV_solidAxle';
}

export default function FieldReportPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const trailId = params.id as string;
  const { selectedVehicle } = useVehicle();

  const [trail, setTrail] = useState<Trail | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategoryInfo | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth guard — reports require a signed-in user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace(`/auth/login?next=/trails/${trailId}/report`);
      } else {
        setAuthChecked(true);
      }
    });
  }, [supabase, router, trailId]);

  // Load trail data and set default vehicle from context
  useEffect(() => {
    async function loadTrail() {
      setIsLoading(true);
      try {
        const trailData = await trailService.getTrail(trailId);
        if (!trailData) {
          router.push('/trails');
          return;
        }
        setTrail(trailData);
      } catch (err) {
        console.error('Failed to load trail:', err);
        setError('FAILED TO LOAD TRAIL DATA');
      } finally {
        setIsLoading(false);
      }
    }
    loadTrail();
  }, [trailId, router]);

  // Pre-select vehicle from context/profile if available
  useEffect(() => {
    const hydrateVehicle = async () => {
      if (selectedVehicle && !vehicleCategory) {
        const category = VEHICLE_CATEGORIES.find(c => c.mappedType === selectedVehicle);
        if (category) {
          setVehicleCategory(category);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user?.id) return;

      const res = await fetch(`/api/planner/vehicles?userId=${session.user.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      const rigTier = json?.data?.[0]?.rig_tier as string | undefined;
      const mappedType = rigTierToVehicleType(rigTier);
      const category = VEHICLE_CATEGORIES.find(c => c.mappedType === mappedType);
      if (category) setVehicleCategory(category);
    };

    void hydrateVehicle();
  }, [selectedVehicle, vehicleCategory, supabase]);

  const handleImagesChange = useCallback((newImages: ImageFile[]) => {
    setImages(newImages);
  }, []);

  const { startUpload } = useUploadThing('trailPhoto');

  const handleSubmit = async () => {
    // Validate required fields
    if (!status) {
      setError('SELECT A TRAIL STATUS');
      return;
    }
    if (!vehicleCategory) {
      setError('SELECT YOUR VEHICLE TYPE');
      return;
    }
    if (!confidence) {
      setError('SELECT YOUR CONFIDENCE LEVEL');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload images via UploadThing if any are attached
      let photoData: { url: string; caption: string | null }[] = [];

      if (images.length > 0) {
        setImages(prev => prev.map(img => ({ ...img, status: 'uploading' as const, progress: 0 })));

        const filesToUpload = images.map(img => img.file);
        const uploadResults = await startUpload(filesToUpload);

        if (!uploadResults) {
          setError('PHOTO UPLOAD FAILED — TRY AGAIN');
          setImages(prev => prev.map(img => ({ ...img, status: 'error' as const })));
          setIsSubmitting(false);
          return;
        }

        // Map uploaded URLs back to their captions
        photoData = uploadResults.map((result, idx) => ({
          url: result.ufsUrl,
          caption: images[idx]?.caption || null,
        }));

        setImages(prev => prev.map(img => ({ ...img, status: 'complete' as const, progress: 100 })));
      }

      // Submit report + photo URLs to server action
      const result: ReportState = await submitFieldReport({
        trailId,
        status,
        vehicleType: vehicleCategory.mappedType,
        confidence,
        notes: notes.trim() || undefined,
        photos: photoData.length > 0 ? photoData : undefined,
      });

      if (result.status === 'success') {
        toast.success('FIELD REPORT LOGGED', {
          description: result.message,
        });
        router.push(`/trails/${trailId}?refresh=${Date.now()}`);
      } else {
        setError(result.message);
        setImages(prev => prev.map(img => ({ ...img, status: 'error' as const })));
      }
    } catch (err) {
      console.error('Submit failed:', err);
      setError('TRANSMISSION FAILED - TRY AGAIN');
      setImages(prev => prev.map(img => ({ ...img, status: 'error' as const })));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authChecked || isLoading) {
    return <LoadingSkeleton />;
  }

  if (!trail) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-stone-50/90 border-b border-stone-800"
      >
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <Link
              href={`/trails/${trailId}`}
              className="flex items-center gap-2 text-stone-700 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-mono text-xs uppercase tracking-wider">Cancel</span>
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-action-orange" />
              <span className="font-mono text-xs uppercase tracking-wider text-stone-900">
                FIELD REPORT
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-4 max-w-2xl py-8">
        {/* Trail Name Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mb-8 p-6 border border-stone-800 bg-stone-100"
        >
          <ViewfinderCorners />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]" />

          <div className="relative z-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-action-orange mb-2">
              CONDITION REPORT
            </p>
            <h1 className="font-mono text-2xl md:text-3xl font-black uppercase tracking-wider text-stone-900 mb-2">
              {trail.name}
            </h1>
            <p className="font-mono text-xs uppercase tracking-wider text-stone-700">
              {trail.region}
            </p>
          </div>
        </motion.div>

        {/* Status Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mb-6 p-6 border border-stone-800 bg-stone-100"
        >
          <ViewfinderCorners color="border-stone-400" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]" />

          <div className="relative z-10">
            <h2 className="font-mono text-sm uppercase tracking-wider text-stone-900 font-semibold mb-4">
              Trail Status <span className="text-action-orange">*</span>
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {STATUS_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`relative flex items-center gap-4 p-4 border-2 transition-all ${
                      isSelected
                        ? option.color
                        : 'border-stone-300 bg-stone-50 hover:border-stone-400'
                    }`}
                  >
                    <Icon className={`h-6 w-6 flex-shrink-0 ${isSelected ? '' : 'text-stone-400'}`} />
                    <div className="text-left">
                      <p className={`font-mono text-sm uppercase tracking-wider font-semibold ${isSelected ? '' : 'text-stone-700'}`}>
                        {option.label}
                      </p>
                      <p className={`font-mono text-[10px] uppercase tracking-wider ${isSelected ? 'opacity-80' : 'text-stone-500'}`}>
                        {option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="h-5 w-5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Vehicle Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative mb-6 p-6 border border-stone-800 bg-stone-100"
        >
          <ViewfinderCorners color="border-stone-400" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]" />

          <div className="relative z-10">
            <h2 className="font-mono text-sm uppercase tracking-wider text-stone-900 font-semibold mb-4">
              Your Vehicle <span className="text-action-orange">*</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {VEHICLE_CATEGORIES.map((category) => {
                const isSelected = vehicleCategory?.id === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setVehicleCategory(category)}
                    className={`relative flex flex-col items-center gap-2 p-4 border-2 transition-all ${
                      isSelected
                        ? 'border-action-orange bg-action-orange/5'
                        : 'border-stone-300 bg-stone-50 hover:border-stone-400'
                    }`}
                  >
                    <div className={`text-2xl ${isSelected ? 'opacity-100' : 'opacity-60'}`}>
                      {category.icon === 'crossover' && '🚗'}
                      {category.icon === 'truck' && '🛻'}
                      {category.icon === 'lifted' && '🚙'}
                      {category.icon === 'crawler' && '🏎️'}
                    </div>
                    <div className="text-center">
                      <p className={`font-mono text-xs uppercase tracking-wider font-semibold ${isSelected ? 'text-action-orange' : 'text-stone-700'}`}>
                        {category.shortName}
                      </p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-stone-500 mt-1 line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="absolute right-2 top-2">
                        <CheckCircle2 className="h-4 w-4 text-action-orange" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Report Confidence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="relative mb-6 p-6 border border-stone-800 bg-stone-100"
        >
          <ViewfinderCorners color="border-stone-400" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]" />

          <div className="relative z-10">
            <h2 className="font-mono text-sm uppercase tracking-wider text-stone-900 font-semibold mb-4">
              Report Confidence <span className="text-action-orange">*</span>
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {CONFIDENCE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = confidence === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setConfidence(option.value)}
                    className={`relative flex flex-col items-center gap-2 p-4 border-2 transition-all ${
                      isSelected
                        ? 'border-action-orange bg-action-orange/5'
                        : 'border-stone-300 bg-stone-50 hover:border-stone-400'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isSelected ? 'text-action-orange' : 'text-stone-400'}`} />
                    <div className="text-center">
                      <p className={`font-mono text-xs uppercase tracking-wider font-semibold ${isSelected ? 'text-action-orange' : 'text-stone-700'}`}>
                        {option.label}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="absolute right-2 top-2">
                        <CheckCircle2 className="h-4 w-4 text-action-orange" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Description below selection */}
            {confidence && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-stone-600 text-center">
                {CONFIDENCE_OPTIONS.find(o => o.value === confidence)?.description}
              </p>
            )}
          </div>
        </motion.div>

        {/* Condition Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative mb-6 p-6 border border-stone-800 bg-stone-100"
        >
          <ViewfinderCorners color="border-stone-400" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]" />

          <div className="relative z-10">
            <h2 className="font-mono text-sm uppercase tracking-wider text-stone-900 font-semibold mb-4">
              Field Notes
            </h2>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe current conditions, obstacles, water crossings, etc..."
              rows={4}
              className="w-full bg-stone-50 border border-stone-300 px-4 py-3 font-mono text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-action-orange focus:ring-1 focus:ring-action-orange resize-none"
            />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-stone-500">
              {notes.length}/500 characters
            </p>
          </div>
        </motion.div>

        {/* Optional Photo Intel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="relative mb-6 p-6 border border-stone-800 bg-stone-100"
        >
          <ViewfinderCorners color="border-stone-400" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:20px_20px]" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="h-5 w-5 text-action-orange" />
              <h2 className="font-mono text-sm uppercase tracking-wider text-stone-900 font-semibold">
                Optional: Attach Photo Intel
              </h2>
            </div>

            <ImageUpload
              images={images}
              onImagesChange={handleImagesChange}
              maxImages={5}
              maxSizeMB={10}
            />
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 flex items-center gap-3 border border-red-800 bg-red-950/10 px-4 py-3"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="font-mono text-xs uppercase tracking-wider text-red-600">
              {error}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex gap-3"
        >
          <Link
            href={`/trails/${trailId}`}
            className="flex-1 flex items-center justify-center gap-2 h-14 border border-stone-800 bg-stone-100 text-stone-900 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-stone-50"
          >
            <X className="h-5 w-5" />
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !status || !vehicleCategory || !confidence}
            className="flex-1 flex items-center justify-center gap-2 h-14 border border-stone-800 bg-stone-900 text-stone-100 font-mono text-xs uppercase tracking-wider transition-colors hover:bg-action-orange disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 border-2 border-stone-100 border-t-transparent rounded-full animate-spin" />
                Transmitting
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Submit Report
              </>
            )}
          </button>
        </motion.div>

        {/* Summary Badge */}
        {(status || images.length > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 border border-stone-800 bg-stone-100 font-mono text-[10px] uppercase tracking-wider text-stone-700">
              <FileText className="h-4 w-4 text-action-orange" />
              {status ? STATUS_OPTIONS.find(s => s.value === status)?.label : 'NO STATUS'}
              {images.length > 0 && ` + ${images.length} PHOTO${images.length !== 1 ? 'S' : ''}`}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-stone-50/90 border-b border-stone-800">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="h-6 w-20 bg-stone-200 animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto px-4 max-w-2xl py-8">
        <div className="h-32 bg-stone-200 border border-stone-300 mb-6 animate-pulse" />
        <div className="h-48 bg-stone-200 border border-stone-300 mb-6 animate-pulse" />
        <div className="h-40 bg-stone-200 border border-stone-300 mb-6 animate-pulse" />
        <div className="h-32 bg-stone-200 border border-stone-300 mb-6 animate-pulse" />
        <div className="h-48 bg-stone-200 border border-stone-300 mb-6 animate-pulse" />
        <div className="flex gap-3">
          <div className="flex-1 h-14 bg-stone-200 border border-stone-300 animate-pulse" />
          <div className="flex-1 h-14 bg-stone-200 border border-stone-300 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
