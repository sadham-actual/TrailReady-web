import { ConditionReport, VehicleType, Status, Confidence, VEHICLE_CATEGORIES } from '@/types';

/**
 * Outcome status for a specific vehicle type
 * - passable: Recent clear reports indicate safe passage
 * - high-risk: Mixed or rough conditions reported
 * - impassable: Recent reports indicate trail is not passable
 * - baseline: No recent reports; verdict derived from trail's base difficulty rating
 * - unknown: No reports and no base difficulty available
 */
export type OutcomeStatus = 'passable' | 'high-risk' | 'impassable' | 'baseline' | 'unknown';

/**
 * Result of evaluating trail conditions for a specific vehicle type
 */
export interface VehicleOutcome {
  status: OutcomeStatus;
  confidence: Confidence;
  explanation: string;
  isBaseline?: boolean; // True when verdict is derived from baseDifficulty, not recent reports
  inheritedFrom?: {
    vehicleType: VehicleType;
    capabilityLevel: number;
    reportTimestamp: string;
  };
}

/**
 * Aggregate outcome across all vehicle types
 */
export interface TrailOutcomeSummary {
  passable: number;
  highRisk: number;
  impassable: number;
  unknown: number;
  label: 'passable' | 'mixed' | 'high-risk';
}

/**
 * Confidence score for weighting (higher = more weight)
 */
const CONFIDENCE_WEIGHT: Record<Confidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Threshold for considering reports "stale" (in days)
 * Reports older than this trigger baseline fallback logic
 */
export const STALE_REPORT_DAYS = 30;

/**
 * Threshold for considering a report "stale" for UI purposes (in days)
 * Reports older than this show a stale warning
 */
export const STALE_THRESHOLD_DAYS = 14;

/**
 * Threshold for considering a report "fresh" (in days)
 * Reports newer than this get a fresh indicator
 */
export const FRESH_THRESHOLD_DAYS = 7;

/**
 * Calculate report freshness flags
 */
export function getReportFreshness(timestamp: string | Date): {
  isFresh: boolean;
  isStale: boolean;
  ageInDays: number;
} {
  const reportTime = new Date(timestamp).getTime();
  const now = Date.now();
  const ageMs = now - reportTime;
  const ageInDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

  return {
    isFresh: ageInDays < FRESH_THRESHOLD_DAYS,
    isStale: ageInDays >= STALE_THRESHOLD_DAYS,
    ageInDays,
  };
}

/**
 * Get vehicle capability level (1-4) from vehicle type
 * Uses the VEHICLE_CATEGORIES mapping for the 4 simplified categories
 * Falls back to a direct mapping for other vehicle types
 */
export function getVehicleCapability(vehicleType: VehicleType): number {
  // Check simplified categories first
  const category = VEHICLE_CATEGORIES.find(cat => cat.mappedType === vehicleType);
  if (category) {
    return category.capabilityLevel;
  }

  // Fallback mapping for vehicle types not in simplified categories
  const fallbackCapability: Record<VehicleType, number> = {
    stockSUV_solidAxle: 1,
    stockSUV_IFS: 2,
    stockSUV_IFRS: 1,
    lifted4x4_solidAxle: 3,
    lifted4x4_IFS: 4,
    lifted4x4_IFRS: 3,
    sideBySide: 3,
    dirtBike: 4,
  };

  return fallbackCapability[vehicleType] ?? 2;
}

/**
 * Get human-readable label for capability level
 */
export function getCapabilityLabel(level: number): string {
  switch (level) {
    case 1: return 'Stock AWD';
    case 2: return 'High Clearance 4x4';
    case 3: return 'Modified 4x4';
    case 4: return 'Extreme Build';
    default: return 'Unknown';
  }
}

/**
 * Find an impassable report from a higher-capability vehicle that should
 * propagate down to the target vehicle type.
 *
 * Propagation rules:
 * - Only considers impassable reports from higher capability vehicles
 * - Must be within freshness threshold (30 days)
 * - Returns the highest-capability impassable report if multiple exist
 */
