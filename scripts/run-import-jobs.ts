#!/usr/bin/env tsx
import { runImportJobs, texasBBoxPreset, dfwBBoxPreset, barnwellBBoxPreset, geofabrikJobForArea, ImportJob } from '@/services/pipeline/jobRunner';

function parsePreset(arg?: string) {
  if (!arg) return 'dfw';
  return arg.toLowerCase();
}

const TEXAS_GEOFABRIK_URL =
  'https://download.geofabrik.de/north-america/us/texas-latest-free.shp.zip';

async function main() {
  const preset = parsePreset(process.argv[2]);

  let jobs: ImportJob[];

  if (preset === 'barnwell') {
    jobs = [
      geofabrikJobForArea('geofabrik-barnwell', TEXAS_GEOFABRIK_URL, barnwellBBoxPreset()),
      // OSM fallback — flip enabled to true if Geofabrik data is unavailable
      { name: 'osm-barnwell-fallback', sourceName: 'osm', inputPathOrUrl: 'dummy',
        bbox: barnwellBBoxPreset(), enabled: false },
    ];
  } else if (preset === 'texas') {
    jobs = [geofabrikJobForArea('geofabrik-texas', TEXAS_GEOFABRIK_URL, texasBBoxPreset())];
  } else {
    // dfw — small bbox, Overpass is reliable enough at this scale
    jobs = [{ name: 'osm-dfw-seed', sourceName: 'osm', inputPathOrUrl: 'dummy',
      bbox: dfwBBoxPreset(), enabled: true }];
  }

  const result = await runImportJobs(jobs);
  console.log(JSON.stringify(result, null, 2));

  if (result.jobs.some((j) => !j.ok)) process.exit(1);
}

main().catch((err) => {
  console.error('Job runner failed:', err);
  process.exit(1);
});
