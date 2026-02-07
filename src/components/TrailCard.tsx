"use client";

import { cn } from "@/lib/utils";
import { MapPin, ArrowRight, Clock } from "lucide-react";
import { Trail, Status, STATUS_LABELS } from "@/types";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface TrailCardProps {
  trail: Trail;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  clear: { label: "Passable", className: "bg-success/15 text-success" },
  rough: { label: "Caution", className: "bg-warning/15 text-warning-foreground" },
  impassable: { label: "Not Passable", className: "bg-destructive/15 text-destructive" },
};

export function TrailCard({ trail, className }: TrailCardProps) {
  const status = trail.latestStatus ? statusConfig[trail.latestStatus] : null;
  const lastReportText = trail.lastReportAt
    ? formatDistanceToNow(new Date(trail.lastReportAt), { addSuffix: true })
    : null;

  return (
    <Link
      href={`/trails/${trail.id}`}
      className={cn(
        "block w-full text-left bg-card rounded-2xl p-4 shadow-soft hover:shadow-medium transition-all duration-200 group active:scale-[0.99]",
        className
      )}
    >
      <div className="flex gap-4">
        {/* Trail Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-card-foreground truncate">
              {trail.name}
            </h3>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{trail.region}</span>
          </div>

          {/* Last Report Time */}
          {lastReportText && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Clock className="h-3.5 w-3.5" />
              <span>Updated {lastReportText}</span>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            {status ? (
              <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", status.className)}>
                {status.label}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                No Reports
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Compact variant for lists (e.g., map panel)
export function TrailCardCompact({ trail, className }: TrailCardProps) {
  const status = trail.latestStatus ? statusConfig[trail.latestStatus] : null;

  return (
    <Link
      href={`/trails/${trail.id}`}
      className={cn(
        "block w-full text-left bg-card rounded-xl p-3 shadow-soft hover:shadow-medium transition-all duration-200 group active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-sm text-card-foreground truncate mb-0.5">
            {trail.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            {trail.region}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {status ? (
            <span className={cn("px-2 py-0.5 rounded-md text-xs font-medium", status.className)}>
              {status.label}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
              Unknown
            </span>
          )}
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}
