'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { trailService } from '@/services/trailService';
import { Trail, STATUS_LABELS, Status } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, MapPin, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function TrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  async function handleSearch() {
    setIsLoading(true);
    try {
      const data = await trailService.getTrails(searchQuery);
      setTrails(data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusBadge(status?: string) {
    const baseClasses = "px-3 py-1 text-sm font-medium gap-1.5";
    switch (status) {
      case 'clear':
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {STATUS_LABELS[status as Status]}
          </Badge>
        );
      case 'rough':
        return (
          <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/30`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            {STATUS_LABELS[status as Status]}
          </Badge>
        );
      case 'impassable':
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30`}>
            <XCircle className="h-3.5 w-3.5" />
            {STATUS_LABELS[status as Status]}
          </Badge>
        );
      default:
        return <Badge variant="secondary" className={baseClasses}>No reports</Badge>;
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
    return date.toLocaleDateString();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Browse Trails</h1>
        <p className="text-muted-foreground">
          Find trails and check their current conditions
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search trails by name or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 h-11"
          />
        </div>
        <Button onClick={handleSearch} className="h-11 px-6">
          Search
        </Button>
      </div>

      {/* Trail List */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : trails.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No trails found.</p>
          {searchQuery && (
            <Button variant="link" onClick={() => { setSearchQuery(''); loadTrails(); }} className="mt-2">
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trails.map((trail) => (
            <Link key={trail.id} href={`/trails/${trail.id}`}>
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary/20 cursor-pointer group">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {trail.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-sm">
                    <MapPin className="h-4 w-4" />
                    {trail.region}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(trail.latestStatus)}
                    {trail.lastReportAt && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {formatDate(trail.lastReportAt)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
