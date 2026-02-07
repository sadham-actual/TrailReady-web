"use client";

import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, WifiOff, X } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";

interface MapControlsProps {
  onSearchClick?: () => void;
  onFilterClick?: () => void;
  isOffline?: boolean;
  className?: string;
}

export function MapControls({
  onSearchClick,
  onFilterClick,
  isOffline = false,
  className,
}: MapControlsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="mapControl"
        size="icon"
        onClick={onSearchClick}
        aria-label="Search trails"
      >
        <Search className="h-5 w-5" />
      </Button>

      <Button
        variant="mapControl"
        size="icon"
        onClick={onFilterClick}
        aria-label="Filter trails"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </Button>

      {isOffline && (
        <div className="glass px-3 py-2 rounded-xl flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-warning" />
          <span className="text-xs font-medium">Offline</span>
        </div>
      )}
    </div>
  );
}

// Search overlay component
interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  suggestedRegions?: string[];
}

export function SearchOverlay({
  isOpen,
  onClose,
  onSearch,
  suggestedRegions = ["Moab, Utah", "Big Bend, Texas", "Rubicon Trail", "Sedona, Arizona"]
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");

  if (!isOpen) return null;

  const handleSearch = (searchQuery: string) => {
    onSearch?.(searchQuery);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="container max-w-lg mx-auto pt-4 p-4 safe-top">
        <div className="bg-card rounded-2xl shadow-large p-4 animate-scale-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search trails, regions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick suggestions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              Popular Regions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedRegions.map((region) => (
                <button
                  key={region}
                  onClick={() => handleSearch(region)}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
                >
                  {region}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
