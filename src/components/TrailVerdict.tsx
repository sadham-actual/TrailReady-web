'use client';

import { useState, useMemo } from 'react';
import { useVehicle } from '@/contexts/VehicleContext';
import { ConditionReport, VehicleType, VEHICLE_TYPE_LABELS, STATUS_LABELS, Status } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehicleSelectionModal } from '@/components/VehicleSelectionModal';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Calendar,
  Car,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface TrailVerdictProps {
  reports: ConditionReport[];
  trailName: string;
}

interface VerdictData {
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN';
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  reasoning: string[];
  recentReports: ConditionReport[];
  vehicleSuccessRate: {
    successful: number;
    failed: number;
    total: number;
  };
  needsVehicleSelection: boolean;
}

export function TrailVerdict({ reports, trailName }: TrailVerdictProps) {
  const { selectedVehicle, setSelectedVehicle } = useVehicle();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);

  const verdict = useMemo(
    () => calculateVerdict(reports, selectedVehicle),
    [reports, selectedVehicle]
  );

  return (
    <>
      <Card
        className={`border-4 overflow-hidden transition-all duration-300 shadow-xl ${getBorderColor(
          verdict.riskLevel
        )} ${getBackgroundGradient(verdict.riskLevel)}`}
      >
        <CardContent className="p-0">
          {/* Main verdict header */}
          <div className="p-8 pb-6 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 ${getBackgroundAccent(verdict.riskLevel)} -translate-y-20 translate-x-20`} />

            <div className="flex items-start gap-6 mb-6 relative z-10">
              <div className="flex-shrink-0">{getVerdictIcon(verdict.riskLevel)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h2
                      className="text-3xl md:text-5xl font-black mb-3 tracking-tight leading-tight"
                      style={{
                        fontFamily: 'var(--font-display)',
                        color: getRecommendationColor(verdict.riskLevel),
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {verdict.recommendation}
                    </h2>

                    {selectedVehicle ? (
                      <div className="flex items-center gap-2.5 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full inline-flex border border-[#DDD6CA]">
                        <Car className="h-5 w-5 text-[#2D5A3D]" />
                        <p
                          className="text-[#2D5A3D] font-bold text-sm"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          For {VEHICLE_TYPE_LABELS[selectedVehicle]}
                        </p>
                      </div>
                    ) : (
                      <p
                        className="text-[#3D2E24] text-base font-semibold"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        Select your vehicle type for personalized assessment
                      </p>
                    )}
                  </div>

                  {/* Risk badge */}
                  <Badge
                    className={`text-lg px-5 py-2.5 font-black whitespace-nowrap shadow-lg ${getRiskBadgeClass(
                      verdict.riskLevel
                    )}`}
                    style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}
                  >
                    {verdict.riskLevel} RISK
                  </Badge>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            {selectedVehicle && verdict.vehicleSuccessRate.total > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6 p-6 bg-white/70 backdrop-blur-sm rounded-2xl border-2 border-[#DDD6CA] shadow-sm relative z-10">
                <div className="text-center group hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-2 bg-[#5FA777]/10 rounded-xl">
                      <CheckCircle2 className="h-6 w-6 text-[#5FA777]" />
                    </div>
                  </div>
                  <div
                    className="text-4xl font-black text-[#5FA777] mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {verdict.vehicleSuccessRate.successful}
                  </div>
                  <div
                    className="text-sm text-[#3D2E24] font-bold uppercase tracking-wide"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Successful
                  </div>
                </div>
                <div className="text-center group hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-2 bg-[#D64545]/10 rounded-xl">
                      <XCircle className="h-6 w-6 text-[#D64545]" />
                    </div>
                  </div>
                  <div
                    className="text-4xl font-black text-[#D64545] mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {verdict.vehicleSuccessRate.failed}
                  </div>
                  <div
                    className="text-sm text-[#3D2E24] font-bold uppercase tracking-wide"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Failed
                  </div>
                </div>
                <div className="text-center group hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="p-2 bg-[#2D5A3D]/10 rounded-xl">
                      <Shield className="h-6 w-6 text-[#2D5A3D]" />
                    </div>
                  </div>
                  <div
                    className="text-4xl font-black text-[#2D5A3D] mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {verdict.vehicleSuccessRate.total}
                  </div>
                  <div
                    className="text-sm text-[#3D2E24] font-bold uppercase tracking-wide"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Total
                  </div>
                </div>
              </div>
            )}

            {/* Key reasoning points */}
            {verdict.reasoning.length > 0 && (
              <div className="space-y-3 relative z-10">
                {verdict.reasoning.slice(0, 3).map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/50 rounded-xl border border-[#DDD6CA] hover:border-[#5FA777] transition-colors">
                    <div className="p-2 bg-[#5FA777]/10 rounded-lg flex-shrink-0">
                      <Info className="h-5 w-5 text-[#5FA777]" />
                    </div>
                    <span
                      className="text-base text-[#2D5A3D] font-medium leading-relaxed pt-1"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {reason}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent reports preview */}
          {verdict.recentReports.length > 0 && (
            <div className="border-t-4 border-[#DDD6CA] bg-white/60 backdrop-blur-sm p-6">
              <h3
                className="text-lg font-black mb-4 flex items-center gap-3 text-[#2D5A3D] uppercase tracking-wide"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <div className="p-2 bg-[#2D5A3D]/10 rounded-xl">
                  <Calendar className="h-5 w-5" />
                </div>
                Most Recent Reports
              </h3>
              <div className="space-y-3">
                {verdict.recentReports.slice(0, 3).map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-[#DDD6CA] hover:border-[#5FA777] hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {report.status === 'clear' ? (
                        <div className="p-2.5 bg-[#5FA777]/10 rounded-xl border-2 border-[#5FA777]/30">
                          <CheckCircle2 className="h-6 w-6 text-[#5FA777]" strokeWidth={2.5} />
                        </div>
                      ) : report.status === 'rough' ? (
                        <div className="p-2.5 bg-[#C67B4E]/10 rounded-xl border-2 border-[#C67B4E]/30">
                          <AlertTriangle className="h-6 w-6 text-[#C67B4E]" strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="p-2.5 bg-[#D64545]/10 rounded-xl border-2 border-[#D64545]/30">
                          <XCircle className="h-6 w-6 text-[#D64545]" strokeWidth={2.5} />
                        </div>
                      )}
                      <div>
                        <div
                          className="font-black text-base text-[#2D5A3D] mb-1"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {STATUS_LABELS[report.status as Status]}
                        </div>
                        <div
                          className="text-sm text-[#5C4B3A] font-medium"
                          style={{ fontFamily: 'var(--font-body)' }}
                        >
                          {VEHICLE_TYPE_LABELS[report.vehicleType]} · {formatRelativeTime(report.timestamp)}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs border-2 border-[#DDD6CA] text-[#3D2E24] font-bold px-3 py-1"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {report.confidence}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No vehicle selected CTA */}
          {verdict.needsVehicleSelection && (
            <div className="border-t border-[#DDD6CA] bg-gradient-to-br from-[#E8F5EC] to-[#D4E8DC] p-4">
              <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-[#5FA777]/30">
                <Car className="h-5 w-5 text-[#5FA777] flex-shrink-0" />
                <div className="flex-1">
                  <p
                    className="text-sm font-bold text-[#2D5A3D]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Get a personalized risk assessment
                  </p>
                  <p
                    className="text-xs text-[#5C4B3A] mt-0.5"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Select your vehicle type to see how this trail matches your capabilities
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setVehicleModalOpen(true)}
                  className="bg-[#5FA777] hover:bg-[#4A8A5F] text-white shadow-sm"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Select Vehicle
                </Button>
              </div>
            </div>
          )}

          {/* Confidence indicator */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-white/40 to-white/60 border-t-4 border-[#DDD6CA]">
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wide ${getConfidenceColor(verdict.confidence)} ${getConfidenceBackground(verdict.confidence)}`}>
                {verdict.confidence === 'HIGH' && <TrendingUp className="h-5 w-5" strokeWidth={3} />}
                {verdict.confidence === 'MEDIUM' && <Minus className="h-5 w-5" strokeWidth={3} />}
                {verdict.confidence === 'LOW' && <TrendingDown className="h-5 w-5" strokeWidth={3} />}
                <span
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {verdict.confidence} Confidence
                </span>
              </div>
            </div>
            {verdict.recentReports.length > 0 && (
              <span
                className="text-[#3D2E24] font-semibold text-sm"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Based on {verdict.recentReports.length} recent report{verdict.recentReports.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <VehicleSelectionModal
        open={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
        currentVehicle={selectedVehicle}
        onSelectVehicle={setSelectedVehicle}
      />
    </>
  );
}

// Helper functions

function calculateVerdict(
  reports: ConditionReport[],
  vehicleType?: VehicleType | null
): VerdictData {
  // No reports
  if (reports.length === 0) {
    return {
      riskLevel: 'UNKNOWN',
      confidence: 'LOW',
      recommendation: 'No recent reports available',
      reasoning: ['No one has reported on this trail recently', 'Be the first to submit a condition report'],
      recentReports: [],
      vehicleSuccessRate: { successful: 0, failed: 0, total: 0 },
      needsVehicleSelection: !vehicleType,
    };
  }

  // Filter recent reports (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentReports = reports
    .filter((r) => new Date(r.timestamp) > thirtyDaysAgo)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // If no vehicle selected, show general assessment
  if (!vehicleType) {
    const clearCount = recentReports.filter((r) => r.status === 'clear').length;
    const roughCount = recentReports.filter((r) => r.status === 'rough').length;
    const impassableCount = recentReports.filter((r) => r.status === 'impassable').length;

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'UNKNOWN';
    let recommendation: string;

    if (recentReports.length === 0) {
      riskLevel = 'UNKNOWN';
      recommendation = 'No recent reports in last 30 days';
    } else if (impassableCount > 0) {
      riskLevel = 'HIGH';
      recommendation = 'Recent reports show impassable conditions';
    } else if (roughCount > clearCount) {
      riskLevel = 'MODERATE';
      recommendation = 'Trail reported as rough recently';
    } else if (clearCount > 0) {
      riskLevel = 'LOW';
      recommendation = 'Trail reported as passable recently';
    } else {
      riskLevel = 'UNKNOWN';
      recommendation = 'Mixed reports - select vehicle for details';
    }

    const reasoning: string[] = [];
    if (recentReports.length > 0) {
      reasoning.push(
        `${clearCount} passable, ${roughCount} caution, ${impassableCount} impassable in last 30 days`
      );
      reasoning.push(`Based on ${recentReports.length} total reports`);
    } else {
      reasoning.push('Most recent reports are older than 30 days');
      reasoning.push('Trail conditions may have changed significantly');
    }

    return {
      riskLevel,
      confidence: recentReports.length >= 3 ? 'MEDIUM' : 'LOW',
      recommendation,
      reasoning,
      recentReports: recentReports.slice(0, 5),
      vehicleSuccessRate: {
        successful: clearCount,
        failed: impassableCount,
        total: recentReports.length,
      },
      needsVehicleSelection: true,
    };
  }

  // Vehicle-specific assessment
  const vehicleReports = recentReports.filter((r) => r.vehicleType === vehicleType);

  // If no exact match, try similar vehicles
  const similarVehicleReports = recentReports.filter((r) =>
    isSimilarVehicle(r.vehicleType, vehicleType)
  );

  const relevantReports =
    vehicleReports.length > 0 ? vehicleReports : similarVehicleReports;
  const usingSimilar = vehicleReports.length === 0 && similarVehicleReports.length > 0;

  if (relevantReports.length === 0) {
    return {
      riskLevel: 'UNKNOWN',
      confidence: 'LOW',
      recommendation: `No recent reports for ${VEHICLE_TYPE_LABELS[vehicleType]}`,
      reasoning: [
        `No reports from ${VEHICLE_TYPE_LABELS[vehicleType]} in last 30 days`,
        'Consider reports from similar vehicles or check back later',
      ],
      recentReports: recentReports.slice(0, 5),
      vehicleSuccessRate: { successful: 0, failed: 0, total: 0 },
      needsVehicleSelection: false,
    };
  }

  // Calculate success rate
  const successful = relevantReports.filter((r) => r.status === 'clear').length;
  const failed = relevantReports.filter((r) => r.status === 'impassable').length;
  const rough = relevantReports.filter((r) => r.status === 'rough').length;
  const total = relevantReports.length;

  const successRate = successful / total;
  const failureRate = failed / total;

  // Determine risk level
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  let recommendation: string;
  const reasoning: string[] = [];

  if (failureRate >= 0.3) {
    riskLevel = 'HIGH';
    recommendation = `High risk for ${VEHICLE_TYPE_LABELS[vehicleType]}`;
    reasoning.push(`${failed} of ${total} recent attempts failed`);
  } else if (successRate >= 0.7) {
    riskLevel = 'LOW';
    recommendation = `Good to go for ${VEHICLE_TYPE_LABELS[vehicleType]}`;
    reasoning.push(`${successful} of ${total} recent attempts successful`);
  } else {
    riskLevel = 'MODERATE';
    recommendation = `Proceed with caution - ${VEHICLE_TYPE_LABELS[vehicleType]}`;
    reasoning.push(
      `Mixed results: ${successful} passable, ${rough} caution, ${failed} impassable`
    );
  }

  // Add similar vehicle note if applicable
  if (usingSimilar) {
    reasoning.push('Assessment based on similar vehicle types');
  }

  // Add recency info
  const mostRecent = new Date(relevantReports[0].timestamp);
  const daysOld = Math.floor(
    (new Date().getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysOld < 7) {
    reasoning.push(`Most recent report is ${daysOld} day${daysOld !== 1 ? 's' : ''} old`);
  } else {
    reasoning.push(
      `Latest report is from ${daysOld} days ago - conditions may have changed`
    );
  }

  // Confidence based on recency and quantity
  let confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  if (total >= 5 && daysOld < 7) {
    confidence = 'HIGH';
  } else if (total >= 3 || daysOld < 14) {
    confidence = 'MEDIUM';
  } else {
    confidence = 'LOW';
  }

  return {
    riskLevel,
    confidence,
    recommendation,
    reasoning,
    recentReports: relevantReports.slice(0, 5),
    vehicleSuccessRate: { successful, failed, total },
    needsVehicleSelection: false,
  };
}

function isSimilarVehicle(vehicleA: VehicleType, vehicleB: VehicleType): boolean {
  const stockVehicles: VehicleType[] = [
    'stockSUV_solidAxle',
    'stockSUV_IFS',
    'stockSUV_IFRS',
  ];
  const liftedVehicles: VehicleType[] = [
    'lifted4x4_solidAxle',
    'lifted4x4_IFS',
    'lifted4x4_IFRS',
  ];

  if (stockVehicles.includes(vehicleA) && stockVehicles.includes(vehicleB)) return true;
  if (liftedVehicles.includes(vehicleA) && liftedVehicles.includes(vehicleB)) return true;

  return false;
}

function getBorderColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'LOW':
      return 'border-[#5FA777] hover:border-[#4A8A5F]';
    case 'MODERATE':
      return 'border-[#C67B4E] hover:border-[#A8653F]';
    case 'HIGH':
      return 'border-[#D64545] hover:border-[#B83838]';
    default:
      return 'border-[#8B7E6A] hover:border-[#6D6153]';
  }
}

function getRecommendationColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'LOW':
      return '#2D5A3D';
    case 'MODERATE':
      return '#6B3E28';
    case 'HIGH':
      return '#8B2424';
    default:
      return '#3D2E24';
  }
}

function getBackgroundAccent(riskLevel: string): string {
  switch (riskLevel) {
    case 'LOW':
      return 'bg-[#5FA777]';
    case 'MODERATE':
      return 'bg-[#C67B4E]';
    case 'HIGH':
      return 'bg-[#D64545]';
    default:
      return 'bg-[#8B7E6A]';
  }
}

function getBackgroundGradient(riskLevel: string): string {
  switch (riskLevel) {
    case 'LOW':
      return 'bg-gradient-to-br from-[#E8F5EC] to-[#F0F9F3]';
    case 'MODERATE':
      return 'bg-gradient-to-br from-[#F5E8DC] to-[#F9F3ED]';
    case 'HIGH':
      return 'bg-gradient-to-br from-[#FCE8E8] to-[#FDF3F3]';
    default:
      return 'bg-gradient-to-br from-[#FAF6F1] to-[#F5F0E6]';
  }
}

function getRiskBadgeClass(riskLevel: string): string {
  switch (riskLevel) {
    case 'LOW':
      return 'bg-[#5FA777] hover:bg-[#5FA777] text-white border-0';
    case 'MODERATE':
      return 'bg-[#C67B4E] hover:bg-[#C67B4E] text-white border-0';
    case 'HIGH':
      return 'bg-[#D64545] hover:bg-[#D64545] text-white border-0';
    default:
      return 'bg-[#8B7E6A] hover:bg-[#8B7E6A] text-white border-0';
  }
}

function getConfidenceColor(confidence: string): string {
  switch (confidence) {
    case 'HIGH':
      return 'text-[#2D5A3D]';
    case 'MEDIUM':
      return 'text-[#6B3E28]';
    case 'LOW':
      return 'text-[#5C4B3A]';
    default:
      return 'text-[#3D2E24]';
  }
}

function getConfidenceBackground(confidence: string): string {
  switch (confidence) {
    case 'HIGH':
      return 'bg-[#5FA777]/20 border-2 border-[#5FA777]';
    case 'MEDIUM':
      return 'bg-[#C67B4E]/20 border-2 border-[#C67B4E]';
    case 'LOW':
      return 'bg-[#8B7E6A]/20 border-2 border-[#8B7E6A]';
    default:
      return 'bg-[#DDD6CA]/30 border-2 border-[#DDD6CA]';
  }
}

function getVerdictIcon(riskLevel: string) {
  switch (riskLevel) {
    case 'LOW':
      return (
        <div className="p-5 bg-[#5FA777] rounded-3xl shadow-2xl border-4 border-white/40 relative group-hover:scale-110 transition-transform">
          <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl animate-pulse" />
          <CheckCircle2 className="h-12 w-12 text-white relative z-10" strokeWidth={3} />
        </div>
      );
    case 'MODERATE':
      return (
        <div className="p-5 bg-[#C67B4E] rounded-3xl shadow-2xl border-4 border-white/40 relative group-hover:scale-110 transition-transform">
          <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl animate-pulse" />
          <AlertTriangle className="h-12 w-12 text-white relative z-10" strokeWidth={3} />
        </div>
      );
    case 'HIGH':
      return (
        <div className="p-5 bg-[#D64545] rounded-3xl shadow-2xl border-4 border-white/40 relative group-hover:scale-110 transition-transform">
          <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl animate-pulse" />
          <XCircle className="h-12 w-12 text-white relative z-10" strokeWidth={3} />
        </div>
      );
    default:
      return (
        <div className="p-5 bg-[#8B7E6A] rounded-3xl shadow-2xl border-4 border-white/40 relative group-hover:scale-110 transition-transform">
          <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl animate-pulse" />
          <Info className="h-12 w-12 text-white relative z-10" strokeWidth={3} />
        </div>
      );
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
