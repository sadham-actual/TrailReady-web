'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Map } from 'lucide-react';
import { motion } from 'framer-motion';

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

function MapContent() {
  const searchParams = useSearchParams();
  const focusTrailId = searchParams.get('id');

  return (
    <div className="flex-1 relative">
      <DiscoveryMap focusTrailId={focusTrailId} />
    </div>
  );
}

export default function MapPage() {
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
          <span className="hidden md:block font-mono text-[10px] uppercase tracking-wider text-muted-stone">
            Topographic Intel Layer
          </span>
          <div className="w-2 h-2 rounded-full bg-status-clear animate-pulse" />
        </div>
      </motion.header>

      {/* Map Container - Full Height */}
      <Suspense fallback={
        <div className="flex-1 relative bg-stone-light flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-action-orange border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs uppercase tracking-wider text-muted-stone">
              Loading Map...
            </p>
          </div>
        </div>
      }>
        <MapContent />
      </Suspense>
    </div>
  );
}
