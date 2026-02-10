'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ArrowRight, Loader2, X } from 'lucide-react';
import { trailService } from '@/services/trailService';
import { Trail, Status, VEHICLE_CATEGORIES } from '@/types';
import { useVehicle } from '@/contexts/VehicleContext';

// ============================================================================
// Platform Detection Utilities
// ============================================================================

function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(
      typeof navigator !== 'undefined' &&
        /Mac|iPod|iPhone|iPad/.test(navigator.platform)
    );
  }, []);

  return isMac;
}

function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      typeof window !== 'undefined' &&
        window.matchMedia('(pointer: coarse)').matches
    );
  }, []);

  return isTouch;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// ============================================================================
// Shared UI Components
// ============================================================================

// Viewfinder corner component - matches browse page aesthetic
function ViewfinderCorner({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) {
  const rotations = {
    tl: 'rotate-0',
    tr: 'rotate-90',
    br: 'rotate-180',
    bl: '-rotate-90',
  };

  const positions = {
    tl: 'top-3 left-3',
    tr: 'top-3 right-3',
    bl: 'bottom-3 left-3',
    br: 'bottom-3 right-3',
  };

  return (
    <svg
      className={`absolute ${positions[position]} ${rotations[position]} w-4 h-4 text-action-orange`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 4 L4 10" />
      <path d="M4 4 L10 4" />
      <path d="M7 4 L7 5" />
      <path d="M4 7 L5 7" />
    </svg>
  );
}

// Scanline overlay for CRT/LCD effect
function ScanlineOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 rounded-sm"
      style={{
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(0, 0, 0, 0.015) 2px,
          rgba(0, 0, 0, 0.015) 4px
        )`,
      }}
    />
  );
}

// Mini segmented gauge for search results
function MiniGauge({ score }: { score: number }) {
  const filledBlocks = Math.round(score * 5);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((level) => (
        <div
          key={level}
          className={`w-1.5 h-3 rounded-[1px] ${
            level <= filledBlocks ? 'bg-action-orange' : 'bg-stone-border'
          }`}
        />
      ))}
    </div>
  );
}

// Status indicator block
function StatusIndicator({ status }: { status: Status | undefined }) {
  const config = {
    clear: { bg: 'bg-status-clear', label: 'CLR' },
    rough: { bg: 'bg-status-rough', label: 'RGH' },
    impassable: { bg: 'bg-status-impassable', label: 'IMP' },
  };

  const { bg, label } = status ? config[status] : { bg: 'bg-muted-stone', label: 'UNK' };

  return (
    <span
      className={`px-2 py-0.5 rounded-[2px] font-mono text-[9px] font-bold uppercase tracking-wider text-white ${bg}`}
    >
      {label}
    </span>
  );
}

// Calculate match score based on vehicle capability
function calculateMatchScore(trail: Trail, vehicleType: string | null): number {
  if (!vehicleType) return 0.5;

  const category = VEHICLE_CATEGORIES.find(cat => cat.mappedType === vehicleType);
  if (!category) return 0.5;

  const baseScore = category.capabilityLevel / 4;

  if (trail.latestStatus === 'clear') return Math.min(1, baseScore + 0.3);
  if (trail.latestStatus === 'rough') return baseScore;
  if (trail.latestStatus === 'impassable') return Math.max(0.2, baseScore - 0.2);

  return 0.5;
}

// ============================================================================
// Keyboard Badge Component (Cross-Platform)
// ============================================================================

export function KeyboardBadge({ className = '' }: { className?: string }) {
  const isMac = useIsMac();
  const isTouch = useIsTouchDevice();

  // Hide on touch devices
  if (isTouch) return null;

  return (
    <kbd
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[2px] bg-stone-light border border-stone-border font-mono text-[9px] text-stone-medium ${className}`}
    >
      {isMac ? '⌘' : 'Ctrl+'}K
    </kbd>
  );
}

// ============================================================================
// Search Result Item Component
// ============================================================================

interface SearchResultProps {
  trail: Trail;
  selectedVehicle: string | null;
  onSelect: () => void;
  isSelected?: boolean;
  isNavigating?: boolean;
}

