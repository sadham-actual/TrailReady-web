import { BBox } from './types';

export function splitBBox(bbox: BBox, rows = 2, cols = 2): BBox[] {
  const out: BBox[] = [];
  const dLng = (bbox.maxLng - bbox.minLng) / cols;
  const dLat = (bbox.maxLat - bbox.minLat) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const minLng = bbox.minLng + c * dLng;
      const maxLng = c === cols - 1 ? bbox.maxLng : minLng + dLng;
      const minLat = bbox.minLat + r * dLat;
      const maxLat = r === rows - 1 ? bbox.maxLat : minLat + dLat;
      out.push({ minLng, minLat, maxLng, maxLat });
    }
  }

  return out;
}
