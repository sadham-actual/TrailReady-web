'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Map, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Trail } from '@/types';
import { CommandBar, useCommandBar } from '@/components/CommandBar';

// Dynamic import for Leaflet (SSR incompatible)
const DiscoveryMap = dynamic(
  () => import('@/components/DiscoveryMap').then((mod) => mod.DiscoveryMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-stone-light flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-action-orange border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">
            Initializing Map Engine...
          </p>
        </div>
      </div>
    ),
  }
);

function MapContent({
  focusTrailId,
  searchQuery,
  onFilteredTrailsChange,
  locate,
}: {
  focusTrailId?: string | null;
  searchQuery?: string | null;
  onFilteredTrailsChange?: (trails: Trail[]) => void;
  locate?: boolean;
}) {
  return (
    <div className="flex-1 min-h-0 relative">
      <DiscoveryMap
        focusTrailId={focusTrailId}
        searchQuery={searchQuery}
        onFilteredTrailsChange={onFilteredTrailsChange}
        locate={locate}
      />
    </div>
  );
}

export default function MapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q');
  const idParam = searchParams.get('id');
  const locate = searchParams.get('locate') === 'true';
  const { open: searchOpen, setOpen: setSearchOpen } = useCommandBar();

  const [listOpen, setListOpen] = useState(false);
  const [focusTrailId, setFocusTrailId] = useState<string | null>(idParam);
  const [filteredTrails, setFilteredTrails] = useState<Trail[]>([]);

  useEffect(() => {
    setFocusTrailId(idParam);
  }, [idParam]);

  // BROWSE: clear all filters and reset to default map view
  const handleBrowse = () => {
    setFocusTrailId(null);
    // If we have query params, navigate to clean /map URL
    if (searchQuery || idParam) {
      router.push('/map');
    }
  };

  const trailCountLabel = useMemo(() => {
    return `${filteredTrails.length} Trail${filteredTrails.length === 1 ? '' : 's'}`;
  }, [filteredTrails.length]);

  const handleTrailClick = (trailId: string) => {
    setFocusTrailId(trailId);
  };

  return (
    <div className="h-screen flex flex-col bg-bone">
      {/* Header Bar */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-stone-border bg-surface"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-stone hover:text-deep-stone transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-wider hidden sm:inline">
              Back
            </span>
          </Link>
          <div className="h-5 w-px bg-stone-border" />
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-action-orange" />
            <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-deep-stone">
              Tactical Discovery Map
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBrowse}
            className="px-3 py-2 border border-stone-800 bg-stone-100 font-mono text-[10px] uppercase tracking-wider text-stone-900 rounded-none transition-colors hover:text-orange-600 hover:border-orange-600"
          >
            Browse
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 border border-stone-800 bg-stone-100 font-mono text-[10px] uppercase tracking-wider text-stone-900 rounded-none transition-colors hover:text-orange-600 hover:border-orange-600"
          >
            <Search className="w-3.5 h-3.5" />
            Search
          </button>
          <button
            type="button"
            onClick={() => setListOpen((open) => !open)}
            className="flex items-center gap-2 px-3 py-2 border border-stone-800 bg-stone-100 text-stone-900 font-mono text-[10px] uppercase tracking-wider rounded-none hover:bg-stone-50 transition-colors"
            aria-label="Toggle trail list"
          >
            <List className="w-4 h-4 text-action-orange" />
            Trail List
          </button>
          <span className="hidden md:block font-mono text-[10px] uppercase tracking-wider text-muted-stone">
            Topographic Intel Layer
          </span>
          <div className="w-2 h-2 rounded-full bg-status-clear animate-pulse" />
        </div>
      </motion.header>

      {/* Map Container - Full Height */}
      <div className="flex-1 min-h-0 flex">
        <Suspense
          fallback={
            <div className="flex-1 relative bg-stone-light flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-action-orange border-t-transparent rounded-full animate-spin" />
                <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">
                  Loading Map...
                </p>
              </div>
            </div>
          }
        >
          <MapContent
            focusTrailId={focusTrailId}
            searchQuery={searchQuery}
            onFilteredTrailsChange={setFilteredTrails}
            locate={locate}
          />
        </Suspense>

        {/* Desktop Trail List Panel */}
        <div
          className={`hidden md:flex flex-col bg-stone-100 border-l border-stone-800 transition-all duration-200 ${
            listOpen ? 'w-80' : 'w-10'
          }`}
        >
          <div className="px-2 py-3 border-b border-stone-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setListOpen((open) => !open)}
              className="flex items-center justify-center h-6 w-6 border border-stone-800 bg-stone-50 hover:bg-stone-200 transition-colors"
              aria-label={listOpen ? 'Collapse trail list' : 'Expand trail list'}
            >
              {listOpen ? (
                <ChevronRight className="h-4 w-4 text-action-orange" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-action-orange" />
              )}
            </button>
            {listOpen && (
              <>
                <div className="font-mono text-xs uppercase tracking-wider text-stone-900">
                  Trail List
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-stone-700">
                  {trailCountLabel}
                </div>
              </>
            )}
          </div>
          {listOpen && (
            <div className="flex-1 overflow-y-auto">
              {filteredTrails.length === 0 ? (
                <div className="p-4 text-xs font-mono uppercase tracking-wider text-stone-700">
                  No trails match this filter.
                </div>
              ) : (
                filteredTrails.map((trail) => (
                  <button
                    key={trail.id}
                    type="button"
                    onClick={() => handleTrailClick(trail.id)}
                    className={`w-full text-left px-4 py-3 border-b border-stone-800 font-mono uppercase tracking-wider text-xs transition-colors ${
                      focusTrailId === trail.id
                        ? 'bg-stone-50 text-action-orange'
                        : 'text-stone-900 hover:bg-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">{trail.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {trail.baseDifficulty && (
                          <span className="text-[10px] text-stone-500">
                            D{trail.baseDifficulty}
                          </span>
                        )}
                        <span className="text-[10px] text-stone-700 truncate">{trail.region}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Mobile Trail List Sheet */}
        <div
          className={`md:hidden fixed left-0 right-0 bottom-0 z-[1100] bg-stone-100 border-t border-stone-800 transition-transform duration-200 ${
            listOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between">
            <div className="font-mono text-xs uppercase tracking-wider text-stone-900">
              Trail List
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-stone-700">
              {trailCountLabel}
            </div>
          </div>
          <div className="max-h-[55vh] overflow-y-auto">
            {filteredTrails.length === 0 ? (
              <div className="p-4 text-xs font-mono uppercase tracking-wider text-stone-700">
                No trails match this filter.
              </div>
            ) : (
              filteredTrails.map((trail) => (
                <button
                  key={trail.id}
                  type="button"
                  onClick={() => handleTrailClick(trail.id)}
                  className={`w-full text-left px-4 py-3 border-b border-stone-800 font-mono uppercase tracking-wider text-xs transition-colors ${
                    focusTrailId === trail.id
                      ? 'bg-stone-50 text-action-orange'
                      : 'text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{trail.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {trail.baseDifficulty && (
                        <span className="text-[10px] text-stone-500">
                          D{trail.baseDifficulty}
                        </span>
                      )}
                      <span className="text-[10px] text-stone-700 truncate">{trail.region}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      <CommandBar open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
