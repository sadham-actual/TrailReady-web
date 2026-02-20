import { FitResult, TrailRequirementProfile, UserVehicle } from './types';

const expRank = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
} as const;

export function evaluateTrailFit(
  vehicle: UserVehicle,
  trail: TrailRequirementProfile
): FitResult {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (trail.current_status === 'Closed') {
    return { status: 'Red', reasons: ['Trail is currently closed.'], warnings };
  }

  if (trail.required_gear.includes('winch') && !vehicle.has_winch) {
    return {
      status: 'Red',
      reasons: ['Trail requires a winch, vehicle does not have one.'],
      warnings,
    };
  }

  if (trail.required_gear.includes('low_range') && !vehicle.has_low_range) {
    return {
      status: 'Red',
      reasons: ['Trail requires low range, vehicle does not have it.'],
      warnings,
    };
  }

  if (vehicle.tire_size < trail.min_tire_size) {
    return {
      status: 'Red',
      reasons: [
        `Minimum tire size is ${trail.min_tire_size}\", vehicle has ${vehicle.tire_size}\".`,
      ],
      warnings,
    };
  }

  if (vehicle.tire_size === trail.min_tire_size) {
    warnings.push('Tire size meets minimum exactly; may struggle in tougher sections.');
  }

  if (trail.difficulty_score >= 8 && expRank[vehicle.experience_level] < expRank.Advanced) {
    warnings.push('High-difficulty trail with non-advanced experience level.');
  }

  if (trail.difficulty_score >= 6 && vehicle.clearance_inches < 10) {
    warnings.push('Clearance may be marginal for this difficulty.');
  }

  if (warnings.length > 0) {
    reasons.push('Vehicle meets base requirements with caution flags.');
    return { status: 'Yellow', reasons, warnings };
  }

  reasons.push('Vehicle exceeds or comfortably meets trail requirements.');
  return { status: 'Green', reasons, warnings };
}
