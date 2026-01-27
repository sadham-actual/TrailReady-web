'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trailService } from '@/services/mockTrailService';
import { Trail, ConditionReport, STATUS_LABELS, CONFIDENCE_LABELS, VEHICLE_TYPE_LABELS, getReportAgeHours } from '@/types';

export default function TrailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trailId = params.id as string;

  const [trail, setTrail] = useState<Trail | null>(null);
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrailData();
  }, [trailId]);

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

      setTrail(trailData);
      setReports(reportsData);
    } catch (error) {
      console.error('Failed to load trail:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'clear':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rough':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'impassable':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getConfidenceColor(confidence: string) {
    switch (confidence) {
      case 'high':
        return 'text-green-700';
      case 'medium':
        return 'text-yellow-700';
      case 'low':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading trail...</p>
        </div>
      </div>
    );
  }

  if (!trail) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/trails" className="text-blue-600 hover:text-blue-700 mb-2 inline-block">
            ← Back to Trails
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{trail.name}</h1>
          <p className="text-gray-600 mt-1">{trail.region}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Trail Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Trail Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{trail.region}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Coordinates</p>
              <p className="font-medium">{trail.latitude.toFixed(4)}, {trail.longitude.toFixed(4)}</p>
            </div>
          </div>
          {trail.description && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Description</p>
              <p className="mt-1">{trail.description}</p>
            </div>
          )}
        </div>

        {/* Condition Reports */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Condition Reports</h2>
            <Link
                href={`/trails/${trailId}/submit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
            Submit Report
            </Link>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p>No condition reports yet.</p>
              <p className="text-sm mt-2">Be the first to report on this trail!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(report.status)}`}>
                      {STATUS_LABELS[report.status]}
                    </span>
                    
                    {/* Confidence */}
                    <span className={`text-sm font-medium ${getConfidenceColor(report.confidence)}`}>
                      {CONFIDENCE_LABELS[report.confidence]} Confidence
                    </span>
                    
                    {/* Vehicle Type */}
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      {VEHICLE_TYPE_LABELS[report.vehicleType]}
                    </span>
                    
                    {/* Report Age */}
                    <span className="text-sm text-gray-500 ml-auto">
                      {getReportAgeHours(report.timestamp)} hours ago
                    </span>
                  </div>

                  {/* Notes */}
                  {report.notes && (
                    <p className="text-gray-700 mt-2">{report.notes}</p>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(report.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}