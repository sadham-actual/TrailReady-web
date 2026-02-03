'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trailService } from '@/services/trailService';
import { Trail, ConditionReport, STATUS_LABELS, CONFIDENCE_LABELS, VEHICLE_TYPE_LABELS, getReportAgeHours, Status, Confidence, VehicleType } from '@/types';
import { getVehicleOutcome, getTrailOutcomeSummary, OutcomeStatus } from '@/lib/trailOutcome';
import { useVehicle } from '@/contexts/VehicleContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Clock, Car, Plus, AlertTriangle, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Vehicle selector component for choosing vehicle type
 */
function VehicleSelector({ onSelect }: { onSelect: (vehicle: VehicleType) => void }) {
  return (
    <Select onValueChange={(value) => onSelect(value as VehicleType)}>
      <SelectTrigger className="w-[220px]">
        <SelectValue placeholder="Select vehicle" />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(VEHICLE_TYPE_LABELS) as [VehicleType, string][]).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function TrailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trailId = params.id as string;
  const { selectedVehicle, setSelectedVehicle } = useVehicle();

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

  function getStatusBadge(status: Status) {
    switch (status) {
      case 'clear':
        return (
          <Badge className="bg-status-passable text-white">
            {STATUS_LABELS[status]}
          </Badge>
        );
      case 'rough':
        return (
          <Badge className="bg-status-caution text-white">
            {STATUS_LABELS[status]}
          </Badge>
        );
      case 'impassable':
        return (
          <Badge className="bg-status-not-passable text-white">
            {STATUS_LABELS[status]}
          </Badge>
        );
    }
  }

  function getConfidenceBadge(confidence: Confidence) {
    const colorMap = {
      high: 'border-status-passable text-status-passable',
      medium: 'border-status-caution text-status-caution',
      low: 'border-status-not-passable text-status-not-passable',
    };
    return (
      <Badge variant="outline" className={colorMap[confidence]}>
        {CONFIDENCE_LABELS[confidence]} Confidence
      </Badge>
    );
  }

  function formatReportAge(timestamp: string) {
    const hours = getReportAgeHours(timestamp);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} days ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  function getOutcomeIcon(status: OutcomeStatus) {
    switch (status) {
      case 'passable':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'high-risk':
        return <AlertTriangle className="h-4 w-4" />;
      case 'impassable':
        return <XCircle className="h-4 w-4" />;
      case 'unknown':
        return <HelpCircle className="h-4 w-4" />;
    }
  }

  function getOutcomeBadge(status: OutcomeStatus) {
    switch (status) {
      case 'passable':
        return (
          <Badge className="bg-status-passable text-white gap-1.5">
            {getOutcomeIcon(status)}
            Passable
          </Badge>
        );
      case 'high-risk':
        return (
          <Badge className="bg-status-caution text-white gap-1.5">
            {getOutcomeIcon(status)}
            High Risk
          </Badge>
        );
      case 'impassable':
        return (
          <Badge className="bg-status-not-passable text-white gap-1.5">
            {getOutcomeIcon(status)}
            Not Passable
          </Badge>
        );
      case 'unknown':
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground gap-1.5">
            {getOutcomeIcon(status)}
            Unknown
          </Badge>
        );
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-6 w-24 mb-6" />
        <Skeleton className="h-8 w-64 mb-3" />
        <div className="flex gap-3 mb-8">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trail) {
    return null;
  }

  const latestReport = reports[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2 text-muted-foreground">
        <Link href="/trails">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Link>
      </Button>

      {/* Trail Header with Status */}
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold mb-3">{trail.name}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {latestReport ? (
            <>
              {getStatusBadge(latestReport.status)}
              <span className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatReportAge(latestReport.timestamp)}
              </span>
            </>
          ) : (
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              No Reports
            </Badge>
          )}
        </div>
        <p className="text-[14px] text-secondary-foreground mt-3 flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {trail.region}
        </p>
      </div>

      {/* Description if exists */}
      {trail.description && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-[14px] text-secondary-foreground leading-relaxed">
              {trail.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Trail Outcome Section */}
      {reports.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-5">
            {selectedVehicle ? (
              // Vehicle-specific outcome
              <>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h2 className="text-[16px] font-semibold mb-2">Trail Outcome for Your Vehicle</h2>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-secondary text-secondary-foreground gap-1">
                        <Car className="h-3 w-3" />
                        {VEHICLE_TYPE_LABELS[selectedVehicle]}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVehicle(null)}
                        className="h-auto py-1 px-2 text-[13px] text-muted-foreground"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                </div>

                {(() => {
                  const outcome = getVehicleOutcome(reports, selectedVehicle);
                  return (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getOutcomeBadge(outcome.status)}
                            {getConfidenceBadge(outcome.confidence)}
                          </div>
                          <p className="text-[14px] text-secondary-foreground">
                            {outcome.explanation}
                          </p>
                        </div>
                      </div>

                      {/* Other vehicle types summary */}
                      <div className="border-t pt-4">
                        <p className="text-[13px] font-medium text-muted-foreground mb-3">
                          Outcomes for Other Vehicles
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {(Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[])
                            .filter(vt => vt !== selectedVehicle)
                            .map(vehicleType => {
                              const otherOutcome = getVehicleOutcome(reports, vehicleType);
                              return (
                                <div
                                  key={vehicleType}
                                  className="flex items-center justify-between text-[13px] py-2 px-3 bg-background rounded border"
                                >
                                  <span className="text-secondary-foreground">
                                    {VEHICLE_TYPE_LABELS[vehicleType]}
                                  </span>
                                  {getOutcomeBadge(otherOutcome.status)}
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              // No vehicle selected - show summary
              <>
                <h2 className="text-[16px] font-semibold mb-3">Trail Outcomes</h2>
                {(() => {
                  const summary = getTrailOutcomeSummary(reports);
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-[14px]">
                          <CheckCircle2 className="h-4 w-4 text-status-passable" />
                          <span className="text-secondary-foreground">
                            {summary.passable} Passable
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[14px]">
                          <AlertTriangle className="h-4 w-4 text-status-caution" />
                          <span className="text-secondary-foreground">
                            {summary.highRisk} High Risk
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[14px]">
                          <XCircle className="h-4 w-4 text-status-not-passable" />
                          <span className="text-secondary-foreground">
                            {summary.impassable} Not Passable
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[14px]">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-secondary-foreground">
                            {summary.unknown} Unknown
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-[14px] font-medium text-foreground mb-1">
                              Select your vehicle to see what applies to you
                            </p>
                            <p className="text-[13px] text-muted-foreground">
                              Trail conditions vary by vehicle type
                            </p>
                          </div>
                          <VehicleSelector onSelect={setSelectedVehicle} />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Condition Reports */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold">Condition Reports</h2>
        <Button size="sm" asChild>
          <Link href={`/trails/${trailId}/submit`}>
            <Plus className="h-4 w-4 mr-1" />
            Submit Report
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No condition reports yet.</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Be the first to report on this trail.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-4">
                {/* Status and Meta Row */}
                <div className="flex items-center gap-3 flex-wrap mb-3">
                  {getStatusBadge(report.status)}
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground gap-1">
                    <Car className="h-3 w-3" />
                    {VEHICLE_TYPE_LABELS[report.vehicleType]}
                  </Badge>
                  {getConfidenceBadge(report.confidence)}
                </div>

                {/* Notes */}
                {report.notes && (
                  <p className="text-[14px] text-foreground leading-relaxed mb-3">
                    {report.notes}
                  </p>
                )}

                {/* Timestamp */}
                <p className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatReportAge(report.timestamp)}
                  <span className="text-muted-foreground/60 ml-1">
                    ({new Date(report.timestamp).toLocaleDateString()})
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
