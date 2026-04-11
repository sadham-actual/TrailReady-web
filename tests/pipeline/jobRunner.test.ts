import { describe, expect, it } from 'vitest';
import { texasBBoxPreset, dfwBBoxPreset } from '@/services/pipeline/jobRunner';

describe('job runner presets', () => {
  it('returns texas bbox preset', () => {
    const b = texasBBoxPreset();
    expect(b.minLng).toBeLessThan(b.maxLng);
    expect(b.minLat).toBeLessThan(b.maxLat);
  });

  it('returns dfw bbox preset', () => {
    const b = dfwBBoxPreset();
    expect(b.minLng).toBeLessThan(b.maxLng);
    expect(b.minLat).toBeLessThan(b.maxLat);
  });
});
