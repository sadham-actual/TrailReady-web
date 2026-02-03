import { ConditionReport, VehicleType, Status, Confidence } from '@/types';

/**
 * Outcome status for a specific vehicle type
 * - passable: Recent clear reports indicate safe passage
 * - high-risk: Mixed or rough conditions reported
 * - impassable: Recent reports indicate trail is not passable
 * - unknown: No reports available for this vehicle type
 */
export type OutcomeStatus = 'passable' | 'high-risk' | 'impassable' | 'unknown';

/**
 * Result of evaluating trail conditions for a specific vehicle type
 */
export interface VehicleOutcome {
  status: OutcomeStatus;
  confidence: Confidence;
  explanation: string;
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