function findInheritedImpassable(
  reports: ConditionReport[],
  targetVehicleType: VehicleType
): {
  sourceVehicleType: VehicleType;
  capabilityLevel: number;
  report: ConditionReport;
} | null {
  const targetCapability = getVehicleCapability(targetVehicleType);
  const staleThresholdMs = STALE_REPORT_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Find all impassable reports from higher-capability vehicles that are fresh
  const higherImpassable = reports
    .filter(r => {
      const reportCapability = getVehicleCapability(r.vehicleType);
      const reportAge = now - new Date(r.timestamp).getTime();
      return (
        r.status === 'impassable' &&
        reportCapability > targetCapability &&
        reportAge <= staleThresholdMs
      );
    })
    .map(r => ({
      report: r,
      capabilityLevel: getVehicleCapability(r.vehicleType),
    }))
    // Sort by capability (highest first), then by recency
    .sort((a, b) => {
      if (b.capabilityLevel !== a.capabilityLevel) {
        return b.capabilityLevel - a.capabilityLevel;
      }
      return new Date(b.report.timestamp).getTime() - new Date(a.report.timestamp).getTime();
    });

  if (higherImpassable.length === 0) {
    return null;
  }

  const top = higherImpassable[0];
  return {
    sourceVehicleType: top.report.vehicleType,
    capabilityLevel: top.capabilityLevel,
    report: top.report,
  };
}

/**
 * Derive a baseline verdict from trail difficulty vs vehicle capability
 *
 * @param baseDifficulty Trail's inherent difficulty (1-4)
 * @param vehicleType The vehicle type to evaluate
 * @returns Baseline outcome with status and explanation
 */
function getBaselineVerdict(
  baseDifficulty: number,
  vehicleType: VehicleType
): VehicleOutcome {
  const vehicleCapability = getVehicleCapability(vehicleType);
  const diff = vehicleCapability - baseDifficulty;

  // Vehicle capability exceeds or matches trail difficulty → baseline passable
  if (diff >= 0) {
    return {
      status: 'baseline',
      confidence: 'low',
      explanation: `Based on trail rating. Your vehicle should handle this trail.`,
      isBaseline: true,
    };
  }

  // Vehicle is 1 level below → high-risk baseline
  if (diff === -1) {
    return {
      status: 'baseline',
      confidence: 'low',
      explanation: `Based on trail rating. This trail may challenge your vehicle.`,
      isBaseline: true,
    };
  }

  // Vehicle is 2+ levels below → baseline not recommended
  return {
    status: 'baseline',
    confidence: 'low',
    explanation: `Based on trail rating. This trail exceeds your vehicle's capability.`,
    isBaseline: true,
  };
}

/**
 * Time decay thresholds (in hours)
 * Reports are weighted by recency:
 * - < 24h: full weight
 * - < 72h: 0.75 weight
 * - < 168h (1 week): 0.5 weight
 * - older: 0.25 weight
 */
function getRecencyWeight(timestamp: string): number {
  const reportTime = new Date(timestamp);
  const now = new Date();
  const hoursAgo = (now.getTime() - reportTime.getTime()) / (1000 * 60 * 60);

  if (hoursAgo < 24) return 1.0;
  if (hoursAgo < 72) return 0.75;
  if (hoursAgo < 168) return 0.5;
  return 0.25;
}

/**
 * Calculate combined weight for a report (confidence × recency)
 */
function getReportWeight(report: ConditionReport): number {
  const confidenceWeight = CONFIDENCE_WEIGHT[report.confidence];
  const recencyWeight = getRecencyWeight(report.timestamp);
  return confidenceWeight * recencyWeight;
}

/**
 * Evaluate trail outcome for a specific vehicle type
 *
 * Rules:
 * - Only considers reports matching vehicleType
 * - Weights reports by confidence and recency
 * - Recent high-confidence impassable → impassable
 * - Recent mixed/rough → high-risk
 * - Recent clear → passable
 * - No matching reports → unknown
 *
 * @param reports All condition reports for a trail
 * @param vehicleType The vehicle type to evaluate for
 * @returns Outcome with status, confidence, and explanation
 */
