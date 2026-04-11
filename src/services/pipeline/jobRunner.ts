import { import_source } from './importPipeline';
import { BBox, ImportSummary } from './importers/types';

export interface ImportJob {
  name: string;
  sourceName: 'osm' | 'geojson' | 'shapefile' | 'geofabrik' | string;
  inputPathOrUrl: string;
  bbox?: BBox;
  enabled?: boolean;
}

export interface JobRunResult {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  totals: ImportSummary;
  jobs: Array<{
    job: string;
    ok: boolean;
    summary?: ImportSummary;
    error?: string;
  }>;
}

function emptySummary(source = 'all'): ImportSummary {
  return { source, scanned: 0, inserted: 0, updated: 0, skipped: 0, errors: 0 };
}

function addSummary(target: ImportSummary, add?: ImportSummary) {
  if (!add) return;
  target.scanned += add.scanned;
  target.inserted += add.inserted;
  target.updated += add.updated;
  target.skipped += add.skipped;
  target.errors += add.errors;
}

export async function runImportJobs(jobs: ImportJob[]): Promise<JobRunResult> {
  const start = Date.now();
  const startedAt = new Date(start).toISOString();

  const totals = emptySummary('all');
  const out: JobRunResult['jobs'] = [];

  for (const job of jobs) {
    if (job.enabled === false) continue;
    try {
      const summary = await import_source(job.sourceName, job.inputPathOrUrl, job.bbox);
      addSummary(totals, summary);
      out.push({ job: job.name, ok: true, summary });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      totals.errors += 1;
      out.push({ job: job.name, ok: false, error: msg });
    }
  }

  const end = Date.now();
  return {
    startedAt,
    finishedAt: new Date(end).toISOString(),
    durationMs: end - start,
    totals,
    jobs: out,
  };
}

export function texasBBoxPreset(): BBox {
  return { minLng: -106.65, minLat: 25.84, maxLng: -93.50, maxLat: 36.50 };
}

export function dfwBBoxPreset(): BBox {
  return { minLng: -98.10, minLat: 32.40, maxLng: -96.30, maxLat: 33.40 };
}

export function barnwellBBoxPreset(): BBox {
  return { minLng: -94.90, minLat: 32.78, maxLng: -94.85, maxLat: 32.83 };
}

export function geofabrikJobForArea(
  name: string,
  stateUrl: string,
  bbox: BBox,
  enabled = true
): ImportJob {
  return { name, sourceName: 'geofabrik', inputPathOrUrl: stateUrl, bbox, enabled };
}
