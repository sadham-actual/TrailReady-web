import { describe, expect, it } from 'vitest';
import { asDownloadFilename, collectAttributions, mapRpcRowsToPipelineSegments, parseBbox } from '@/lib/pipeline/geoApi';

describe('geo API helpers', () => {
  it('parses valid bbox', () => {
    expect(parseBbox('-98,32,-97,33')).toEqual({ minLng: -98, minLat: 32, maxLng: -97, maxLat: 33 });
  });

  it('rejects invalid bbox', () => {
    expect(parseBbox('a,b,c,d')).toBeNull();
    expect(parseBbox('-97,33,-98,32')).toBeNull();
  });

  it('maps rpc rows to pipeline segments', () => {
    const rows = [{
      segment_id: 'seg1',
      source_slug: 'osm',
      segment_name: 'A',
      reversed: true,
      geometry: { type: 'LineString', coordinates: [[-97, 32], [-97.1, 32.1]] },
      properties: { x: 1 },
    }];

    const out = mapRpcRowsToPipelineSegments(rows);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('seg1');
    expect(out[0].reversed).toBe(true);
    expect(out[0].coordinates[0]).toEqual([-97, 32]);
  });

  it('deduplicates attributions by source slug', () => {
    const rows = [
      { source_slug: 'osm', source_name: 'OpenStreetMap' },
      { source_slug: 'osm', source_name: 'OpenStreetMap' },
      { source_slug: 'mvum', source_name: 'USFS MVUM' },
    ];
    const out = collectAttributions(rows);
    expect(out).toHaveLength(2);
  });

  it('formats safe gpx filenames', () => {
    expect(asDownloadFilename('Black Bear Pass', 'trail')).toBe('trail-black-bear-pass.gpx');
    expect(asDownloadFilename('***', 'route')).toBe('route-track.gpx');
  });
});
