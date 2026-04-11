import { Trail } from '@/types';
import { TripBundle } from '@/domain/planning';

export interface PlannerCacheAdapter {
  saveTrails(trails: Trail[]): Promise<void>;
  getTrails(): Promise<Trail[]>;
  saveTripBundles(bundles: TripBundle[]): Promise<void>;
  getTripBundles(): Promise<TripBundle[]>;
}
