/**
 * Stage 2: Unit tests for the GPX generator service.
 * Covers: basic generation, reversed segments, discontinuity splitting,
 *         attribution metadata, and XML structure.
 */

import { describe, it, expect } from 'vitest';
import { generateGpx } from '@/services/pipeline/gpxGenerator';
import type { GpxGeneratorInput, PipelineSegment, SourceAttribution } from '@/lib/pipeline/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSeg(
  id: string,
  coords: [number, number][],
  opts: Partial<PipelineSegment> = {},
): PipelineSegment {
  return { id, source_slug: 'osm', coordinates: coords, ...opts };
}

function countOccurrences(str: string, sub: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(sub, pos)) !== -1) {
    count++;
    pos += sub.length;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Basic generation
// ---------------------------------------------------------------------------

describe('generateGpx — basic', () => {
  const input: GpxGeneratorInput = {
    name: 'Test Trail',
    segments: [
      makeSeg('seg1', [
        [-105.0, 40.0],
        [-105.1, 40.1],
        [-105.2, 40.2],
      ]),
    ],
  };

  it('returns a GPX 1.1 XML string', () => {
    const { gpx } = generateGpx(input);
    expect(gpx).toContain('<?xml version="1.0"');
    expect(gpx).toContain('<gpx version="1.1"');
    expect(gpx).toContain('http://www.topografix.com/GPX/1/1');
  });

  it('includes the track name in <metadata> and <trk>', () => {
    const { gpx } = generateGpx(input);
    const nameOccurrences = countOccurrences(gpx, '<name>Test Trail</name>');
    expect(nameOccurrences).toBeGreaterThanOrEqual(2); // <metadata> + <trk>
  });

  it('emits one <trkseg> for a single contiguous segment', () => {
    const { gpx, trackSegmentCount } = generateGpx(input);
    expect(trackSegmentCount).toBe(1);
    expect(countOccurrences(gpx, '<trkseg>')).toBe(1);
  });

  it('reports correct trackpoint count', () => {
    const { trackpointCount } = generateGpx(input);
    expect(trackpointCount).toBe(3);
  });

  it('emits <trkpt> with correct lat/lon attributes', () => {
    const { gpx } = generateGpx(input);
    // First point: lng=-105.0, lat=40.0
    expect(gpx).toContain('lat="40.0000000" lon="-105.0000000"');
  });

  it('includes elevation when coordinate has ele', () => {
    const withEle: GpxGeneratorInput = {
      name: 'Elev Trail',
      segments: [makeSeg('s1', [[-105.0, 40.0, 1500.5]])],
    };
    const { gpx } = generateGpx(withEle);
    expect(gpx).toContain('<ele>1500.50</ele>');
  });

  it('omits <ele> when elevation is absent', () => {
    const { gpx } = generateGpx(input);
    expect(gpx).not.toContain('<ele>');
  });
});

// ---------------------------------------------------------------------------
// Description / optional fields
// ---------------------------------------------------------------------------

describe('generateGpx — description', () => {
  it('includes <desc> tag in metadata when description provided', () => {
    const { gpx } = generateGpx({
      name: 'Trail',
      description: 'A scenic route',
      segments: [makeSeg('s1', [[-105.0, 40.0], [-106.0, 41.0]])],
    });
    expect(gpx).toContain('<desc>A scenic route</desc>');
  });

  it('omits extra <desc> tag when no description provided', () => {
    const { gpx } = generateGpx({
      name: 'Trail',
      segments: [makeSeg('s1', [[-105.0, 40.0], [-106.0, 41.0]])],
    });
    // The attribution <desc> is always present; check there is no inline description
    expect(gpx).not.toContain('<desc>A scenic route</desc>');
  });
});

// ---------------------------------------------------------------------------
// Reversed segment
// ---------------------------------------------------------------------------

describe('generateGpx — reversed segments', () => {
  it('traverses coordinates in reverse when reversed=true', () => {
    const seg = makeSeg('s1', [
      [-105.0, 40.0],
      [-105.5, 40.5],
      [-106.0, 41.0],
    ]);
    const forward = generateGpx({ name: 'T', segments: [seg] });
    const reversed = generateGpx({
      name: 'T',
      segments: [{ ...seg, reversed: true }],
    });

    // Forward: first trkpt lat=40.0; reversed: first trkpt lat=41.0
    const forwardIdx = forward.gpx.indexOf('<trkpt');
    const reversedIdx = reversed.gpx.indexOf('<trkpt');

    const forwardFirstPt = forward.gpx.slice(forwardIdx, forwardIdx + 60);
    const reversedFirstPt = reversed.gpx.slice(reversedIdx, reversedIdx + 60);

    expect(forwardFirstPt).toContain('lat="40.0000000"');
    expect(reversedFirstPt).toContain('lat="41.0000000"');
  });

  it('does not mutate the original segment coordinates', () => {
    const original = [-105.0, 40.0] as [number, number];
    const seg = makeSeg('s1', [original, [-106.0, 41.0]], { reversed: true });
    generateGpx({ name: 'T', segments: [seg] });
    // Original array should be unmodified
    expect(seg.coordinates[0]).toEqual([-105.0, 40.0]);
  });

  it('emits the same number of trackpoints whether reversed or not', () => {
    const seg = makeSeg('s1', [
      [-105.0, 40.0],
      [-105.5, 40.5],
      [-106.0, 41.0],
    ]);
    const { trackpointCount: fwd } = generateGpx({ name: 'T', segments: [seg] });
    const { trackpointCount: rev } = generateGpx({
      name: 'T',
      segments: [{ ...seg, reversed: true }],
    });
    expect(fwd).toBe(rev);
  });
});

// ---------------------------------------------------------------------------
// Discontinuity splitting into multiple <trkseg>
// ---------------------------------------------------------------------------

describe('generateGpx — discontinuity splitting', () => {
  /**
   * Two segments that are far apart geographically → should produce 2 trksegs.
   */
  it('splits into two <trkseg> elements for disconnected segments', () => {
    const segA = makeSeg('a', [
      [-105.0, 40.0],
      [-105.1, 40.1],
    ]);
    const segB = makeSeg('b', [
      [-110.0, 45.0], // far from segA's last point
      [-110.1, 45.1],
    ]);

    const { gpx, trackSegmentCount } = generateGpx({
      name: 'Disconnected',
      segments: [segA, segB],
    });

    expect(trackSegmentCount).toBe(2);
    expect(countOccurrences(gpx, '<trkseg>')).toBe(2);
    expect(countOccurrences(gpx, '</trkseg>')).toBe(2);
  });

  /**
   * Three segments where first two are connected and third is far away.
   */
  it('splits into two <trkseg> for mixed continuity', () => {
    const segA = makeSeg('a', [[-105.0, 40.0], [-105.1, 40.1]]);
    const segB = makeSeg('b', [[-105.1, 40.1], [-105.2, 40.2]]); // connected to A
    const segC = makeSeg('c', [[-120.0, 35.0], [-120.1, 35.1]]); // disconnected

    const { trackSegmentCount } = generateGpx({
      name: 'Mixed',
      segments: [segA, segB, segC],
    });

    expect(trackSegmentCount).toBe(2);
  });

  /**
   * Two segments that connect end-to-start → single <trkseg>.
   */
  it('keeps connected segments in a single <trkseg>', () => {
    const segA = makeSeg('a', [[-105.0, 40.0], [-105.1, 40.1]]);
    const segB = makeSeg('b', [[-105.1, 40.1], [-105.2, 40.2]]);

    const { trackSegmentCount } = generateGpx({
      name: 'Connected',
      segments: [segA, segB],
    });

    expect(trackSegmentCount).toBe(1);
  });

  /**
   * Three disconnected segments → three trksegs.
   */
  it('produces three <trkseg> for three disconnected segments', () => {
    const a = makeSeg('a', [[-100.0, 40.0], [-100.1, 40.0]]);
    const b = makeSeg('b', [[-110.0, 45.0], [-110.1, 45.0]]);
    const c = makeSeg('c', [[-120.0, 35.0], [-120.1, 35.0]]);

    const { trackSegmentCount } = generateGpx({
      name: 'Three Gaps',
      segments: [a, b, c],
    });

    expect(trackSegmentCount).toBe(3);
  });

  /**
   * Reversed segment — ensure end point (which becomes the effective start)
   * is used for continuity check.
   */
  it('handles reversed segment in discontinuity check', () => {
    // segA ends at [-105.1, 40.1]
    const segA = makeSeg('a', [[-105.0, 40.0], [-105.1, 40.1]]);
    // segB reversed: original end [-105.1, 40.1] becomes the effective start
    const segB = makeSeg('b', [[-105.2, 40.2], [-105.1, 40.1]], { reversed: true });

    const { trackSegmentCount } = generateGpx({
      name: 'ReversedContinuous',
      segments: [segA, segB],
    });

    expect(trackSegmentCount).toBe(1);
  });

  it('skips empty segments without creating empty trksegs', () => {
    const empty = makeSeg('empty', []);
    const seg = makeSeg('real', [[-105.0, 40.0], [-106.0, 41.0]]);

    const { trackSegmentCount, trackpointCount } = generateGpx({
      name: 'T',
      segments: [empty, seg, empty],
    });

    expect(trackSegmentCount).toBe(1);
    expect(trackpointCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Attribution metadata
// ---------------------------------------------------------------------------

describe('generateGpx — attribution', () => {
  const attributions: SourceAttribution[] = [
    {
      slug: 'mvum',
      name: 'Motor Vehicle Use Map',
      url: 'https://www.fs.usda.gov/recreation/programs/ohv/ohv_maps.shtml',
      license: 'Public Domain',
    },
    {
      slug: 'osm',
      name: 'OpenStreetMap',
      url: 'https://www.openstreetmap.org',
      license: 'ODbL-1.0',
    },
  ];

  it('includes source names in GPX attribution text', () => {
    const { gpx } = generateGpx({
      name: 'Attributed Trail',
      segments: [makeSeg('s1', [[-105.0, 40.0], [-106.0, 41.0]])],
      attributions,
    });
    expect(gpx).toContain('Motor Vehicle Use Map');
    expect(gpx).toContain('OpenStreetMap');
  });

  it('includes license information in attribution text', () => {
    const { gpx } = generateGpx({
      name: 'Attributed Trail',
      segments: [makeSeg('s1', [[-105.0, 40.0], [-106.0, 41.0]])],
      attributions,
    });
    expect(gpx).toContain('ODbL-1.0');
    expect(gpx).toContain('Public Domain');
  });

  it('includes default attribution when no attributions provided', () => {
    const { gpx } = generateGpx({
      name: 'Trail',
      segments: [makeSeg('s1', [[-105.0, 40.0], [-106.0, 41.0]])],
    });
    expect(gpx).toContain('TrailReady');
    expect(gpx).toContain('trailready.app');
  });

  it('XML-escapes special characters in name', () => {
    const { gpx } = generateGpx({
      name: 'Trail & <Test>',
      segments: [makeSeg('s1', [[-105.0, 40.0], [-106.0, 41.0]])],
    });
    expect(gpx).toContain('Trail &amp; &lt;Test&gt;');
    expect(gpx).not.toContain('<Test>'); // raw unescaped form must not appear
  });
});
