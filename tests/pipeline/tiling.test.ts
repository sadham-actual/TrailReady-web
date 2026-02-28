import { describe, expect, it } from 'vitest';
import { splitBBox } from '@/services/pipeline/importers/tiling';

describe('splitBBox', () => {
  it('splits into rows*cols tiles', () => {
    const out = splitBBox({ minLng: -98, minLat: 32, maxLng: -96, maxLat: 34 }, 2, 3);
    expect(out).toHaveLength(6);
  });

  it('keeps tiles inside original bbox bounds', () => {
    const bbox = { minLng: -98, minLat: 32, maxLng: -96, maxLat: 34 };
    const out = splitBBox(bbox, 2, 2);
    expect(out.every(t => t.minLng >= bbox.minLng && t.maxLng <= bbox.maxLng)).toBe(true);
    expect(out.every(t => t.minLat >= bbox.minLat && t.maxLat <= bbox.maxLat)).toBe(true);
  });
});
