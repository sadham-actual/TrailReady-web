import type { Status, Confidence } from '@/types';

/**
 * Global trail status labels used across all UI surfaces:
 * HeroSearch badges, Map status pills, Trail Detail cards
 */
export type GlobalTrailStatus = 'PASSABLE' | 'CHALLENGING' | 'NOT PASSABLE' | 'UNKNOWN' | 'NO DATA';

/**
 * Minimal report shape needed for status calculation.
 * Compatible with both Prisma models and client-side ConditionReport objects.
 */
export interface IntelReport {
  status: Status;
  confidence: Confidence;
  timestamp: string | Date;
}

/**
 * Result of the global status calculation
 */
export interface GlobalStatusResult {
  status: GlobalTrailStatus;
  internalStatus: 'passable' | 'high-risk' | 'impassable' | 'unknown';
  hasMixedReports: boolean;
  mixedReportReason?: string;
  reliabilityScore: number; // 0-100
  totalWeight: number;
  statusWeights: {
    clear: number;
    rough: number;
    impassable: number;
  };
}

/**
 * Confidence multipliers for report weighting
 *
 * HIGH   = 3x — Reporter is very confident in their assessment
 * MEDIUM = 2x — Standard confidence
 * LOW    = 1x — Uncertain / limited visibility
 */
const CONFIDENCE_MULTIPLIER: Record<Confidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Calculate recency weight for a report based on its age
 *
 * < 24 hours  = 2x — Fresh intel, highest priority
 * < 7 days    = 1x — Recent intel, standard weight
 * >= 7 days   = 0.5x — Aging intel, reduced weight
 */
