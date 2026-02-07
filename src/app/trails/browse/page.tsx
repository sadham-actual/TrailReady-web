'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { trailService } from '@/services/trailService';
import { Trail, Status, STATUS_LABELS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, List, Loader2, Compass } from 'lucide-react';
import { TrailCardCompact } from '@/components/TrailCard';
import type { LatLngBounds } from 'leaflet';

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-secondary">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-forest mx-auto mb-4" />
        <p className="text-foreground font-medium">
          Loading trail map...
        </p>
      </div>
    </div>
  ),
});

export default function BrowseTrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);

  // Load all trails on mount
  useEffect(() => {
    loadTrails();
  }, []);

  async function loadTrails() {
    setIsLoading(true);
    try {
      const data = await trailService.getTrails();
      setTrails(data);
    } catch (error) {
      console.error('Failed to load trails:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter trails that are currently visible on the map
  const visibleTrails = useMemo(() => {
    if (!mapBounds) return trails;

    return trails.filter((trail) => {
      if (!trail.latitude || !trail.longitude) return false;
      return mapBounds.contains([trail.latitude, trail.longitude]);
    });
  }, [trails, mapBounds]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="bg-background border-b px-4 py-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-forest rounded-xl">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Browse Trails
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Explore trails visually on the map
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hover:bg-secondary"
            >
              <Link href="/trails/search">
                <List className="h-4 w-4 mr-2" />
                List View
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Map and list container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Map section - 70% on desktop, full height on mobile */}
        <div className="h-1/2 md:h-full md:flex-[7] relative">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-forest mx-auto mb-4" />
                <p className="text-foreground font-medium">
                  Loading trails...
                </p>
              </div>
            </div>
          ) : (
            <MapView
              trails={trails}
              selectedTrailId={selectedTrailId}
              onTrailSelect={setSelectedTrailId}
              onBoundsChange={setMapBounds}
            />
          )}
        </div>

        {/* Trail list panel - 30% on desktop, bottom half on mobile */}
        <div className="h-1/2 md:h-full md:flex-[3] bg-background border-t md:border-t-0 md:border-l overflow-y-auto">
          <div className="p-4 space-y-3">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <h2 className="font-semibold text-lg text-foreground">
                {visibleTrails.length} trail{visibleTrails.length !== 1 ? 's' : ''} in view
              </h2>
              <MapPin className="h-5 w-5 text-forest" />
            </div>

            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))
            ) : visibleTrails.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-flex p-4 bg-forest/10 rounded-2xl mb-4">
                  <MapPin className="h-12 w-12 text-forest" />
                </div>
                <p className="text-foreground font-semibold mb-2">
                  No trails in this area
                </p>
                <p className="text-sm text-muted-foreground">
                  Zoom out or pan the map to explore
                </p>
              </div>
            ) : (
              visibleTrails.map((trail, index) => (
                <div
                  key={trail.id}
                  className={`animate-slide-up ${
                    selectedTrailId === trail.id
                      ? 'ring-2 ring-primary rounded-xl'
                      : ''
                  }`}
                  style={{ animationDelay: `${index * 0.03}s`, animationFillMode: 'backwards' }}
                  onClick={() => setSelectedTrailId(trail.id)}
                >
                  <TrailCardCompact trail={trail} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
