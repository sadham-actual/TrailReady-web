import { describe, expect, it } from 'vitest';
import { parseGeoJsonSegments } from '@/services/pipeline/importers/geojson';
import { parseOverpassSegments } from '@/services/pipeline/importers/osm';
import { deriveAllowedUses, normalizeStatus } from '@/services/pipeline/importers/normalize';

describe('importer normalization', () => {
  it('normalizes status values', () => {
    expect(normalizeStatus('yes')).toBe('open');
    expect(normalizeStatus('closed')).toBe('closed');
    expect(normalizeStatus('winter')).toBe('seasonal');
    expect(normalizeStatus('something-else')).toBe('unknown');
  });

  it('derives allowed uses from properties', () => {
    const uses = deriveAllowedUses({ motor_vehicle: 'designated', atv: 'no' });
    expect(uses.ohv).toBe(true);
    expect(uses.atv).toBe(false);
  });

  it('parses GeoJSON linestring features', () => {
    const input = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'abc1',
          properties: { name: 'Test Segment', motor_vehicle: 'yes' },
          geometry: {
            type: 'LineString',
            coordinates: [[-97.1, 32.9], [-97.2, 33.0]],
          },
        },
      ],
    };

    const out = parseGeoJsonSegments(input, 'mvum');
    expect(out).toHaveLength(1);
    expect(out[0].sourceFeatureId).toBe('abc1');
    expect(out[0].allowedUses?.ohv).toBe(true);
  });

  it('filters OSM elements for OHV relevance', () => {
    const input = {
      elements: [
        {
          type: 'way',
          id: 10,
          tags: { highway: 'track', motor_vehicle: 'yes', name: 'Motor Track' },
          geometry: [{ lon: -97.1, lat: 32.8 }, { lon: -97.2, lat: 32.9 }],
        },
        {
          type: 'way',
          id: 11,
          tags: { highway: 'footway' },
          geometry: [{ lon: -97.3, lat: 32.8 }, { lon: -97.4, lat: 32.9 }],
        },
      ],
    };

    const out = parseOverpassSegments(input);
    expect(out).toHaveLength(1);
    expect(out[0].sourceFeatureId).toBe('way/10');
  });
});
