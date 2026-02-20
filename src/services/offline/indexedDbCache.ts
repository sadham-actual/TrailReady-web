import { PlannerCacheAdapter } from './cacheAdapter';
import { Trail } from '@/types';
import { TripBundle } from '@/domain/planning';

const TRAILS_KEY = 'planner_trails_v1';
const BUNDLES_KEY = 'planner_bundles_v1';

export class IndexedDbCacheAdapter implements PlannerCacheAdapter {
  async saveTrails(trails: Trail[]): Promise<void> {
    localStorage.setItem(TRAILS_KEY, JSON.stringify(trails));
  }

  async getTrails(): Promise<Trail[]> {
    const raw = localStorage.getItem(TRAILS_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async saveTripBundles(bundles: TripBundle[]): Promise<void> {
    localStorage.setItem(BUNDLES_KEY, JSON.stringify(bundles));
  }

  async getTripBundles(): Promise<TripBundle[]> {
    const raw = localStorage.getItem(BUNDLES_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}
