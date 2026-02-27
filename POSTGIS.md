# TrailReady — Local PostGIS Development

This guide covers the **Stage 1 geometry pipeline** local infrastructure.  
For the hosted Supabase setup see `SETUP.md`.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Docker (with Compose v2) | ≥ 24 |
| psql (optional, for interactive sessions) | any |

---

## Quick Start

```bash
# 1. Start the PostGIS container
scripts/db-start.sh

# 2. Apply all SQL migrations in order
scripts/db-migrate.sh
```

That's it. The DB is now running at:

```
postgresql://trailready:trailready@localhost:5432/trailready
```

---

## Migration Files

All migrations live in `supabase/migrations/` and are named `NNN_<description>.sql`.  
They are **idempotent** — safe to re-run (use `if not exists` / `or replace` / `do $$ ... $$` guards).

| File | Description |
|------|-------------|
| `001_trailready_init.sql` | Core app schema (users, trails, condition\_reports, etc.) |
| `002_geometry_pipeline.sql` | **Stage 1** — sources, trail\_segments, geo\_trails, trail\_trail\_segments, routes, route\_segments |

### Running a single migration

```bash
scripts/db-migrate.sh supabase/migrations/002_geometry_pipeline.sql
```

### Running against a remote DB (e.g. local Supabase CLI)

```bash
USE_LOCAL_PSQL=1 \
  PGHOST=localhost PGPORT=54322 \
  PGUSER=postgres PGPASSWORD=postgres PGDATABASE=postgres \
  scripts/db-migrate.sh
```

---

## Schema Overview (Stage 1)

```
sources
  └── trail_segments   (geometry LineString/4326, source_feature_id, geom_hash)
        ├── trail_trail_segments ──▶ geo_trails
        └── route_segments       ──▶ routes
```

### Key design decisions

- **`trail_segments`** is the atomic unit. Every geometry object lives here once.
- **`geom_hash`** (SHA-256 of canonical WKB) enables deduplication without comparing geometries.
- **`source_feature_id`** preserves the upstream ID for idempotent re-ingestion.
- **`properties jsonb`** stores raw source attributes without schema migrations for each new source.
- **`allowed_uses jsonb`** stores per-use-type booleans: `{"4wd": true, "atv": false, "hiking": true}`.
- **`status`** is one of `open | closed | seasonal | unknown`.
- **`geo_trails`** is separate from the existing `public.trails` table — it won't break the current app.
- All tables have `updated_at` auto-updated via a `set_updated_at()` trigger.

### GiST indexes

PostGIS spatial queries (bounding-box intersects, ST\_DWithin, etc.) use the GiST index on `geom` / `bbox`:

```sql
-- Example: find segments near a point
select id, name
from public.trail_segments
where ST_DWithin(
  geom::geography,
  ST_MakePoint(-111.65, 38.57)::geography,
  5000   -- meters
);
```

---

## Stopping / Resetting

```bash
# Stop container (data persisted in Docker volume)
docker compose stop

# Full reset (destroys all data)
docker compose down -v
```

---

## Stage 5 — Import Job Runner

A lightweight idempotent job runner is included for scheduled imports.

### Commands

```bash
# DFW-first seed (recommended for quick validation)
npm run import:dfw

# Texas-first seed
npm run import:texas

# Generic job runner (preset: dfw|texas)
npm run import:jobs -- texas
```

All commands print structured JSON summaries:
- `scanned`
- `inserted`
- `updated`
- `skipped`
- `errors`

### Cron-friendly wrapper

Use `scripts/cron-import.sh` to run imports and write timestamped logs:

```bash
# run once
scripts/cron-import.sh dfw

# example cron (every day at 03:15 local)
15 3 * * * cd /Users/axis/.openclaw/workspace/trailready-web && scripts/cron-import.sh texas
```

Logs are written to `logs/import-jobs/`.

## Supabase Hosted

Run the same migration files in the **Supabase SQL Editor** or via the Supabase CLI:

```bash
supabase db push   # if using supabase CLI project link
```

PostGIS is enabled by default on all Supabase projects — no extra setup needed.