export function getVehicleOutcome(
  reports: ConditionReport[],
  vehicleType: VehicleType
): VehicleOutcome {
  // Filter to only reports for this vehicle type
  const vehicleReports = reports.filter(r => r.vehicleType === vehicleType);

  // No reports for this vehicle type
  if (vehicleReports.length === 0) {
    return {
      status: 'unknown',
      confidence: 'low',
      explanation: 'No reports available for this vehicle type',
    };
  }

  // Sort by weight (highest first)
  const weightedReports = vehicleReports
    .map(report => ({
      report,
      weight: getReportWeight(report),
    }))
    .sort((a, b) => b.weight - a.weight);

  // Get the most heavily weighted report
  const topReport = weightedReports[0].report;

  // Check for recent high-confidence impassable (within 1 week)
  const recentImpassable = weightedReports.find(({ report }) => {
    const hoursAgo = (Date.now() - new Date(report.timestamp).getTime()) / (1000 * 60 * 60);
    return report.status === 'impassable' &&
           report.confidence === 'high' &&
           hoursAgo < 168; // 1 week
  });

  if (recentImpassable) {
    return {
      status: 'impassable',
      confidence: recentImpassable.report.confidence,
      explanation: 'Recent high-confidence reports indicate trail is not passable',
    };
  }

  // Aggregate status counts from top 3 most recent weighted reports
  const recentReports = weightedReports.slice(0, 3).map(wr => wr.report);
  const statusCounts = {
    clear: recentReports.filter(r => r.status === 'clear').length,
    rough: recentReports.filter(r => r.status === 'rough').length,
    impassable: recentReports.filter(r => r.status === 'impassable').length,
  };

  // If all recent reports are clear → passable
  if (statusCounts.clear === recentReports.length && statusCounts.clear > 0) {
    return {
      status: 'passable',
      confidence: topReport.confidence,
      explanation: 'Recent reports indicate clear conditions',
    };
  }

  // If any impassable in recent reports → impassable
  if (statusCounts.impassable > 0) {
    return {
      status: 'impassable',
      confidence: topReport.confidence,
      explanation: 'Recent reports indicate trail may not be passable',
    };
  }

  // If rough or mixed conditions → high-risk
  if (statusCounts.rough > 0 || (statusCounts.clear > 0 && statusCounts.impassable === 0)) {
    return {
      status: 'high-risk',
      confidence: topReport.confidence,
      explanation: 'Mixed or rough conditions reported - proceed with caution',
    };
  }

  // Default to high-risk for mixed signals
  return {
    status: 'high-risk',
    confidence: topReport.confidence,
    explanation: 'Conditions vary - proceed with caution',
  };
}

/**
 * Check if all reports are older than the stale threshold (30 days)
 */
function areReportsStale(reports: ConditionReport[]): boolean {
  if (reports.length === 0) return true;

  const staleThresholdMs = STALE_REPORT_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // Check if the most recent report is older than threshold
  const mostRecent = reports.reduce((latest, report) => {
    const reportTime = new Date(report.timestamp).getTime();
    return reportTime > latest ? reportTime : latest;
  }, 0);

  return (now - mostRecent) > staleThresholdMs;
}

/**
 * Enhanced vehicle outcome with condition propagation and baseline fallback
 *
 * Rules (in priority order):
 * 1. If a higher-capability vehicle reported impassable → inherit that verdict
 * 2. If fresh reports exist for this vehicle (within 30 days) → use direct verdict
 * 3. If baseDifficulty is set → use baseline verdict
 * 4. Otherwise → return 'unknown'
 *
 * @param reports All condition reports for a trail
 * @param vehicleType The vehicle type to evaluate for
 * @param baseDifficulty Optional trail base difficulty (1-4)
 * @returns Outcome with status, confidence, explanation, and inheritance/baseline flags
 */
