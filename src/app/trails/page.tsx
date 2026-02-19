'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Map,
  List,
  Search,
  Filter,
  Mountain,
  MapPin,
  Clock,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { Trail } from '@/types';
import { trailService } from '@/services/trailService';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Difficulty config
const DIFFICULTY = {
  1: { label: 'Easy', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  2: { label: 'Moderate', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  3: { label: 'Difficult', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  4: { label: 'Extreme', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
} as const;

const STATUS_CONFIG = {
  clear: { label: 'Passable', Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  rough: { label: 'Caution', Icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  impassable: { label: 'Blocked', Icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  unknown: { label: 'No Data', Icon: HelpCircle, color: 'text-stone-500', bg: 'bg-stone-50' },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

function getStatusConfig(status?: string) {
  const key = (status ?? 'unknown') as StatusKey;
  return STATUS_CONFIG[key] ?? STATUS_CONFIG.unknown;
}

function getDifficultyConfig(level?: number) {
  const key = (level ?? 0) as keyof typeof DIFFICULTY;
  return DIFFICULTY[key] ?? { label: 'Unknown', color: 'text-stone-500', bg: 'bg-stone-50 border-stone-200' };
}

function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(h / 24);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

// TrailCard component
function TrailCard({ trail, index }: { trail: Trail; index: number }) {
  const statusCfg = getStatusConfig(trail.latestStatus);
  const diffCfg = getDifficultyConfig((trail as { baseDifficulty?: number }).baseDifficulty);
  const StatusIcon = statusCfg.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Link
        href={`/trails/${trail.id}`}
        className="block group bg-white border border-stone-200 hover:border-stone-400 hover:shadow-md transition-all duration-200 rounded-sm overflow-hidden"
      >
        {/* Status bar across top */}
        <div className={`h-1 w-full ${
          trail.latestStatus === 'clear' ? 'bg-emerald-500' :
          trail.latestStatus === 'rough' ? 'bg-amber-500' :
          trail.latestStatus === 'impassable' ? 'bg-rose-500' :
          'bg-stone-200'
        }`} />

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="font-mono font-bold uppercase tracking-wider text-stone-900 text-sm truncate group-hover:text-action-orange transition-colors">
                {trail.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="h-3 w-3 text-stone-400 flex-shrink-0" />
                <span className="text-xs text-stone-500 font-mono uppercase tracking-wider truncate">
                  {trail.region}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-action-orange flex-shrink-0 mt-0.5 transition-colors" />
          </div>

          {/* Status + Difficulty badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-wider ${statusCfg.bg} ${statusCfg.color} border-current/20`}>
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </div>

            {(trail as { baseDifficulty?: number }).baseDifficulty && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm border text-[10px] font-mono font-bold uppercase tracking-wider ${diffCfg.bg} ${diffCfg.color}`}>
                <Mountain className="h-3 w-3" />
                D{(trail as { baseDifficulty?: number }).baseDifficulty} · {diffCfg.label}
              </div>
            )}

            {trail.lastReportAt && (
              <div className="ml-auto inline-flex items-center gap-1 text-[10px] text-stone-400 font-mono">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(trail.lastReportAt)}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Region filter pill
function RegionPill({
  region,
  active,
  onClick,
}: {
  region: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-sm border font-mono text-[10px] uppercase tracking-wider font-medium transition-all ${
        active
          ? 'bg-stone-900 text-white border-stone-900'
          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
      }`}
    >
      {region}
    </button>
  );
}

export default function TrailBrowsePage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  useEffect(() => {
    trailService.getTrails().then((data) => {
      setTrails(data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  // Unique regions from data
  const regions = useMemo(
    () => Array.from(new Set(trails.map((t) => t.region))).sort(),
    [trails]
  );

  // Filtered + searched trails
  const filtered = useMemo(() => {
    let result = [...trails];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.region.toLowerCase().includes(q)
      );
    }
    if (activeRegion) {
      result = result.filter((t) => t.region === activeRegion);
    }
    if (activeStatus) {
      result = result.filter((t) => (t.latestStatus ?? 'unknown') === activeStatus);
    }
    return result;
  }, [trails, search, activeRegion, activeStatus]);

  return (
    <div className="min-h-screen bg-bone">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 bg-bone/95 backdrop-blur-sm border-b border-stone-200"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider hidden sm:inline">Back</span>
          </Link>
          <div className="h-4 w-px bg-stone-200" />
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-action-orange" />
            <h1 className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900">
              Trail Index
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/map"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 bg-white hover:border-action-orange hover:text-action-orange text-stone-700 font-mono text-[10px] uppercase tracking-wider rounded-sm transition-all"
            >
              <Map className="h-3.5 w-3.5" />
              Map View
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search + filter bar */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trails or regions..."
              className="pl-9 font-mono text-sm border-stone-200 focus:border-action-orange rounded-sm"
            />
          </div>

          {/* Region filters */}
          {regions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-3.5 w-3.5 text-stone-400 flex-shrink-0" />
              <RegionPill
                region="All"
                active={activeRegion === null}
                onClick={() => setActiveRegion(null)}
              />
              {regions.map((r) => (
                <RegionPill
                  key={r}
                  region={r}
                  active={activeRegion === r}
                  onClick={() => setActiveRegion(activeRegion === r ? null : r)}
                />
              ))}
            </div>
          )}

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {['clear', 'rough', 'impassable'].map((s) => {
              const cfg = getStatusConfig(s);
              const Icon = cfg.Icon;
              return (
                <button
                  key={s}
                  onClick={() => setActiveStatus(activeStatus === s ? null : s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border font-mono text-[10px] uppercase tracking-wider font-medium transition-all ${
                    activeStatus === s
                      ? `${cfg.bg} ${cfg.color} border-current/30`
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            {isLoading ? 'Loading...' : `${filtered.length} trail${filtered.length !== 1 ? 's' : ''}`}
            {(search || activeRegion || activeStatus) ? ' · filtered' : ''}
          </p>
          {(search || activeRegion || activeStatus) && (
            <button
              onClick={() => { setSearch(''); setActiveRegion(null); setActiveStatus(null); }}
              className="font-mono text-[10px] uppercase tracking-wider text-action-orange hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Trail grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-stone-100 border border-stone-200 rounded-sm animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Mountain className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <p className="font-mono text-sm uppercase tracking-wider text-stone-500 mb-2">No trails found</p>
            <p className="text-stone-400 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((trail, i) => (
              <TrailCard key={trail.id} trail={trail} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
