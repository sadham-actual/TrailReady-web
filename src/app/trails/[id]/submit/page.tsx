'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trailService } from '@/services/trailService';
import { Trail, Status, Confidence, VehicleType, STATUS_LABELS, CONFIDENCE_LABELS, VEHICLE_TYPE_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function SubmitReportPage() {
  const params = useParams();
  const router = useRouter();
  const trailId = params.id as string;

  const [trail, setTrail] = useState<Trail | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [status, setStatus] = useState<Status | ''>('');
  const [confidence, setConfidence] = useState<Confidence | ''>('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    initializeAuth();
    loadTrail();
  }, [trailId]);

  async function initializeAuth() {
    setIsLoadingAuth(true);
    try {
      const id = await trailService.getAnonymousUserId();
      setUserId(id);
    } catch (err) {
      setError('Failed to authenticate. Please refresh the page.');
    } finally {
      setIsLoadingAuth(false);
    }
  }

  async function loadTrail() {
    try {
      const trailData = await trailService.getTrail(trailId);
      if (!trailData) {
        router.push('/trails');
        return;
      }
      setTrail(trailData);
    } catch (err) {
      setError('Failed to load trail information.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) {
      setError('Authentication required. Please refresh the page.');
      return;
    }

    if (!status || !confidence || !vehicleType) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await trailService.submitReport(trailId, userId, {
        status: status as Status,
        confidence: confidence as Confidence,
        vehicleType: vehicleType as VehicleType,
        notes: notes || undefined,
      });

      router.push(`/trails/${trailId}`);
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  }

  const statusOptions = [
    { value: 'clear' as Status, label: STATUS_LABELS.clear, icon: CheckCircle2, color: 'text-status-passable' },
    { value: 'rough' as Status, label: STATUS_LABELS.rough, icon: AlertTriangle, color: 'text-status-caution' },
    { value: 'impassable' as Status, label: STATUS_LABELS.impassable, icon: XCircle, color: 'text-status-not-passable' },
  ];

  if (isLoadingAuth) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-6 w-48 mb-8" />
        <Card>
          <CardContent className="pt-6 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 text-muted-foreground">
        <Link href={`/trails/${trailId}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </Button>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold mb-2">Submit Report</h1>
        {trail && (
          <p className="text-[14px] text-secondary-foreground">{trail.name} - {trail.region}</p>
        )}
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="pt-6">
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status */}
            <div className="space-y-3">
              <Label className="text-base">
                Trail Status <span className="text-destructive">*</span>
              </Label>
              <div className="grid gap-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = status === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={option.value}
                        checked={isSelected}
                        onChange={(e) => setStatus(e.target.value as Status)}
                        className="sr-only"
                      />
                      <Icon className={`h-5 w-5 ${option.color}`} />
                      <span className="font-medium">{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Confidence */}
            <div className="space-y-3">
              <Label className="text-base">
                Confidence Level <span className="text-destructive">*</span>
              </Label>
              <Select value={confidence} onValueChange={(value) => setConfidence(value as Confidence)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select confidence level" />
                </SelectTrigger>
                <SelectContent>
                  {(['low', 'medium', 'high'] as Confidence[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CONFIDENCE_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-3">
              <Label className="text-base">
                Vehicle Type <span className="text-destructive">*</span>
              </Label>
              <Select value={vehicleType} onValueChange={(value) => setVehicleType(value as VehicleType)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map((vt) => (
                    <SelectItem key={vt} value={vt}>
                      {VEHICLE_TYPE_LABELS[vt]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <Label className="text-base">Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details about trail conditions..."
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-muted-foreground">{notes.length}/500 characters</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
              <Button variant="outline" asChild className="sm:flex-1">
                <Link href={`/trails/${trailId}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting} className="sm:flex-1">
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-muted rounded-lg flex items-start gap-3">
        <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Your report helps other off-roaders make informed decisions.
          Please be accurate and honest about trail conditions.
        </p>
      </div>
    </div>
  );
}
