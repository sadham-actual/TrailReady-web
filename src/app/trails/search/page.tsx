'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { trailService } from '@/services/trailService';
import { Trail, STATUS_LABELS, Status } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Clock, ChevronRight, Map, Compass } from 'lucide-react';

export default function SearchTrailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    loadTrails(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function loadTrails(query?: string) {
    setIsLoading(true);
    try {
      const data = await trailService.getTrails(query);
      setTrails(data);
    } catch (error) {
      console.error('Failed to load trails:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();

    // Update URL with search query
    if (trimmedQuery) {
      router.push(`/trails/search?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      router.push('/trails/search');
      loadTrails();
    }
  }

  function getStatusBadge(status?: string) {
    if (!status) {
      return (
        <Badge className="bg-stone/20 hover:bg-stone/30 text-stone-dark text-xs">
          No Reports
        </Badge>
      );
    }

    switch (status) {
      case 'clear':
        return (
          <Badge className="bg-forest hover:bg-forest text-white text-xs">
            {STATUS_LABELS[status as Status]}
          </Badge>
        );
      case 'rough':
        return (
          <Badge className="bg-earth hover:bg-earth text-white text-xs">
            {STATUS_LABELS[status as Status]}
          </Badge>
        );
      case 'impassable':
        return (
          <Badge className="bg-alert hover:bg-alert text-white text-xs">
            {STATUS_LABELS[status as Status]}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-stone/20 hover:bg-stone/30 text-stone-dark text-xs">
            Unknown
          </Badge>
        );
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return null;

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page header with search */}
      <div className="bg-background border-b sticky top-16 z-10">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-earth rounded-xl">
                <Search className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Search Trails
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Find trails by name or region
                </p>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hover:bg-secondary"
            >
              <Link href="/trails/browse">
                <Map className="h-4 w-4 mr-2" />
                Map View
              </Link>
            </Button>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                type="text"
                placeholder="Search by trail name or region..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card focus-visible:ring-primary focus-visible:border-primary"
              />
            </div>
            <Button
              type="submit"
              className="bg-earth hover:bg-earth-dark text-white"
            >
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto max-w-4xl px-4 py-6">
        {/* Results count */}
        <div className="mb-4 flex items-center gap-2">
          {isLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <>
              <Compass className="h-4 w-4 text-forest" />
              <p className="text-sm text-muted-foreground font-medium">
                {trails.length} trail{trails.length !== 1 ? 's' : ''} found
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </>
          )}
        </div>

        {/* Trail list */}
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </Card>
            ))
          ) : trails.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="inline-flex p-4 bg-earth/10 rounded-2xl mb-4">
                  <Search className="h-12 w-12 text-earth" />
                </div>
                <p className="text-lg mb-2 font-semibold text-foreground">
                  No trails found
                </p>
                {searchQuery ? (
                  <p className="text-sm text-muted-foreground mb-4">
                    Try a different search term or{' '}
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        router.push('/trails/search');
                        loadTrails();
                      }}
                      className="text-earth hover:text-earth-light font-semibold underline"
                    >
                      view all trails
                    </button>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Start by searching for a trail or region
                  </p>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="mt-4"
                >
                  <Link href="/trails/browse">
                    <Map className="h-4 w-4 mr-2" />
                    Browse trails on map
                  </Link>
                </Button>
              </div>
            </Card>
          ) : (
            trails.map((trail) => (
              <Card
                key={trail.id}
                className="p-6 hover:shadow-lg hover:bg-secondary transition-all duration-200 cursor-pointer group"
                onClick={() => router.push(`/trails/${trail.id}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold mb-1 text-foreground transition-colors">
                      {trail.name}
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      {trail.region}
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(trail.latestStatus)}

                      {trail.lastReportAt && (
                        <div className="flex items-center text-sm text-muted-foreground/70">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          Last report {formatDate(trail.lastReportAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-forest group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
