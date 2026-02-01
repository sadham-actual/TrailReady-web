'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trailService } from '@/services/trailService';
import { Trail, ConditionReport, STATUS_LABELS, CONFIDENCE_LABELS, VEHICLE_TYPE_LABELS, getReportAgeHours, Status, Confidence } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, MapPin, Navigation, Clock, Car, CheckCircle2, AlertTriangle, XCircle, Plus } from 'lucide-react';

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

  function getStatusBadge(status: Status) {
    const baseClasses = "px-3 py-1 text-sm font-medium gap-1.5";
    switch (status) {
      case 'clear':
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {STATUS_LABELS[status]}
          </Badge>
        );
      case 'rough':
        return (
          <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            {STATUS_LABELS[status]}
          </Badge>
        );
      case 'impassable':
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400`}>
            <XCircle className="h-3.5 w-3.5" />
            {STATUS_LABELS[status]}
          </Badge>
        );
    }
  }

  function getConfidenceBadge(confidence: Confidence) {
    const baseClasses = "px-2.5 py-0.5 text-xs font-medium";
    switch (confidence) {
      case 'high':
        return <Badge variant="outline" className={`${baseClasses} text-green-700 border-green-300 dark:text-green-400 dark:border-green-700`}>{CONFIDENCE_LABELS[confidence]}</Badge>;
      case 'medium':
        return <Badge variant="outline" className={`${baseClasses} text-yellow-700 border-yellow-300 dark:text-yellow-400 dark:border-yellow-700`}>{CONFIDENCE_LABELS[confidence]}</Badge>;
      case 'low':
        return <Badge variant="outline" className={`${baseClasses} text-red-700 border-red-300 dark:text-red-400 dark:border-red-700`}>{CONFIDENCE_LABELS[confidence]}</Badge>;
    }
  }

  function formatReportAge(timestamp: string) {
    const hours = getReportAgeHours(timestamp);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-6 w-40 mb-8" />
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!trail) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
        <Link href="/trails">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Trails
        </Link>
      </Button>

      {/* Trail Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{trail.name}</h1>
        <p className="text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          {trail.region}
        </p>
      </div>

      {/* Trail Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Trail Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2.5">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{trail.region}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2.5">
                <Navigation className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Coordinates</p>
                <p className="font-medium">{trail.latitude.toFixed(4)}, {trail.longitude.toFixed(4)}</p>
              </div>
            </div>
          </div>
          {trail.description && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-2">Description</p>
              <p className="leading-relaxed">{trail.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Condition Reports Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Condition Reports</CardTitle>
          <Button asChild>
            <Link href={`/trails/${trailId}/submit`}>
              <Plus className="h-4 w-4 mr-1.5" />
              Submit Report
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <div className="rounded-full bg-muted p-4 w-fit mx-auto mb-4">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No condition reports yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to report on this trail!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report, index) => (
                <div
                  key={report.id}
                  className={`rounded-lg p-4 ${index === 0 ? 'bg-primary/5 border-2 border-primary/20' : 'border'}`}
                >
                  {index === 0 && (
                    <p className="text-xs font-medium text-primary mb-2">Latest Report</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {getStatusBadge(report.status)}
                    {getConfidenceBadge(report.confidence)}
                    <Badge variant="secondary" className="gap-1.5 px-2.5">
                      <Car className="h-3.5 w-3.5" />
                      {VEHICLE_TYPE_LABELS[report.vehicleType]}
                    </Badge>
                    <span className="text-sm text-muted-foreground ml-auto flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {formatReportAge(report.timestamp)}
                    </span>
                  </div>

                  {report.notes && (
                    <p className="text-sm mt-3 leading-relaxed">{report.notes}</p>
                  )}

                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(report.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
