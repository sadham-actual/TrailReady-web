'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Map, Search, X, LocateFixed, LocateOff } from 'lucide-react';
import { Trail } from '@/types';
import { CommandBar, useCommandBar } from '@/components/CommandBar';

type GpsMode = 'off' | 'active' | 'following' | 'error';

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
  gpsMode,
  onGpsError,
}: {
  focusTrailId?: string | null;
  searchQuery?: string | null;
  onFilteredTrailsChange?: (trails: Trail[]) => void;
  locate?: boolean;
  gpsMode?: GpsMode;
  onGpsError?: () => void;
}) {
  return (
    <div className="flex-1 min-h-0 relative">
      <DiscoveryMap
        focusTrailId={focusTrailId}
        searchQuery={searchQuery}
        onFilteredTrailsChange={onFilteredTrailsChange}
        locate={locate}
        gpsMode={gpsMode}
        onGpsError={onGpsError}
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
  const [gpsMode, setGpsMode] = useState<GpsMode>('off');

  useEffect(() => {
    setFocusTrailId(idParam);
  }, [idParam]);

  const handleBrowse = () => {
    setFocusTrailId(null);
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

  const handleGpsToggle = useCallback(() => {
    setGpsMode((prev) => {
      if (prev === 'off' || prev === 'error') return 'active';
      if (prev === 'active') return 'following';
      return 'off';
    });
  }, []);

  const handleGpsError = useCallback(() => {
    setGpsMode('error');
  }, []);

  return (
    <div className="flex flex-col bg-bone" style={{ height: 'calc(100dvh - 4rem)' }}>
      {/* Header Bar */}
      <header className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-stone-border bg-surface">
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
          <div className="hidden sm:flex items-center gap-2">
            <Map className="w-4 h-4 text-action-orange" />
            <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-deep-stone">
              Tactical Discovery Map
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            type="button"
            onClick={handleGpsToggle}
            title={
              gpsMode === 'off' ? 'Enable GPS' :
              gpsMode === 'active' ? 'GPS on — tap to follow' :
              gpsMode === 'following' ? 'Following — tap to stop' :
              'GPS unavailable'
            }
            className={`inline-flex items-center gap-1.5 px-3 py-2 border font-mono text-[10px] uppercase tracking-wider rounded-none transition-all ${
              gpsMode === 'off'
                ? 'border-stone-800 bg-stone-100 text-stone-900 hover:text-orange-600 hover:border-orange-600'
                : gpsMode === 'active'
                ? 'border-blue-500 bg-blue-500 text-white'
                : gpsMode === 'following'
                ? 'border-blue-700 bg-blue-700 text-white'
                : 'border-red-400 bg-red-50 text-red-600'
            }`}
          >
            {gpsMode === 'error'
              ? <LocateOff className="w-3.5 h-3.5" />
              : <LocateFixed className={`w-3.5 h-3.5 ${gpsMode !== 'off' ? 'animate-pulse' : ''}`} />
            }
            <span className="hidden sm:inline">
              {gpsMode === 'off' && 'My Location'}
              {gpsMode === 'active' && 'GPS On'}
              {gpsMode === 'following' && 'Following'}
              {gpsMode === 'error' && 'No GPS'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setListOpen((open) => !open)}
            className="flex items-center gap-2 px-3 py-2 border border-stone-800 bg-stone-100 text-stone-900 font-mono text-[10px] uppercase tracking-wider rounded-none hover:bg-stone-50 transition-colors"
            aria-label="Toggle trail list"
          >
            <List className="w-4 h-4 text-action-orange" />
            <span className="hidden sm:inline">Trail List</span>
          </button>
          <div className="w-2 h-2 rounded-full bg-status-clear animate-pulse" />
        </div>
      </header>

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
            gpsMode={gpsMode}
            onGpsError={handleGpsError}
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
            <div className="flex items-center gap-3">
              <div className="font-mono text-[10px] uppercase tracking-wider text-stone-700">
                {trailCountLabel}
              </div>
              <button
                type="button"
                onClick={() => setListOpen(false)}
                className="flex items-center justify-center w-6 h-6 border border-stone-800 bg-stone-50 hover:bg-stone-200 transition-colors"
                aria-label="Close trail list"
              >
                <X className="w-3.5 h-3.5 text-stone-700" />
              </button>
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
                  onClick={() => { handleTrailClick(trail.id); setListOpen(false); }}
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
