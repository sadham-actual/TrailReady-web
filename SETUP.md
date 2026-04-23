# TrailReady Setup

This document describes the current application setup for the live TrailReady web app.

For the optional local PostGIS geometry pipeline, use [POSTGIS.md](./POSTGIS.md).

## What this repo uses today

TrailReady is currently built around:

- Next.js App Router
- Supabase auth and database tables defined in `supabase/migrations/`
- UploadThing for photo uploads
- Local client-side vehicle preference storage plus authenticated planner/profile persistence
- Optional geo trail import and GPX generation pipeline

This repo is not currently using Prisma.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Create `.env.local` in the project root.

Minimum app configuration:

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Optional local PostGIS pipeline configuration:

```env
DATABASE_URL="postgresql://trailready:trailready@localhost:5432/trailready"
```

## 3. Apply Supabase migrations

Run the SQL files in `supabase/migrations/` against your Supabase project in order.

Important files include:

- `001_trailready_init.sql`
- `002_geometry_pipeline.sql`
- `003_geo_api_rpc.sql`
- `004_geo_segments_bbox.sql`
- `005_barnwell_named_trails.sql`
- `006_security_fixes.sql`
- `007_photos_report_fk.sql`

If you use the local PostGIS pipeline, `POSTGIS.md` covers that workflow separately.

## 4. Configure auth providers

In Supabase Auth:

- Enable email/password if you want direct signup/login
- Enable Google if you want OAuth login
- Add your local and deployed callback URLs

Expected callback route in this app:

```text
/auth/callback
```

Reset-password flow expects:

```text
/auth/update-password
```

## 5. Configure UploadThing

The app uses UploadThing route handlers under:

- `/api/uploadthing`

Make sure your UploadThing environment variables are configured in the deployment environment according to your UploadThing setup. Trail photo uploads require an authenticated user.

## 6. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## 7. Smoke test flows

Recommended manual checks:

1. Browse trails anonymously on `/`, `/map`, and `/trails`
2. Open an existing trail detail page
3. Sign up or log in
4. Save a vehicle profile from `/profile`
5. Submit a report from `/trails/[id]/report`
6. Upload at least one photo during report submission
7. Confirm the report and photos appear on the trail detail page
8. Save a trip bundle from `/planner`

## Live-data behavior

The detail/report/photo APIs are now expected to use live data by default.

If `USE_MOCK_DATA=true` is set explicitly, mock content can still be used for development. Otherwise, missing trail detail data should return a real not-found response instead of silently falling back to sample content.

## Main scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run import:dfw
npm run import:texas
npm run import:barnwell
npm run import:source -- <source_name> <input_path_or_url>
npm run import:file -- <path>
```

## Common issues

### Auth redirects fail

Check:

- `NEXT_PUBLIC_APP_URL`
- Supabase Auth redirect URLs
- Google OAuth redirect configuration if Google sign-in is enabled

### Trail detail returns not found

Check:

- Migrations have been applied
- Trail data exists in `trails` or `geo_trails`
- `USE_MOCK_DATA` is not masking a data problem during development

### Report submission fails

Check:

- You are signed in
- `SUPABASE_SERVICE_ROLE_KEY` is set for server-side writes
- UploadThing is configured if photos are attached

### Planner/profile data looks duplicated

Vehicle profile saves now update the latest existing profile for a user instead of creating a new one on every save. If you already have historical duplicate rows, clean them up in Supabase manually.
