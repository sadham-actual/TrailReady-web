'use client';

import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';

type TrailStatus = 'PASSABLE' | 'CHALLENGING' | 'NOT PASSABLE';

interface TrailSearchItem {
  id: string;
  name: string;
  status: TrailStatus;
}

const statusClasses: Record<TrailStatus, string> = {
  PASSABLE: 'border-emerald-700 text-emerald-700 bg-emerald-50',
  CHALLENGING: 'border-amber-700 text-amber-700 bg-amber-50',
  'NOT PASSABLE': 'border-rose-700 text-rose-700 bg-rose-50',
};

async function fetchTrailSearchResults(query: string): Promise<TrailSearchItem[]> {
  const response = await fetch(`/api/trails/search?query=${encodeURIComponent(query.trim())}`);
  const payload = await response.json();
  if (!payload?.success || !Array.isArray(payload.data)) {
    return [];
  }
  return payload.data as TrailSearchItem[];
}

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TrailSearchItem[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const requestIdRef = useRef(0);

  const handleQueryChange = async (value: string) => {
    setQuery(value);
    const trimmed = value.trim();

    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setActiveIndex(0);
      requestIdRef.current += 1;
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    const data = await fetchTrailSearchResults(value);
    if (requestId !== requestIdRef.current) return;

    setResults(data);
    setIsLoading(false);
    setActiveIndex(0);
  };

  const isOpen = useMemo(
    () => isFocused && query.trim().length > 0,
    [isFocused, query]
  );

  const submitSearch = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;
    router.push(`/map?q=${encodeURIComponent(normalized)}`);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (results[activeIndex]) {
      router.push(`/trails/${results[activeIndex].id}`);
      return;
    }
    submitSearch(query);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || (!isLoading && results.length === 0)) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, Math.max(results.length - 1, 0)));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
      <div
        className={`relative flex items-center bg-white border transition-all duration-200 ${
          isFocused
            ? 'border-action-orange shadow-[3px_3px_0_0_var(--color-action-orange)]'
            : 'border-stone-border shadow-[3px_3px_0_0_var(--color-stone-border)]'
        }`}
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-stone pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(event) => {
            void handleQueryChange(event.target.value);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 140)}
          onKeyDown={handleKeyDown}
          placeholder="SEARCH TRAIL INTEL..."
          className="h-14 w-full bg-transparent pl-14 pr-24 text-sm text-deep-stone placeholder:text-muted-stone focus:outline-none font-mono uppercase tracking-wider"
        />

        <button
          type="submit"
          className="mr-2 inline-flex h-10 self-center items-center gap-2 border border-action-orange-dark bg-action-orange px-4 font-mono text-xs font-bold uppercase tracking-wider text-stone-100 transition-colors hover:bg-action-orange-light"
        >
          Search
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 border border-stone-800 bg-stone-50 shadow-[3px_3px_0_0_var(--color-stone-border)]">
          <div className="border-b border-stone-300 px-3 py-2">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-stone-700">
              <Search className="h-3 w-3" />
              Search Results
            </span>
          </div>

          {isLoading && (
            <div className="px-4 py-5 font-mono text-xs uppercase tracking-wider text-muted-stone">
              Loading intel...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="px-4 py-5 font-mono text-xs uppercase tracking-wider text-muted-stone">
              NO RESULTS FOUND
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((trail, index) => {
                const isActive = index === activeIndex;
                return (
                  <li key={trail.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => router.push(`/trails/${trail.id}`)}
                      className={`flex w-full items-center justify-between border-b border-stone-200 px-3 py-3 text-left last:border-b-0 ${
                        isActive ? 'bg-stone-100' : 'bg-stone-50 hover:bg-stone-100'
                      }`}
                    >
                      <span className="font-mono text-xs font-semibold uppercase tracking-wider text-stone-900">
                        {trail.name}
                      </span>
                      <span
                        className={`border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${statusClasses[trail.status]}`}
                      >
                        {trail.status}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}
