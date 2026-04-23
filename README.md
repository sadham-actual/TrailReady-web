# TrailReady Web

TrailReady is a Next.js web app for off-road trail decision support.

The product goal is simple: help a driver decide whether their rig can make it through a trail before they leave for the trailhead. The app is intentionally read-first and anonymous-first for browsing, with authenticated flows for submitting reports, photos, and saved planning data.

## Current stack

- Next.js App Router
- React 19
- Tailwind CSS 4
- Supabase for auth and application data
- UploadThing for photo uploads
- Leaflet / React Leaflet for map rendering
- Vitest for pipeline tests
- Optional Supabase/PostGIS geometry pipeline for imported trail data

## Core product areas

- Landing page: search, nearby trails, vehicle setup prompt
- Map: interactive trail discovery and trail focus mode
- Trails: searchable trail index and trail detail pages
- Trail detail: reports, capability matrix, GPX track, elevation profile, photo intel
- Reports: authenticated field report submission with optional photo uploads
- Planner: vehicle profile plus saved 3-trail bundles
- Profile: authenticated vehicle profile management
- Waitlist: simple email capture flow

## Local app setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Optional for local PostGIS pipeline work:

```env
DATABASE_URL="postgresql://trailready:trailready@localhost:5432/trailready"
```

3. Start the app

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Required Supabase capabilities

Your Supabase project must support:

- Auth for email/password and any OAuth providers you enable
- Tables and policies from `supabase/migrations/`
- A service-role key for server-side route handlers
- Storage is not required for photo uploads because UploadThing handles file hosting

## Main scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
```

Geometry import scripts:

```bash
npm run import:dfw
npm run import:texas
npm run import:barnwell
npm run import:source -- <source_name> <input_path_or_url>
npm run import:file -- <path>
```

## Data modes

By default, the app now treats missing live trail detail data as missing data, not sample data.

`USE_MOCK_DATA=true` is still available for explicit mock-data development, but the live detail/report/photo APIs no longer silently fall back to sample content when the database misses.

## Launch checklist for demos

Before an event or stakeholder demo, verify:

- Supabase env vars are present in the deployed environment
- Auth login works end to end
- At least one known trail has live reports and loads on the detail page
- Photo uploads succeed through UploadThing
- Planner save/load works for an authenticated user
- Map default content matches the event region you want to present

For Toyota Jamboree at Barnwell Mountain Recreation Area, use the event runbook in [TOYOTA_JAMBOREE_CHECKLIST.md](./TOYOTA_JAMBOREE_CHECKLIST.md).

## Geometry pipeline

TrailReady also includes an optional geometry ingestion pipeline for importing trail geometry into Supabase/PostGIS.

See [POSTGIS.md](./POSTGIS.md) for local PostGIS setup, import commands, and migration details.

## Notes on stale docs

Older Prisma-based setup instructions are no longer valid for the current app architecture. Use this README plus `POSTGIS.md` and the migration files in `supabase/migrations/` as the current source of truth.
