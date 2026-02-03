'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { trailService } from '@/services/trailService';
import { Trail, Status, STATUS_LABELS } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, List, ChevronRight, Loader2, Compass } from 'lucide-react';
import type { LatLngBounds } from 'leaflet';

// Dynamic import to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E8F5EC] to-[#D4E8DC]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#5FA777] mx-auto mb-4" />
        <p className="text-[#3D5A45] font-medium" style={{ fontFamily: 'var(--font-display)' }}>
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

  function getStatusBadgeClass(status?: string) {
    switch (status) {
      case 'clear':
        return 'bg-[#5FA777] hover:bg-[#5FA777] text-white';
      case 'rough':
        return 'bg-[#C67B4E] hover:bg-[#C67B4E] text-white';
      case 'impassable':
        return 'bg-[#D64545] hover:bg-[#D64545] text-white';
      default:
        return 'bg-[#8B7E6A]/20 hover:bg-[#8B7E6A]/30 text-[#5C4B3A]';
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="bg-gradient-to-r from-[#FAF6F1] to-[#F0EBE1] border-b border-[#DDD6CA] px-4 py-4 shadow-sm">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#5FA777] rounded-xl">
                <Compass className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold text-[#2D5A3D]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Browse Trails
                </h1>
                <p
                  className="text-sm text-[#5C4B3A] mt-0.5"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Explore trails visually on the map
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-[#DDD6CA] hover:border-[#5FA777] hover:bg-[#5FA777]/5"
              style={{ fontFamily: 'var(--font-display)' }}
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
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E8F5EC] to-[#D4E8DC]">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-[#5FA777] mx-auto mb-4" />
                <p className="text-[#3D5A45] font-medium" style={{ fontFamily: 'var(--font-display)' }}>
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
        <div className="h-1/2 md:h-full md:flex-[3] bg-gradient-to-b from-[#FAF6F1] to-[#F5F0E6] border-t md:border-t-0 md:border-l border-[#DDD6CA] overflow-y-auto">
          <div className="p-4 space-y-3">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#DDD6CA]">
              <h2
                className="font-bold text-lg text-[#2D5A3D]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {visibleTrails.length} trail{visibleTrails.length !== 1 ? 's' : ''} in view
              </h2>
              <MapPin className="h-5 w-5 text-[#5FA777]" />
            </div>

            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-4 bg-white border-[#DDD6CA]">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </Card>
              ))
            ) : visibleTrails.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-flex p-4 bg-[#5FA777]/10 rounded-2xl mb-4">
                  <MapPin className="h-12 w-12 text-[#5FA777]" />
                </div>
                <p
                  className="text-[#3D5A45] font-semibold mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  No trails in this area
                </p>
                <p
                  className="text-sm text-[#5C4B3A]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Zoom out or pan the map to explore
                </p>
              </div>
            ) : (
              visibleTrails.map((trail) => (
                <Card
                  key={trail.id}
                  className={`p-4 bg-white hover:bg-[#F5F0E6] border-[#DDD6CA] cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTrailId === trail.id
                      ? 'ring-2 ring-[#5FA777] shadow-lg bg-[#E8F5EC]'
                      : ''
                  }`}
                  onClick={() => setSelectedTrailId(trail.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-base truncate text-[#2D5A3D] mb-1"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {trail.name}
                      </h3>
                      <p
                        className="text-sm text-[#5C4B3A] mb-2"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {trail.region}
                      </p>

                      {trail.latestStatus ? (
                        <Badge className={`text-xs ${getStatusBadgeClass(trail.latestStatus)}`}>
                          {STATUS_LABELS[trail.latestStatus as Status]}
                        </Badge>
                      ) : (
                        <Badge className={`text-xs ${getStatusBadgeClass()}`}>
                          No Reports
                        </Badge>
                      )}
                    </div>

                    <Link
                      href={`/trails/${trail.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-shrink-0"
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-[#5FA777]/10 hover:text-[#2D5A3D]"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
