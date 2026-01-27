// Domain Entities - Matching docs/state-model.md

export type Status = 'clear' | 'rough' | 'impassable';

export type Confidence = 'low' | 'medium' | 'high';

export type VehicleType = 
  | 'stockSUV_solidAxle'
  | 'stockSUV_IFS'
  | 'stockSUV_IFRS'
  | 'lifted4x4_solidAxle'
  | 'lifted4x4_IFS'
  | 'lifted4x4_IFRS'
  | 'sideBySide'
  | 'dirtBike';

export interface Trail {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  description?: string;
  latestStatus?: Status;
  lastReportAt?: string; // ISO-8601 timestamp
}

export interface ConditionReport {
  id: string;
  trailId: string;
  userId: string;
  status: Status;
  confidence: Confidence;
  vehicleType: VehicleType;
  notes?: string;
  timestamp: string; // ISO-8601 timestamp
}

// Derived field helper
export function getReportAgeHours(timestamp: string): number {
  const reportTime = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - reportTime.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

// Display helpers
export const STATUS_LABELS: Record<Status, string> = {
  clear: 'Clear',
  rough: 'Rough',
  impassable: 'Impassable',
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  stockSUV_solidAxle: 'Stock SUV - Solid Axle',
  stockSUV_IFS: 'Stock SUV - IFS',
  stockSUV_IFRS: 'Stock SUV - IFRS',
  lifted4x4_solidAxle: 'Lifted 4x4 - Solid Axle',
  lifted4x4_IFS: 'Lifted 4x4 - IFS',
  lifted4x4_IFRS: 'Lifted 4x4 - IFRS',
  sideBySide: 'Side-by-side',
  dirtBike: 'Dirt Bike',
};