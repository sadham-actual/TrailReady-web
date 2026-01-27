'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trailService } from '@/services/mockTrailService';
import { Trail, Status, Confidence, VehicleType, STATUS_LABELS, CONFIDENCE_LABELS, VEHICLE_TYPE_LABELS } from '@/types';

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

      // Success! Redirect back to trail detail
      router.push(`/trails/${trailId}`);
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  }

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href={`/trails/${trailId}`} className="text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← Back to Trail
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Submit Condition Report</h1>
          {trail && <p className="text-gray-600 mt-1">{trail.name} - {trail.region}</p>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trail Status <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {(['clear', 'rough', 'impassable'] as Status[]).map((s) => (
                  <label key={s} className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={status === s}
                      onChange={(e) => setStatus(e.target.value as Status)}
                      className="mr-3"
                    />
                    <span className="font-medium">{STATUS_LABELS[s]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Confidence */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confidence Level <span className="text-red-500">*</span>
              </label>
              <select
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as Confidence)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select confidence level</option>
                {(['low', 'medium', 'high'] as Confidence[]).map((c) => (
                  <option key={c} value={c}>
                    {CONFIDENCE_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Type <span className="text-red-500">*</span>
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select your vehicle type</option>
                {(Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map((vt) => (
                  <option key={vt} value={vt}>
                    {VEHICLE_TYPE_LABELS[vt]}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details about trail conditions..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">{notes.length}/500 characters</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <Link
                href={`/trails/${trailId}`}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Your report helps other off-roaders make informed decisions. 
            Please be accurate and honest about trail conditions.
          </p>
        </div>
      </div>
    </div>
  );
}