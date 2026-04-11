import { Trail } from '@/types';
import { TripBundle } from '@/domain/planning';
import { PlannerCacheAdapter } from './cacheAdapter';

export class PlannerSyncService {
  constructor(private cache: PlannerCacheAdapter) {}

  async cacheTrailMetadata(trails: Trail[]) {
    await this.cache.saveTrails(trails);
  }

  async cacheTripBundles(bundles: TripBundle[]) {
    await this.cache.saveTripBundles(bundles);
  }

  async loadOfflineTrails() {
    return this.cache.getTrails();
  }

  async loadOfflineTripBundles() {
    return this.cache.getTripBundles();
  }
}
