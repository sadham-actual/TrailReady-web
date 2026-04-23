#!/usr/bin/env tsx
import path from 'node:path';
import { import_source } from '@/services/pipeline/importPipeline';

function sourceFromExt(filePath: string): 'geojson' | 'shapefile' {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.geojson' || ext === '.json') return 'geojson';
  if (ext === '.shp') return 'shapefile';
  throw new Error(`Unsupported file extension: ${ext}. Use .geojson/.json/.shp`);
}

async function main() {
  const [filePath, sourceOverride] = process.argv.slice(2);
  if (!filePath) {
    console.error('Usage: tsx scripts/import-file.ts <file-path> [geojson|shapefile]');
    process.exit(1);
  }

  const source =
    sourceOverride === 'geojson' || sourceOverride === 'shapefile'
      ? sourceOverride
      : sourceFromExt(filePath);
  const result = await import_source(source, filePath);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('File import failed:', err);
  process.exit(1);
});
