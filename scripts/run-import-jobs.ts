#!/usr/bin/env tsx
import { runImportJobs, texasBBoxPreset, dfwBBoxPreset, ImportJob } from '@/services/pipeline/jobRunner';

function parsePreset(arg?: string) {
  if (!arg) return 'dfw';
  return arg.toLowerCase();
}

async function main() {
  const preset = parsePreset(process.argv[2]);

  const bbox = preset === 'texas' ? texasBBoxPreset() : dfwBBoxPreset();

  const jobs: ImportJob[] = [
    {
      name: preset === 'texas' ? 'osm-texas-seed' : 'osm-dfw-seed',
      sourceName: 'osm',
      inputPathOrUrl: 'dummy',
      bbox,
      enabled: true,
    },
  ];

  const result = await runImportJobs(jobs);
  console.log(JSON.stringify(result, null, 2));

  if (result.jobs.some((j) => !j.ok)) process.exit(1);
}

main().catch((err) => {
  console.error('Job runner failed:', err);
  process.exit(1);
});
