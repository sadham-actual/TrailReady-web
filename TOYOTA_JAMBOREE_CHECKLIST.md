# Toyota Jamboree Checklist

Event: Toyota Jamboree  
Venue: Barnwell Mountain Recreation Area  
Location: Gilmer, Texas  
App focus: Barnwell trails only

## Assumption

The currently loaded live trail set is intended to be the Toyota Jamboree trail set for Barnwell Mountain Recreation Area. Before the event, confirm the live dataset shown in the app matches the final Barnwell trail list you want to present.

## Go/No-Go Criteria

The demo is ready only if all of the following are true:

- The deployed app loads without errors.
- Browse, map, search, and trail detail all show Barnwell content.
- At least one known Barnwell trail detail page loads with live reports.
- Auth login works end to end on the deployed environment.
- Report submission succeeds for a Barnwell trail.
- Photo upload succeeds for a Barnwell trail.
- Planner save/load succeeds for an authenticated user.
- Waitlist submission succeeds.

## Pre-Event Setup

### Data

- Confirm migrations are applied in Supabase, including `005_barnwell_named_trails.sql`.
- Confirm the Barnwell import job has already been run if data was refreshed recently:
  - `npm run import:barnwell`
- Confirm trail browse results are limited to the Barnwell dataset you want to present.
- Confirm there are no placeholder/sample trails mixed into the live Barnwell dataset.
- Confirm at least 3-5 named Barnwell trails load correctly on detail pages.
- Confirm at least one Barnwell trail has recent reports and at least one has photos.

### Environment

- Confirm deployed env vars are present:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
- Confirm UploadThing is configured in the deployed environment.
- Confirm Supabase Auth redirect URLs match the deployed app URL.
- Confirm Google OAuth is configured if you plan to use Google sign-in live.

### Product Surface

- Confirm the map opens centered on Barnwell by default.
- Confirm homepage search returns Barnwell trails.
- Confirm `/map`, `/trails`, and trail detail pages all show the same Barnwell trail universe.
- Confirm `/expedition-waitlist` redirects to `/waitlist`.

## Day-Before Smoke Test

Run these flows against the deployed environment, not localhost:

1. Open home page.
2. Search for a known Barnwell trail from the homepage.
3. Open the same trail from the map.
4. Open the same trail from the trails index.
5. Verify all three paths land on the same detail page and data.

Then verify authenticated flows:

1. Log in with the demo account.
2. Open planner.
3. Save a vehicle profile.
4. Save a 3-trail bundle.
5. Reopen planner and confirm saved state loads.

Then verify field intel:

1. Open a Barnwell trail detail page.
2. Submit a report with no photo.
3. Refresh and confirm the report appears.
4. Submit a report with at least one photo.
5. Refresh and confirm the photo appears in the gallery.

Then verify lead capture:

1. Open `/waitlist`.
2. Submit an email address you control.
3. Confirm success or duplicate handling behaves correctly.

## Event-Day Checklist

### Device Prep

- Use the exact device and browser you will present from.
- Log in before the presentation starts.
- Keep one authenticated tab open on the deployed app.
- Keep one backup tab open on a known-good Barnwell trail detail page.
- Keep the device charged and on known-good network connectivity.
- Disable noisy notifications, auto-lock, and background interruptions.

### Demo Data Prep

- Pick 3 specific Barnwell trails to use in the presentation.
- Pick 1 trail with recent live reports.
- Pick 1 trail with photo intel.
- Pick 1 trail suitable for planner bundle comparison.
- Keep those URLs bookmarked and open in backup tabs.

### Final 10-Minute Verification

- Refresh the home page.
- Confirm search suggestions still show Barnwell trails.
- Confirm the map still centers on Barnwell.
- Open one known Barnwell trail and confirm detail data loads.
- Confirm the demo account is still authenticated.
- Submit one final low-risk test report only if your team wants same-day fresh intel.

## Suggested On-Stage Flow

1. Start on home page.
2. Search for a Barnwell trail.
3. Open the trail detail page.
4. Show vehicle-specific verdict.
5. Show map view centered on Barnwell.
6. Show planner with a 3-trail Barnwell bundle.
7. Show report submission.
8. Show photo intel if available.
9. End on waitlist if lead capture is part of the presentation.

## Fallback Plan

If live submission fails:

- Continue with preloaded Barnwell trail detail pages.
- Show existing reports/photos instead of creating a new one live.
- Use planner and map flows, which are safer for a live demo.

If auth fails:

- Skip planner save and report submission.
- Present browse, map, trail detail, GPX, and existing intel only.

If network quality is poor:

- Stay on already-open Barnwell tabs.
- Avoid refreshing during the presentation.
- Do not rely on photo upload live.

## Repo Pointers

- Demo default map center: [src/components/DiscoveryMap.tsx](/Users/jacobcole/Github/TrailReady-web/src/components/DiscoveryMap.tsx:466)
- Generic launch checklist: [README.md](/Users/jacobcole/Github/TrailReady-web/README.md:95)
- Setup notes and common issues: [SETUP.md](/Users/jacobcole/Github/TrailReady-web/SETUP.md:130)
- Barnwell migration: [supabase/migrations/005_barnwell_named_trails.sql](/Users/jacobcole/Github/TrailReady-web/supabase/migrations/005_barnwell_named_trails.sql:1)