export function getVehicleOutcomeWithFallback(
  reports: ConditionReport[],
  vehicleType: VehicleType,
  baseDifficulty?: number | null
): VehicleOutcome {
  // Check for inherited impassable from higher-capability vehicles FIRST
  // If a more capable vehicle can't pass, this vehicle definitely can't either
  const inherited = findInheritedImpassable(reports, vehicleType);
  if (inherited) {
    return {
      status: 'impassable',
      confidence: inherited.report.confidence,
      explanation: `Higher-capability vehicle (${getCapabilityLabel(inherited.capabilityLevel)}) reported trail not passable`,
      inheritedFrom: {
        vehicleType: inherited.sourceVehicleType,
        capabilityLevel: inherited.capabilityLevel,
        reportTimestamp: inherited.report.timestamp,
      },
    };
  }

  // Filter to reports for this vehicle type
  const vehicleReports = reports.filter(r => r.vehicleType === vehicleType);

  // Check if we have fresh reports (within 30 days)
  if (!areReportsStale(vehicleReports)) {
    // Use standard outcome logic for fresh reports
    return getVehicleOutcome(reports, vehicleType);
  }

  // Reports are stale or non-existent - try baseline fallback
  if (baseDifficulty !== null && baseDifficulty !== undefined && baseDifficulty >= 1 && baseDifficulty <= 4) {
    return getBaselineVerdict(baseDifficulty, vehicleType);
  }

  // No recent reports and no baseline difficulty
  return {
    status: 'unknown',
    confidence: 'low',
    explanation: 'No recent reports or baseline rating available',
  };
}

/**
 * Weighted status calculation result
 * Used for the "Clear Answer" UI in trail detail page
 */
export interface WeightedStatusResult {
  status: 'passable' | 'high-risk' | 'impassable' | 'unknown';
  label: string;
  hasMixedReports: boolean;
  mixedReportReason?: string;
  totalWeight: number;
  statusWeights: {
    clear: number;
    rough: number;
    impassable: number;
  };
  dominantConfidence: Confidence;
  recentHighConfidenceVehicles: {
    vehicleType: VehicleType;
    status: Status;
    timestamp: string;
  }[];
}

/**
 * Calculate weighted trail status from reports
 *
 * Weighting rules:
 * - Confidence weight: high=2x, medium=1.5x, low=1x
 * - Time decay: Reports >48 hours old have 50% weight
 *
 * Conflict detection:
 * - Conflicting intel flagged when high-confidence impassable conflicts with low-confidence passable
 *
 * @param reports Condition reports (pre-sorted by recency, limited to last 5)
 * @returns Weighted status with conflict detection
 */
