export type FitStatus = 'Green' | 'Yellow' | 'Red';
export type TerrainType = 'Rock' | 'Sand' | 'Mud';
export type TrailOpenStatus = 'Open' | 'Closed';
export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface UserVehicle {
  rig_tier: 'stockAWD' | 'highClearance4x4' | 'modified4x4' | 'extremeBuild';
  make: string;
  model: string;
  clearance_inches: number;
  tire_size: number;
  has_low_range: boolean;
  has_winch: boolean;
  experience_level: ExperienceLevel;
}

export interface TrailRequirementProfile {
  id: string;
  name: string;
  difficulty_score: number; // 1-10
  terrain_type: TerrainType;
  min_tire_size: number;
  required_gear: string[];
  current_status: TrailOpenStatus;
}

export interface TripBundle {
  id: string;
  user_id: string;
  trail_ids: string[];
  scheduled_date: string;
  notes: string;
  is_offline_cached: boolean;
}

export interface FitResult {
  status: FitStatus;
  reasons: string[];
  warnings: string[];
}
