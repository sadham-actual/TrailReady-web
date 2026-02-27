#!/usr/bin/env tsx
import { import_source } from '@/services/pipeline/importPipeline';

function parseBBox(raw?: string) {
  if (!raw) return undefined;
  const parts = raw.split(',').map((n) => Number(n.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const [minLng, minLat, maxLng, maxLat] = parts;
  return { minLng, minLat, maxLng, maxLat };
}

async function main() {
  const [sourceName, inputPathOrUrl, bboxRaw] = process.argv.slice(2);
  if (!sourceName || !inputPathOrUrl) {
    console.error('Usage: tsx scripts/import-source.ts <source_name> <input_path_or_url> [minLng,minLat,maxLng,maxLat]');
    process.exit(1);
  }

  const summary = await import_source(sourceName, inputPathOrUrl, parseBBox(bboxRaw));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