export function calculateWeightedStatus(reports: ConditionReport[]): WeightedStatusResult {
  // No reports = unknown
  if (reports.length === 0) {
    return {
      status: 'unknown',
      label: 'NO DATA',
      hasMixedReports: false,
      totalWeight: 0,
      statusWeights: { clear: 0, rough: 0, impassable: 0 },
      dominantConfidence: 'low',
      recentHighConfidenceVehicles: [],
    };
  }

  // Take last 5 reports (should already be sorted by recency)
  const recentReports = reports.slice(0, 5);

  // Confidence weights: High=2x, Medium=1.5x, Low=1x
  const confidenceWeight: Record<Confidence, number> = {
    high: 2,
    medium: 1.5,
    low: 1,
  };

  // Calculate time decay (reports >48 hours old get 50% weight)
  const getTimeDecay = (timestamp: string): number => {
    const reportTime = new Date(timestamp).getTime();
    const now = Date.now();
    const hoursOld = (now - reportTime) / (1000 * 60 * 60);
    return hoursOld > 48 ? 0.5 : 1;
  };

  // Calculate weighted sums for each status
  const statusWeights = { clear: 0, rough: 0, impassable: 0 };
  let totalWeight = 0;
  let dominantConfidence: Confidence = 'low';
  let maxConfidenceWeight = 0;

  // Track reports for conflict detection
  const hasHighConfidenceImpassable = recentReports.some(r => r.confidence === 'high' && r.status === 'impassable');
  const hasLowConfidenceClear = recentReports.some(r => r.confidence === 'low' && r.status === 'clear');

  // Track vehicles with High or Medium confidence for matrix highlighting (within 48 hours)
  const recentHighConfidenceVehicles: WeightedStatusResult['recentHighConfidenceVehicles'] = [];
  const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);

  recentReports.forEach(report => {
    const confWeight = confidenceWeight[report.confidence];
    const timeDecay = getTimeDecay(report.timestamp);
    const weight = confWeight * timeDecay;

    statusWeights[report.status] += weight;
    totalWeight += weight;

    // Track dominant confidence
    if (confWeight > maxConfidenceWeight) {
      maxConfidenceWeight = confWeight;
      dominantConfidence = report.confidence;
    }

    // Track High or Medium confidence vehicles for matrix highlighting
    if (
      (report.confidence === 'high' || report.confidence === 'medium') &&
      new Date(report.timestamp).getTime() > fortyEightHoursAgo
    ) {
      recentHighConfidenceVehicles.push({
        vehicleType: report.vehicleType,
        status: report.status,
        timestamp: report.timestamp,
      });
    }
  });

  // Detect conflicting intel: high-confidence impassable vs low-confidence passable
  const hasMixedReports = hasHighConfidenceImpassable && hasLowConfidenceClear;
  let mixedReportReason: string | undefined;
  if (hasMixedReports) {
    mixedReportReason = 'High-confidence impassable report conflicts with low-confidence passable';
  }

  // Determine overall status from weighted scores
  let status: WeightedStatusResult['status'];
  let label: string;

  // If impassable has the highest weight, trail is impassable
  if (statusWeights.impassable > statusWeights.clear && statusWeights.impassable > statusWeights.rough) {
    status = 'impassable';
    label = 'NOT PASSABLE';
  }
  // If clear dominates, trail is passable
  else if (statusWeights.clear > statusWeights.impassable && statusWeights.clear >= statusWeights.rough) {
    status = 'passable';
    label = 'PASSABLE';
  }
  // If rough dominates or tied with clear, challenging
  else if (statusWeights.rough > 0 || statusWeights.clear > 0) {
    status = 'high-risk';
    label = 'CHALLENGING';
  }
  // Fallback
  else {
    status = 'unknown';
    label = 'UNKNOWN';
  }

  return {
    status,
    label,
    hasMixedReports,
    mixedReportReason,
    totalWeight,
    statusWeights,
    dominantConfidence,
    recentHighConfidenceVehicles,
  };
}

/**
 * Get all 8 vehicle types in a consistent order
 */
const ALL_VEHICLE_TYPES: VehicleType[] = [
  'stockSUV_solidAxle',
  'stockSUV_IFS',
  'stockSUV_IFRS',
  'lifted4x4_solidAxle',
  'lifted4x4_IFS',
  'lifted4x4_IFRS',
  'sideBySide',
  'dirtBike',
];

/**
 * Evaluate trail outcomes across all vehicle types
 *
 * Used when no vehicle is selected to show aggregate trail status.
 *
 * Rules:
 * - Evaluates outcome for each of the 8 vehicle types
 * - Counts how many vehicles have each outcome status
 * - Label logic:
 *   - All passable → 'passable'
 *   - Any impassable → 'high-risk'
 *   - Otherwise → 'mixed'
 *
 * @param reports All condition reports for a trail
 * @returns Summary with counts and overall label
 */
export function getTrailOutcomeSummary(
  reports: ConditionReport[]
): TrailOutcomeSummary {
  const outcomes = ALL_VEHICLE_TYPES.map(vehicleType =>
    getVehicleOutcome(reports, vehicleType)
  );

  const summary: TrailOutcomeSummary = {
    passable: outcomes.filter(o => o.status === 'passable').length,
    highRisk: outcomes.filter(o => o.status === 'high-risk').length,
    impassable: outcomes.filter(o => o.status === 'impassable').length,
    unknown: outcomes.filter(o => o.status === 'unknown').length,
    label: 'mixed',
  };

  // Determine overall label
  // All passable (and at least one known) → passable
  if (summary.passable === ALL_VEHICLE_TYPES.length && summary.unknown === 0) {
    summary.label = 'passable';
  }
  // Any impassable → high-risk
  else if (summary.impassable > 0) {
    summary.label = 'high-risk';
  }
  // Otherwise → mixed
  else {
    summary.label = 'mixed';
  }

  return summary;
}
