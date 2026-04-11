/**
 * Stage 2: Unit tests for geometry utilities.
 * Covers: coordinate normalisation, simplification, geom_hash, dedupe.
 */

import { describe, it, expect } from 'vitest';
import {
  roundCoord,
  normalizeCoordinate,
  normalizeCoordinates,
  simplify,
  computeGeomHash,
  pickPreferredSegment,
  deduplicateSegments,
} from '@/lib/pipeline/geometry';
import type { PipelineSegment } from '@/lib/pipeline/types';

// ---------------------------------------------------------------------------
// roundCoord
// ---------------------------------------------------------------------------

describe('roundCoord', () => {
  it('rounds to 7 decimal places by default', () => {
    expect(roundCoord(10.123456789)).toBe(10.1234568);
  });

  it('respects custom precision', () => {
    expect(roundCoord(10.123456789, 3)).toBe(10.123);
  });

  it('handles negative values', () => {
    expect(roundCoord(-105.98765432, 7)).toBe(-105.9876543);
  });
});

// ---------------------------------------------------------------------------
// normalizeCoordinate
// ---------------------------------------------------------------------------

describe('normalizeCoordinate', () => {
  it('normalises a 2D coordinate to 7 d.p.', () => {
    const result = normalizeCoordinate([-105.123456789, 40.987654321]);
    expect(result).toEqual([-105.1234568, 40.9876543]);
  });

  it('normalises elevation to 2 d.p.', () => {
    const result = normalizeCoordinate([-105.1, 40.9, 1500.6789]) as number[];
    expect(result[2]).toBe(1500.68);
  });

  it('omits elevation field when not present in input', () => {
    const result = normalizeCoordinate([-105.0, 40.0]);
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// normalizeCoordinates
// ---------------------------------------------------------------------------

describe('normalizeCoordinates', () => {
  it('normalises all coordinates in an array', () => {
    const input: [number, number][] = [
      [-105.123456789, 40.123456789],
      [-106.987654321, 41.987654321],
    ];
    const result = normalizeCoordinates(input);
    expect(result).toEqual([
      [-105.1234568, 40.1234568],
      [-106.9876543, 41.9876543],
    ]);
  });
});

// ---------------------------------------------------------------------------
// simplify (Douglas-Peucker)
// ---------------------------------------------------------------------------

describe('simplify', () => {
  it('returns unchanged for ≤2 points', () => {
    const two: [number, number][] = [
      [-105.0, 40.0],
      [-106.0, 41.0],
    ];
    expect(simplify(two)).toEqual(two);
  });

  it('preserves endpoints and removes collinear intermediate points', () => {
    // Three perfectly collinear points — the middle one should be removed.
    const collinear: [number, number][] = [
      [0, 0],
      [0.5, 0.5],
      [1, 1],
    ];
    const result = simplify(collinear, 0.00001);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual([0, 0]);
    expect(result[result.length - 1]).toEqual([1, 1]);
  });

  it('keeps a non-collinear point when it exceeds epsilon', () => {
    const bent: [number, number][] = [
      [0, 0],
      [0.5, 1], // clearly off-axis
      [1, 0],
    ];
    const result = simplify(bent, 0.00001);
    // All three points must be retained
    expect(result).toHaveLength(3);
  });

  it('returns a copy — does not mutate the input', () => {
    const pts: [number, number][] = [
      [0, 0],
      [1, 1],
    ];
    const original = pts.map((p) => [...p]);
    simplify(pts, 0.001);
    expect(pts).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// computeGeomHash
// ---------------------------------------------------------------------------

describe('computeGeomHash', () => {
  it('returns a 64-character hex string', () => {
    const hash = computeGeomHash([[-105.0, 40.0], [-106.0, 41.0]]);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('returns empty string for empty input', () => {
    expect(computeGeomHash([])).toBe('');
  });

  it('is deterministic — same input always gives same hash', () => {
    const coords: [number, number][] = [[-105.0, 40.0], [-106.0, 41.0]];
    expect(computeGeomHash(coords)).toBe(computeGeomHash(coords));
  });

  it('is direction-invariant — reversed input gives the same hash', () => {
    const forward: [number, number][] = [[-105.0, 40.0], [-106.0, 41.0]];
    const backward: [number, number][] = [[-106.0, 41.0], [-105.0, 40.0]];
    expect(computeGeomHash(forward)).toBe(computeGeomHash(backward));
  });

  it('returns different hashes for different geometries', () => {
    const a: [number, number][] = [[-105.0, 40.0], [-106.0, 41.0]];
    const b: [number, number][] = [[-105.0, 40.0], [-107.0, 42.0]];
    expect(computeGeomHash(a)).not.toBe(computeGeomHash(b));
  });

  it('ignores sub-precision noise (normalises before hashing)', () => {
    // Difference at the 8th+ decimal place is below HASH_PRECISION (7 d.p.)
    // and should be rounded away before hashing.
    const a: [number, number][] = [[-105.00000000, 40.00000000]];
    const b: [number, number][] = [[-105.00000004, 40.00000004]]; // ~0.4 cm — below 7 d.p.
    // Both round to [-105.0, 40.0] at 7 d.p.
    expect(computeGeomHash(a)).toBe(computeGeomHash(b));
  });
});

// ---------------------------------------------------------------------------
// pickPreferredSegment
// ---------------------------------------------------------------------------

function makeSeg(id: string, source_slug: string): PipelineSegment {
  return { id, source_slug, coordinates: [[-105, 40], [-106, 41]] };
}

describe('pickPreferredSegment', () => {
  it('returns undefined for empty array', () => {
    expect(pickPreferredSegment([])).toBeUndefined();
  });

  it('returns the only candidate', () => {
    const seg = makeSeg('a', 'osm');
    expect(pickPreferredSegment([seg])).toBe(seg);
  });

  it('prefers mvum over osm', () => {
    const osm = makeSeg('osm', 'osm');
    const mvum = makeSeg('mvum', 'mvum');
    expect(pickPreferredSegment([osm, mvum])).toBe(mvum);
    expect(pickPreferredSegment([mvum, osm])).toBe(mvum);
  });

  it('prefers osm over ndt', () => {
    const ndt = makeSeg('ndt', 'ndt');
    const osm = makeSeg('osm', 'osm');
    expect(pickPreferredSegment([ndt, osm])).toBe(osm);
  });

  it('prefers mvum over ndt', () => {
    const ndt = makeSeg('ndt', 'ndt');
    const mvum = makeSeg('mvum', 'mvum');
    expect(pickPreferredSegment([ndt, mvum])).toBe(mvum);
  });

  it('is stable — equal-priority candidates keep the first occurrence', () => {
    const osm1 = makeSeg('osm1', 'osm');
    const osm2 = makeSeg('osm2', 'osm');
    expect(pickPreferredSegment([osm1, osm2])).toBe(osm1);
  });

  it('ranks unknown source slugs as lowest priority', () => {
    const unknown = makeSeg('unk', 'random_source');
    const ndt = makeSeg('ndt', 'ndt');
    expect(pickPreferredSegment([unknown, ndt])).toBe(ndt);
  });
});

// ---------------------------------------------------------------------------
// deduplicateSegments
// ---------------------------------------------------------------------------

describe('deduplicateSegments', () => {
  it('keeps all segments when none share a geom_hash', () => {
    const segs: PipelineSegment[] = [
      { ...makeSeg('a', 'osm'), geom_hash: 'aaa' },
      { ...makeSeg('b', 'mvum'), geom_hash: 'bbb' },
    ];
    expect(deduplicateSegments(segs)).toHaveLength(2);
  });

  it('deduplicates by geom_hash, keeping the authoritative source', () => {
    const hash = 'deadbeef';
    const osm: PipelineSegment = { ...makeSeg('osm', 'osm'), geom_hash: hash };
    const mvum: PipelineSegment = { ...makeSeg('mvum', 'mvum'), geom_hash: hash };
    const ndt: PipelineSegment = { ...makeSeg('ndt', 'ndt'), geom_hash: hash };

    const result = deduplicateSegments([ndt, osm, mvum]);
    expect(result).toHaveLength(1);
    expect(result[0].source_slug).toBe('mvum');
  });

  it('passes through segments without a geom_hash unchanged', () => {
    const withHash: PipelineSegment = { ...makeSeg('a', 'osm'), geom_hash: 'abc' };
    const noHash: PipelineSegment = makeSeg('b', 'ndt'); // no geom_hash
    const result = deduplicateSegments([withHash, noHash]);
    expect(result).toHaveLength(2);
  });

  it('preserves relative ordering of winners', () => {
    const segs: PipelineSegment[] = [
      { ...makeSeg('1', 'osm'), geom_hash: 'hash1' },
      { ...makeSeg('2', 'mvum'), geom_hash: 'hash2' },
      { ...makeSeg('3', 'ndt'), geom_hash: 'hash1' }, // duplicate of hash1, lower priority
    ];
    const result = deduplicateSegments(segs);
    // hash1 winner (osm beats ndt) should come before hash2 winner (mvum)
    expect(result).toHaveLength(2);
    expect(result[0].geom_hash).toBe('hash1');
    expect(result[0].source_slug).toBe('osm');
    expect(result[1].geom_hash).toBe('hash2');
  });
});
