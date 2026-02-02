'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trailService } from '@/services/trailService';
import { Trail, STATUS_LABELS, Status } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Clock, ChevronRight } from 'lucide-react';

export default function TrailsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    loadTrails(initialQuery);
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadTrails(searchQuery);
  }

  function getStatusBadge(status?: string) {
    if (!status) {
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          No Reports
        </Badge>
      );
    }

    switch (status) {
      case 'clear':
        return (
          <Badge className="bg-status-passable text-white">
            {STATUS_LABELS[status as Status]}
          </Badge>
        );
      case 'rough':
        return (
          <Badge className="bg-status-caution text-white">
            {STATUS_LABELS[status as Status]}
          </Badge>
        );
      case 'impassable':
        return (
          <Badge className="bg-status-not-passable text-white">
            {STATUS_LABELS[status as Status]}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            No Reports
          </Badge>
        );
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    const days = Math.floor(diffHours / 24);
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search trails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 bg-card border-border"
            />
          </div>
          <Button type="submit" className="h-11 px-6">
            Search
          </Button>
        </div>
      </form>

      {/* Trail List */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : trails.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-base">No trails found.</p>
          {searchQuery && (
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery('');
                loadTrails();
              }}
              className="mt-2 text-primary"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {trails.map((trail) => (
            <Link key={trail.id} href={`/trails/${trail.id}`}>
              <Card className="p-4 transition-colors hover:bg-card/80 cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[18px] font-semibold text-foreground mb-2 truncate group-hover:text-primary transition-colors">
                      {trail.name}
                    </h2>
                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadge(trail.latestStatus)}
                      {trail.lastReportAt && (
                        <span className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDate(trail.lastReportAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
