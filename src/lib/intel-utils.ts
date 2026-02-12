export type GlobalTrailStatus = 'PASSABLE' | 'CHALLENGING' | 'NOT PASSABLE' | 'NO DATA';
export type IntelConfidence = 'HIGH' | 'MED' | 'LOW';

export interface IntelReport {
  status: Exclude<GlobalTrailStatus, 'NO DATA'>;
  confidence: IntelConfidence;
  createdAt: Date | string;
}

export interface GlobalStatusResult {
  status: GlobalTrailStatus;
  reliabilityScore: number; // 0-100
}

const CONFIDENCE_MULTIPLIER: Record<IntelConfidence, number> = {
  HIGH: 3,
  MED: 2,
  LOW: 1,
};

const STATUS_PRIORITY: Exclude<GlobalTrailStatus, 'NO DATA'>[] = [
  'NOT PASSABLE',
  'CHALLENGING',
  'PASSABLE',
];

function getRecencyMultiplier(createdAt: Date | string): number {
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return 0.5;

  const ageHours = (Date.now() - createdMs) / (1000 * 60 * 60);
  if (ageHours <= 24) return 2;
  if (ageHours <= 24 * 7) return 1;
  return 0.5;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateGlobalStatus(reports: IntelReport[]): GlobalStatusResult {
  if (!reports.length) {
    return { status: 'NO DATA', reliabilityScore: 0 };
  }

  const weights: Record<Exclude<GlobalTrailStatus, 'NO DATA'>, number> = {
    PASSABLE: 0,
    CHALLENGING: 0,
    'NOT PASSABLE': 0,
  };

  for (const report of reports) {
    const confidenceWeight = CONFIDENCE_MULTIPLIER[report.confidence] ?? 1;
    const recencyWeight = getRecencyMultiplier(report.createdAt);
    weights[report.status] += confidenceWeight * recencyWeight;
  }

  const totalWeight = weights.PASSABLE + weights.CHALLENGING + weights['NOT PASSABLE'];
  if (totalWeight <= 0) {
    return { status: 'NO DATA', reliabilityScore: 0 };
  }

  const winningStatus = STATUS_PRIORITY.reduce((best, current) => {
    if (weights[current] > weights[best]) return current;
    return best;
  }, STATUS_PRIORITY[0]);

  const winningWeight = weights[winningStatus];
  const dominance = winningWeight / totalWeight; // How strongly one status leads
  const reportVolume = clamp(reports.length / 8, 0, 1); // Confidence rises with more field reports
  const weightDensity = clamp(totalWeight / 24, 0, 1); // Accounts for stronger recent/high-confidence intel

  const reliabilityScore = Math.round(
    clamp((dominance * 0.6 + reportVolume * 0.25 + weightDensity * 0.15) * 100, 0, 100)
  );

  return {
    status: winningStatus,
    reliabilityScore,
  };
}