function SearchResult({ trail, selectedVehicle, onSelect, isSelected, isNavigating }: SearchResultProps) {
  const matchScore = calculateMatchScore(trail, selectedVehicle);

  return (
    <button
      onClick={onSelect}
      disabled={isNavigating}
      className={`w-full text-left px-4 py-3 rounded-sm cursor-pointer transition-all ${
        isSelected
          ? 'bg-white border border-stone-border shadow-[2px_2px_0_0_var(--color-stone-border)]'
          : 'border border-transparent hover:bg-white hover:border-stone-border'
      } ${isNavigating ? 'animate-pulse' : ''}`}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Trail Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {isNavigating ? (
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-action-orange animate-pulse">
                Loading...
              </span>
            ) : (
              <h4 className="font-bold text-deep-stone truncate">
                {trail.name}
              </h4>
            )}
            {!isNavigating && <StatusIndicator status={trail.latestStatus} />}
          </div>
          {!isNavigating && (
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="h-3 w-3 text-muted-stone flex-shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-stone truncate">
                {trail.region}
              </span>
            </div>
          )}
        </div>

        {/* Match Gauge or Loading Indicator */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isNavigating ? (
            <Loader2 className="h-4 w-4 text-action-orange animate-spin" />
          ) : (
            <>
              {selectedVehicle && <MiniGauge score={matchScore} />}
              <ArrowRight className="h-4 w-4 text-muted-stone" />
            </>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// Main CommandBar Component
// ============================================================================

interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandBar({ open, onOpenChange }: CommandBarProps) {
  const router = useRouter();
  const { selectedVehicle } = useVehicle();
  const [query, setQuery] = useState('');
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(false);
  const [indexed, setIndexed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [flicker, setFlicker] = useState(false);
  const [poweringDown, setPoweringDown] = useState(false);
  const [navigatingId, setNavigatingId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const isMobile = useIsMobile();
  const isMac = useIsMac();
  const isTouch = useIsTouchDevice();

  // Power down animation before closing (100ms fade)
  const handleClose = useCallback(() => {
    setPoweringDown(true);
    setTimeout(() => {
      setPoweringDown(false);
      onOpenChange(false);
    }, 100);
  }, [onOpenChange]);

  // Global ESC key listener
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [open, handleClose]);

  // Auto-focus input when opened
  useEffect(() => {
    if (open && !poweringDown) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (isMobile) {
          mobileInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, poweringDown, isMobile]);

  // Trigger flicker animation when results update
  const triggerFlicker = useCallback(() => {
    setFlicker(true);
    setTimeout(() => setFlicker(false), 100);
  }, []);

  // Fetch trails on search
  const searchTrails = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setTrails([]);
      return;
    }

    setLoading(true);
    try {
      const results = await trailService.getTrails(searchQuery);
      setTrails(results.slice(0, 8));
      setIndexed(true);
      setSelectedIndex(0);
      triggerFlicker(); // Hardware flicker effect
    } catch (error) {
      console.error('Search failed:', error);
      setTrails([]);
    } finally {
      setLoading(false);
    }
  }, [triggerFlicker]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchTrails(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, searchTrails]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setTrails([]);
      setSelectedIndex(0);
      setNavigatingId(null);
    }
  }, [open]);

  // Handle trail selection with loading flicker effect
  const handleSelect = useCallback((trailId: string) => {
    // Set navigating state to show "Loading..." flicker
    setNavigatingId(trailId);

    // Brief flicker delay for "Data Transfer" effect, then close and navigate
    setTimeout(() => {
      onOpenChange(false);
      router.push(`/trails/${trailId}`);
    }, 150);
  }, [onOpenChange, router]);

  // Handle search submit
  const handleSearchSubmit = useCallback(() => {
    if (trails.length > 0) {
      handleSelect(trails[selectedIndex].id);
    } else if (query.trim()) {
      onOpenChange(false);
      router.push(`/trails/search?q=${encodeURIComponent(query.trim())}`);
    }
  }, [trails, selectedIndex, query, handleSelect, onOpenChange, router]);

  // Keyboard navigation for desktop
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, trails.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  }, [trails.length, handleSearchSubmit]);

  // System status text - changes based on loading state
  const systemStatus = useMemo(() => {
    const shortcut = isMac ? '⌘K' : 'CTRL+K';
    const status = loading ? 'INDEXING' : indexed ? 'INDEXED' : 'READY';
    return `[SYSTEM STATUS: ${status}] // ${isTouch ? 'TAP' : shortcut} TO SEARCH`;
  }, [indexed, loading, isMac, isTouch]);

  // ============================================================================
  // Mobile: Bottom Sheet using Vaul
  // ============================================================================
  if (isMobile) {
    return (
      <Drawer.Root open={open && !poweringDown} onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else onOpenChange(isOpen);
      }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-deep-stone/40 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[101] outline-none">
            <div
              className="bg-bone border-t border-stone-border rounded-t-sm overflow-hidden max-h-[85vh] flex flex-col safe-bottom transition-opacity duration-100"
              style={{ opacity: poweringDown ? 0.4 : 1 }}
            >
              {/* Scanline overlay */}
              <ScanlineOverlay />

              {/* Drag Handle */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-12 h-1 rounded-sm bg-stone-medium" />
              </div>

              {/* Header with Close Button */}
              <div className="relative z-20 flex items-center justify-between px-5 pb-3">
                <Drawer.Title className="font-mono text-xs font-bold uppercase tracking-wider text-muted-stone">
                  Search Trails
                </Drawer.Title>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-sm hover:bg-stone-light transition-colors"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5 text-muted-stone" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative z-20 flex items-center gap-3 px-5 py-3 border-y border-stone-border bg-white">
                {loading ? (
                  <Loader2 className="h-5 w-5 text-action-orange animate-spin flex-shrink-0" />
                ) : (
                  <Search className="h-5 w-5 text-muted-stone flex-shrink-0" />
                )}
                <input
                  ref={mobileInputRef}
                  type="search"
                  inputMode="search"
                  enterKeyHint="go"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                  placeholder="Search trails by name..."
                  className="flex-1 bg-transparent text-deep-stone placeholder:text-muted-stone text-base font-medium focus:outline-none"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
              </div>

              {/* Results List - with hardware flicker effect */}
              <div
                className="relative z-20 flex-1 overflow-y-auto py-2 px-3 transition-opacity duration-100"
                style={{ opacity: flicker ? 0.4 : 1 }}
              >
                {query.trim() && trails.length === 0 && !loading && (
                  <div className="px-4 py-8 text-center">
                    <span className="font-mono text-xs uppercase tracking-wider text-muted-stone">
                      No trails found for &quot;{query}&quot;
                    </span>
                    <p className="mt-2 text-sm text-charcoal">
                      Tap Go to search all trails
                    </p>
                  </div>
                )}

                {trails.map((trail, index) => (
                  <SearchResult
                    key={trail.id}
                    trail={trail}
                    selectedVehicle={selectedVehicle}
                    onSelect={() => handleSelect(trail.id)}
                    isSelected={index === selectedIndex}
                    isNavigating={navigatingId === trail.id}
                  />
                ))}
              </div>

              {/* Footer - System Status */}
              <Drawer.Description className="relative z-20 px-5 py-3 border-t border-stone-border bg-stone-light/50">
                <span className="font-mono text-[8px] uppercase tracking-widest text-stone-medium select-none">
                  {systemStatus} // TR-CMD v1.0
                </span>
              </Drawer.Description>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // ============================================================================
  // Desktop: Modal using cmdk
  // ============================================================================
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: poweringDown ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-deep-stone/50 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Command Modal - with power-down fade effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{
              opacity: poweringDown ? 0 : 1,
              scale: poweringDown ? 0.98 : 1,
              y: poweringDown ? -5 : 0
            }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101] px-4"
          >
            <div className="relative bg-bone border border-stone-border rounded-sm shadow-[4px_4px_0_0_var(--color-stone-border)] overflow-hidden">
              {/* Scanline overlay */}
              <ScanlineOverlay />

              {/* Viewfinder corners */}
              <ViewfinderCorner position="tl" />
              <ViewfinderCorner position="tr" />
              <ViewfinderCorner position="bl" />
              <ViewfinderCorner position="br" />

              <Command
                className="relative z-20"
                shouldFilter={false}
                onKeyDown={handleKeyDown}
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-border">
                  {loading ? (
                    <Loader2 className="h-5 w-5 text-action-orange animate-spin" />
                  ) : (
                    <Search className="h-5 w-5 text-muted-stone" />
                  )}
                  <Command.Input
                    ref={inputRef}
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search trails by name..."
                    className="flex-1 bg-transparent text-deep-stone placeholder:text-muted-stone text-base font-medium focus:outline-none"
                  />
                  {!isTouch && (
                    <kbd className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-stone-light border border-stone-border font-mono text-[10px] text-muted-stone">
                      ESC
                    </kbd>
                  )}
                </div>

                {/* Results List */}
                {/* Results List - with hardware flicker effect */}
                <Command.List
                  className="max-h-[320px] overflow-y-auto py-2 transition-opacity duration-100"
                  style={{ opacity: flicker ? 0.4 : 1 }}
                >
                  {query.trim() && trails.length === 0 && !loading && (
                    <Command.Empty className="px-5 py-8 text-center">
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-stone">
                        No trails found for &quot;{query}&quot;
                      </span>
                      <p className="mt-2 text-sm text-charcoal">
                        Press Enter to search all trails
                      </p>
                    </Command.Empty>
                  )}

                  {trails.map((trail, index) => {
                    const matchScore = calculateMatchScore(trail, selectedVehicle);
                    const isNavigating = navigatingId === trail.id;

                    return (
                      <Command.Item
                        key={trail.id}
                        value={trail.id}
                        onSelect={() => handleSelect(trail.id)}
                        disabled={!!navigatingId}
                        className={`mx-2 px-4 py-3 rounded-sm cursor-pointer transition-all border ${
                          index === selectedIndex
                            ? 'bg-white border-stone-border shadow-[2px_2px_0_0_var(--color-stone-border)]'
                            : 'border-transparent data-[selected=true]:bg-white data-[selected=true]:border-stone-border data-[selected=true]:shadow-[2px_2px_0_0_var(--color-stone-border)]'
                        } ${isNavigating ? 'animate-pulse' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Trail Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              {isNavigating ? (
                                <span className="font-mono text-xs font-bold uppercase tracking-wider text-action-orange animate-pulse">
                                  Loading...
                                </span>
                              ) : (
                                <h4 className="font-bold text-deep-stone truncate">
                                  {trail.name}
                                </h4>
                              )}
                              {!isNavigating && <StatusIndicator status={trail.latestStatus} />}
                            </div>
                            {!isNavigating && (
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-3 w-3 text-muted-stone flex-shrink-0" />
                                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-stone truncate">
                                  {trail.region}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Match Gauge or Loading Indicator */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {isNavigating ? (
                              <Loader2 className="h-4 w-4 text-action-orange animate-spin" />
                            ) : (
                              <>
                                {selectedVehicle && <MiniGauge score={matchScore} />}
                                <ArrowRight className="h-4 w-4 text-muted-stone" />
                              </>
                            )}
                          </div>
                        </div>
                      </Command.Item>
                    );
                  })}
                </Command.List>

                {/* Footer - System Status */}
                <div className="px-5 py-3 border-t border-stone-border bg-stone-light/50">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-stone-medium select-none">
                      {systemStatus}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-stone-medium">
                      TR-CMD v1.0
                    </span>
                  </div>
                </div>
              </Command>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Hook for global keyboard shortcut with focus management
// ============================================================================

export function useCommandBar() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Store the trigger element when opening
  const handleOpen = useCallback((isOpen: boolean) => {
    if (isOpen) {
      // Store currently focused element to restore later
      triggerRef.current = document.activeElement as HTMLElement;
    } else {
      // Restore focus to trigger element when closing
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 50);
    }
    setOpen(isOpen);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // CMD+K on Mac, CTRL+K on Windows/Linux
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpen(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, handleOpen]);

  return { open, setOpen: handleOpen };
}
