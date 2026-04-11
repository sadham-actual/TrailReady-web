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

// Coordinate pair for trail paths [latitude, longitude]
export type LatLng = [number, number];

export interface Trail {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  description?: string;
  baseDifficulty?: number; // 1-4 scale: 1=easy, 2=moderate, 3=difficult, 4=extreme
  latestStatus?: Status;
  lastReportAt?: string; // ISO-8601 timestamp
  pathCoordinates?: LatLng[]; // GPS path for trail polyline rendering

  // Planning-first additive fields
  difficultyScore?: number; // 1-10
  terrainType?: 'Rock' | 'Sand' | 'Mud';
  minTireSize?: number;
  requiredGear?: string[];
  currentStatus?: 'Open' | 'Closed';
  gpxUrl?: string;
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
  clear: 'Passable',
  rough: 'Caution',
  impassable: 'Not Passable',
};

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  stockSUV_solidAxle: 'Stock AWD - Crossover / SUV',
  stockSUV_IFS: 'High Clearance 4x4 - Stock Truck',
  stockSUV_IFRS: 'Stock SUV - IFRS',
  lifted4x4_solidAxle: 'Modified 4x4 - 33"+ Tires',
  lifted4x4_IFS: 'Extreme Build - Long Travel',
  lifted4x4_IFRS: 'Lifted 4x4 - IFRS',
  sideBySide: 'Side-by-side',
  dirtBike: 'Dirt Bike',
};

// Simplified vehicle categories for the Garage UI
export type SimpleVehicleCategory =
  | 'stockAWD'
  | 'highClearance4x4'
  | 'modified4x4'
  | 'extremeBuild';

export interface VehicleCategoryInfo {
  id: SimpleVehicleCategory;
  mappedType: VehicleType;
  name: string;
  shortName: string;
  description: string;
  icon: 'crossover' | 'truck' | 'lifted' | 'crawler';
  capabilityLevel: 1 | 2 | 3 | 4;
}

export const VEHICLE_CATEGORIES: VehicleCategoryInfo[] = [
  {
    id: 'stockAWD',
    mappedType: 'stockSUV_solidAxle',
    name: 'Stock AWD',
    shortName: 'Stock AWD',
    description: 'Crossovers & stock SUVs with standard clearance',
    icon: 'crossover',
    capabilityLevel: 1,
  },
  {
    id: 'highClearance4x4',
    mappedType: 'stockSUV_IFS',
    name: 'High Clearance 4x4',
    shortName: 'HC 4x4',
    description: 'Factory 4x4 trucks & SUVs with good clearance',
    icon: 'truck',
    capabilityLevel: 2,
  },
  {
    id: 'modified4x4',
    mappedType: 'lifted4x4_solidAxle',
    name: 'Modified 4x4',
    shortName: 'Modified',
    description: 'Lifted with 33"+ tires, lockers, skid plates',
    icon: 'lifted',
    capabilityLevel: 3,
  },
  {
    id: 'extremeBuild',
    mappedType: 'lifted4x4_IFS',
    name: 'Extreme Build',
    shortName: 'Extreme',
    description: 'Long travel, rock crawlers, competition rigs',
    icon: 'crawler',
    capabilityLevel: 4,
  },
];

export function getRigTierLabel(vehicleType: VehicleType): string {
  if (vehicleType.startsWith('stockSUV')) {
    return vehicleType === 'stockSUV_IFS' ? 'High Clearance 4x4' : 'Stock AWD';
  }
  if (vehicleType.startsWith('lifted4x4')) {
    return vehicleType === 'lifted4x4_IFS' ? 'Extreme Build' : 'Modified 4x4';
  }
  if (vehicleType === 'sideBySide') return 'Modified 4x4';
  if (vehicleType === 'dirtBike') return 'Extreme Build';
  return 'Stock AWD';
}