function getRecencyWeight(timestamp: string | Date): number {
  const createdMs = new Date(timestamp).getTime();
  if (Number.isNaN(createdMs)) return 0.5;

  const ageHours = (Date.now() - createdMs) / (1000 * 60 * 60);

  // Reject future-dated reports (clock skew, malicious data)
  if (ageHours < 0) {
    console.warn(`Future-dated report detected: ${timestamp}`);
    return 0.1; // Minimal weight, not rejected entirely
  }

  if (ageHours < 24) return 2;
  if (ageHours < 168) return 1; // 7 days
  return 0.5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hasRecentReportWithinDays(reports: IntelReport[], days: number): boolean {
  if (!reports || !Array.isArray(reports)) return false;
  const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
  return reports.some((report) => {
    const reportMs = new Date(report.timestamp).getTime();
    return !Number.isNaN(reportMs) && reportMs >= cutoffMs;
  });
}

/**
 * Calculate the global trail status from condition reports.
 *
 * This is the single source of truth for trail status across the entire platform:
 * HeroSearch badges, Map status pills, and Trail Detail status cards all use this.
 *
 * Weighting formula per report:
 *   weight = CONFIDENCE_MULTIPLIER[confidence] × getRecencyWeight(timestamp)
 *
 * The weight is accumulated into the report's status bucket (clear, rough, impassable).
 * The bucket with the highest total weight determines the overall status.
 *
 * Conflict detection:
 *   Flagged when a HIGH-confidence impassable report coexists with a LOW-confidence clear.
 */
export function calculateGlobalStatus(reports: IntelReport[]): GlobalStatusResult {
  // Guard against null/undefined inputs
  if (!reports || !Array.isArray(reports) || reports.length === 0) {
    return {
      status: 'NO DATA',
      internalStatus: 'unknown',
      hasMixedReports: false,
      reliabilityScore: 0,
      totalWeight: 0,
      statusWeights: { clear: 0, rough: 0, impassable: 0 },
    };
  }

  // Decay factor guardrail:
  // If there is no intel in the last 30 days, force UNKNOWN to avoid stale seasonal misreads.
  if (!hasRecentReportWithinDays(reports, 30)) {
    return {
      status: 'UNKNOWN',
      internalStatus: 'unknown',
      hasMixedReports: false,
      reliabilityScore: 0,
      totalWeight: 0,
      statusWeights: { clear: 0, rough: 0, impassable: 0 },
    };
  }

  // Use the 5 most recent reports
  const recentReports = reports.slice(0, 5);

  // Filter and validate reports before processing
  const validReports = recentReports.filter((report) => {
    // Validate confidence level
    const validConfidences = ['high', 'medium', 'low'] as const;
    if (!validConfidences.includes(report.confidence)) {
      console.warn(`Invalid confidence level: ${report.confidence} - skipping report`);
      return false;
    }

    // Validate status
    const validStatuses = ['clear', 'rough', 'impassable'] as const;
    if (!validStatuses.includes(report.status)) {
      console.warn(`Invalid status: ${report.status} - skipping report`);
      return false;
    }

    // Validate timestamp
    const timestamp = new Date(report.timestamp).getTime();
    if (Number.isNaN(timestamp)) {
      console.warn(`Invalid timestamp: ${report.timestamp} - skipping report`);
      return false;
    }

    return true;
  });

  // Guard against all invalid reports scenario
  if (validReports.length === 0) {
    return {
      status: 'NO DATA',
      internalStatus: 'unknown',
      hasMixedReports: false,
      reliabilityScore: 0,
      totalWeight: 0,
      statusWeights: { clear: 0, rough: 0, impassable: 0 },
    };
  }

  const statusWeights = { clear: 0, rough: 0, impassable: 0 };
  let totalWeight = 0;

  // Conflict detection flags
  let hasHighConfidenceImpassable = false;
  let hasLowConfidenceClear = false;

  for (const report of validReports) {
    const weight =
      CONFIDENCE_MULTIPLIER[report.confidence] *
      getRecencyWeight(report.timestamp);

    statusWeights[report.status] += weight;
    totalWeight += weight;

    if (report.confidence === 'high' && report.status === 'impassable') {
      hasHighConfidenceImpassable = true;
    }
    if (report.confidence === 'low' && report.status === 'clear') {
      hasLowConfidenceClear = true;
    }
  }

  // Detect conflicting intel
  const hasMixedReports = hasHighConfidenceImpassable && hasLowConfidenceClear;
  const mixedReportReason = hasMixedReports
    ? 'High-confidence impassable report conflicts with low-confidence passable'
    : undefined;

  // Determine status from weighted scores
  let status: GlobalTrailStatus;
  let internalStatus: GlobalStatusResult['internalStatus'];

  if (
    statusWeights.impassable > statusWeights.clear &&
    statusWeights.impassable > statusWeights.rough
  ) {
    status = 'NOT PASSABLE';
    internalStatus = 'impassable';
  } else if (
    statusWeights.clear > statusWeights.impassable &&
    statusWeights.clear >= statusWeights.rough
  ) {
    status = 'PASSABLE';
    internalStatus = 'passable';
  } else if (statusWeights.rough > 0 || statusWeights.clear > 0) {
    status = 'CHALLENGING';
    internalStatus = 'high-risk';
  } else {
    status = 'NO DATA';
    internalStatus = 'unknown';
  }

  // Reliability: how much we trust this result (0-100)
  const dominance = totalWeight > 0 ? Math.max(statusWeights.clear, statusWeights.rough, statusWeights.impassable) / totalWeight : 0;
  const reportVolume = clamp(validReports.length / 5, 0, 1); // Use validReports, not recentReports
  const weightDensity = clamp(totalWeight / 24, 0, 1);

  // Guard against NaN contamination
  const finalDominance = Number.isNaN(dominance) ? 0 : dominance;
  const finalReportVolume = Number.isNaN(reportVolume) ? 0 : reportVolume;
  const finalWeightDensity = Number.isNaN(weightDensity) ? 0 : weightDensity;

  const reliabilityScore = Math.round(
    clamp((finalDominance * 0.6 + finalReportVolume * 0.25 + finalWeightDensity * 0.15) * 100, 0, 100)
  );

  // Final safety check
  if (Number.isNaN(reliabilityScore)) {
    console.error('Reliability score calculation produced NaN - defaulting to 0');
    return {
      status: 'NO DATA',
      internalStatus: 'unknown',
      hasMixedReports: false,
      reliabilityScore: 0,
      totalWeight: 0,
      statusWeights: { clear: 0, rough: 0, impassable: 0 },
    };
  }

  return {
    status,
    internalStatus,
    hasMixedReports,
    mixedReportReason,
    reliabilityScore,
    totalWeight,
    statusWeights,
  };
}

/**
 * Map a single DB status value to the user-facing global label.
 * Used as a fallback when only one report is available (e.g. simple search results).
 */
export function statusToGlobalLabel(status?: Status): GlobalTrailStatus {
  if (status === 'clear') return 'PASSABLE';
  if (status === 'rough') return 'CHALLENGING';
  if (status === 'impassable') return 'NOT PASSABLE';
  return 'NO DATA';
}
