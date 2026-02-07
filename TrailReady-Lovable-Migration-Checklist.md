# TrailReady: Lovable → Next.js Migration Checklist

## Overview

**Goal:** Migrate the visual design and UI components from `trailready-ui-design` (Lovable/Vite/React Router) into `TrailReady-web` (Next.js 14) without breaking the existing backend, API routes, Prisma database, or deployment.

**Guiding principle:** We are keeping ALL backend logic, API routes, data services, and Next.js routing from `TrailReady-web`. We are taking the VISUAL LAYER (design tokens, component styles, layout patterns, animations) from `trailready-ui-design`.

---

## Architecture Differences Reference

| Aspect | Lovable (`trailready-ui-design`) | Original (`TrailReady-web`) |
|--------|----------------------------------|-----------------------------|
| Framework | Vite + React 18 | Next.js 14 (App Router) |
| Routing | React Router (`useNavigate`, `<Link>` from react-router-dom) | Next.js file-based (`app/`, `<Link>` from next/link, `useRouter` from next/navigation) |
| Data | Hardcoded sample arrays in each page | Prisma + PostgreSQL via API routes + `trailService.ts` |
| Styling | Tailwind 3.4 + shadcn/ui (default style) + custom design tokens in `src/index.css` | Tailwind 4 + shadcn/ui (new-york style) + custom design tokens in `src/app/globals.css` |
| shadcn config | `"style": "default"`, `"rsc": false` | `"style": "new-york"`, `"rsc": true` |
| Navigation | BottomNav (mobile app-style) | Header component (web-style top nav) |
| State | React Query (mostly unused), local useState | VehicleContext, localStorage, server components |
| Components | `src/components/` + `src/components/ui/` | `src/components/` + `src/components/ui/` |
| Pages | `src/pages/` (7 pages) | `src/app/` (file-based routes) |
| Build | Vite | Next.js |

---

## Phase 1: Design System Migration

**Priority: DO FIRST — this gives the entire app the new look with minimal risk.**

### 1.1 Merge CSS Design Tokens

**Source:** `trailready-ui-design/src/index.css`
**Target:** `TrailReady-web/src/app/globals.css`

Migrate these CSS custom properties from Lovable into the Next.js globals:

- [ ] Core background colors (`--background`, `--foreground`)
- [ ] Card and surface colors (`--card`, `--card-foreground`, `--popover`, etc.)
- [ ] Primary color — Forest Green (`--primary: 152 45% 28%`)
- [ ] Secondary, Muted, Accent colors
- [ ] Status colors (`--destructive`, `--success`, `--warning` + foregrounds)
- [ ] Border and input colors
- [ ] `--radius: 0.75rem`
- [ ] Custom design tokens: `--glass-bg`, `--glass-border`
- [ ] Custom shadows: `--shadow-soft`, `--shadow-medium`, `--shadow-large`
- [ ] Gradient overlays: `--gradient-hero`, `--gradient-card`
- [ ] Sidebar color tokens (if needed)

**⚠️ CAUTION:** The existing `globals.css` uses Tailwind v4 `@theme inline` syntax with HEX color values (`--color-forest-dark: #2D5F3F`). The Lovable file uses Tailwind v3 `@layer base` with HSL values (`--primary: 152 45% 28%`). You need to reconcile these — either convert Lovable's HSL to work with the v4 approach, or adopt the Lovable HSL variable system. **Recommend: adopt the Lovable HSL system since it's more granular and shadcn/ui expects it.**

### 1.2 Merge Tailwind Config

**Source:** `trailready-ui-design/tailwind.config.ts`
**Target:** `TrailReady-web/tailwind.config.ts` (or `@theme inline` block)

Migrate from Lovable:

- [ ] Color mappings (sidebar, card, popover, etc.)
- [ ] Border radius scale (`lg`, `md`, `sm`, `xl`, `2xl`)
- [ ] Custom spacing (`18`, `22`, `88`, `128`)
- [ ] Keyframe animations: `fade-in`, `slide-up`, `slide-down`, `scale-in`, `shimmer`
- [ ] Animation utilities referencing those keyframes
- [ ] Custom box shadows: `soft`, `medium`, `large`
- [ ] `tailwindcss-animate` plugin (add if not already present)

### 1.3 Install Missing Dependencies

Compare `package.json` files and add to `TrailReady-web`:

- [ ] `tailwindcss-animate` (if not present)
- [ ] `sonner` (toast notifications)
- [ ] `vaul` (drawer component)
- [ ] `embla-carousel-react` (if carousel is used)
- [ ] `cmdk` (command palette, if used)
- [ ] `react-resizable-panels` (if used)
- [ ] `@tanstack/react-query` (if you want to adopt it)
- [ ] `class-variance-authority` (should already exist)

**⚠️ DO NOT install:** `react-router-dom`, `lovable-tagger`, `vite` — these are Lovable-specific.

---

## Phase 2: shadcn/ui Component Migration

**Priority: DO SECOND — provides the foundational UI building blocks.**

### 2.1 Port shadcn/ui Base Components

The Lovable project has customized shadcn components. Copy them from `trailready-ui-design/src/components/ui/` into `TrailReady-web/src/components/ui/`, but add `"use client"` directive to each one since Next.js needs it.

Port these (replacing existing if the Lovable version looks better):

- [ ] `button.tsx` — Lovable added custom variants: `mapControl`, `iconSm`. **Merge** these variants into the existing button.
- [ ] `card.tsx`
- [ ] `badge.tsx`
- [ ] `input.tsx`
- [ ] `label.tsx`
- [ ] `select.tsx`
- [ ] `textarea.tsx`
- [ ] `dialog.tsx`
- [ ] `sheet.tsx`
- [ ] `skeleton.tsx`
- [ ] `scroll-area.tsx`
- [ ] `separator.tsx`
- [ ] `tabs.tsx`
- [ ] `toast.tsx` / `toaster.tsx`
- [ ] `tooltip.tsx`
- [ ] `progress.tsx`
- [ ] `accordion.tsx`
- [ ] `sonner.tsx` (Sonner toast provider)

**⚠️ NOTE:** The existing Next.js project uses shadcn `new-york` style; Lovable uses `default` style. They differ slightly in padding/sizing. When merging, prefer the Lovable visual appearance but keep the Next.js `"use client"` and RSC compatibility.

### 2.2 Update `lib/utils.ts`

- [ ] Ensure `cn()` function is present (should already be)
- [ ] Check for any additional utils Lovable added

---

## Phase 3: Custom Component Migration

**Priority: DO THIRD — port the Lovable-specific components that don't exist in the Next.js app.**

### 3.1 New Components to Create

These exist in Lovable but NOT in the Next.js app:

| Lovable Component | File | What It Does | Next.js Adaptation Notes |
|---|---|---|---|
| `BottomNav` | `src/components/BottomNav.tsx` | Mobile bottom tab bar (Explore, Map, Upload, Profile) | Convert `useNavigate()` → Next.js `usePathname()` + `<Link>`. **Decision needed: keep existing Header nav or add BottomNav for mobile?** |
| `PageHeader` | `src/components/PageHeader.tsx` | Minimal top header with title + optional right content | Convert any react-router usage to Next.js |
| `TrailCard` + `TrailCardCompact` | `src/components/TrailCard.tsx` | Beautiful card component with image, difficulty badge, stats | Replace hardcoded `Trail` type with existing Next.js types. Wire `onClick` to Next.js `<Link>` |
| `MapControls` + `SearchOverlay` | `src/components/MapControls.tsx` | Floating map controls and fullscreen search overlay | Integrate with existing Leaflet map on Browse page |

**For each component:**
- [ ] Copy the JSX/TSX from Lovable
- [ ] Add `"use client"` directive
- [ ] Replace `useNavigate()` with `useRouter()` from `next/navigation`
- [ ] Replace `<Link>` from `react-router-dom` with `<Link>` from `next/link`
- [ ] Replace `useParams()` from react-router with `useParams()` from `next/navigation`
- [ ] Replace hardcoded sample data with props or data from existing services
- [ ] Ensure TypeScript types match existing `src/types/index.ts`

### 3.2 Existing Components to Restyle

These already exist in Next.js but should be restyled to match Lovable's look:

| Existing Component | What to Change |
|---|---|
| `Header.tsx` | Update styling to match Lovable's design system (earthy colors, rounded corners, shadows). **Or** replace with `PageHeader` + `BottomNav` for a mobile-first approach |
| `VehicleSelectionModal.tsx` | Restyle with new design tokens, rounded cards, animations |
| `TrailVerdict.tsx` | Restyle verdict cards with `shadow-soft`, `rounded-2xl`, `animate-scale-in` classes |
| `MapView.tsx` (Leaflet) | Keep Leaflet integration but update surrounding UI to match Lovable's map page styling |

---

## Phase 4: Page-by-Page Migration

**Priority: DO FOURTH — adapt each page's layout to match Lovable while keeping real data.**

### Page Mapping

| Lovable Page | Lovable Route | Next.js Equivalent | Next.js Route | Action |
|---|---|---|---|---|
| `Index.tsx` | `/` | `app/page.tsx` | `/` | **Restyle** — update hero section to match Lovable's design (hero image, gradient overlay, MapPin branding, CTA buttons) |
| `Explore.tsx` | `/explore` | `app/trails/search/page.tsx` | `/trails/search` | **Restyle** — adopt TrailCard component, search overlay, filter UI. Keep existing API data fetching |
| `TrailDetail.tsx` | `/trail/:id` | `app/trails/[id]/page.tsx` | `/trails/[id]` | **Merge** — take Lovable's visual layout (rounded cards, trail notes, map preview, action buttons) but keep existing TrailVerdict logic, real report data, and submit report link |
| `MapView.tsx` | `/map` | `app/trails/browse/page.tsx` | `/trails/browse` | **Restyle** — update the UI around the Leaflet map to match Lovable's MapControls, floating panels, and trail list |
| `Profile.tsx` | `/profile` | *Does not exist yet* | `/profile` | **Create new** — port directly, convert routing. This is future functionality (no backend needed yet) |
| `OfflineMaps.tsx` | `/offline` | *Does not exist yet* | `/offline` | **Skip for now** — future feature, no backend support |
| `UploadGPX.tsx` | `/upload` | *Does not exist yet* | `/upload` | **Skip for now** — future feature, no backend support |
| `NotFound.tsx` | `*` | `app/not-found.tsx` | `*` | **Create/restyle** — port Lovable's 404 page |
| *N/A* | *N/A* | `app/trails/[id]/submit/page.tsx` | `/trails/[id]/submit` | **Keep + restyle** — this page exists only in Next.js. Apply new design tokens and component styles |

### 4.1 Landing Page (`/`)

**Source:** `trailready-ui-design/src/pages/Index.tsx`
**Target:** `TrailReady-web/src/app/page.tsx`

- [ ] Port hero background image approach (Lovable uses `<img>` + CSS gradient overlay)
- [ ] Port branding (MapPin icon + "TrailReady" text)
- [ ] Port tagline: "Find offroad trails. Know before you go."
- [ ] Port CTA button group (Explore Trails, Open Map, Upload GPX, Download Maps)
- [ ] **Keep:** existing vehicle selection modal integration
- [ ] **Adapt:** CTA links to actual Next.js routes (`/trails/browse`, `/trails/search`)
- [ ] Add `animate-fade-in` and `animate-slide-up` classes for entrance animations

### 4.2 Explore / Search Trails Page

**Source:** `trailready-ui-design/src/pages/Explore.tsx`
**Target:** `TrailReady-web/src/app/trails/search/page.tsx`

- [ ] Replace existing trail list items with `TrailCard` component from Lovable
- [ ] Port search overlay (`SearchOverlay` component)
- [ ] Port filter button UI
- [ ] Port "X trails found" results counter
- [ ] Port staggered `animate-slide-up` on trail cards
- [ ] **Keep:** existing API data fetching and real-time search filtering logic
- [ ] **Keep:** existing trail data types and service calls

### 4.3 Trail Detail Page

**Source:** `trailready-ui-design/src/pages/TrailDetail.tsx`
**Target:** `TrailReady-web/src/app/trails/[id]/page.tsx`

- [ ] Port visual layout: hero image area, rounded info cards, trail notes section
- [ ] Port difficulty badge styling with color coding
- [ ] Port vehicle type tags display
- [ ] Port map preview placeholder card
- [ ] Port action buttons (Download GPX, Save trail)
- [ ] **Keep:** existing TrailVerdict component and its risk assessment logic
- [ ] **Keep:** existing condition reports list with real data
- [ ] **Keep:** submit report link/button
- [ ] **Restyle** TrailVerdict to use Lovable's card styling (`rounded-2xl`, `shadow-soft`, animations)
- [ ] **Restyle** condition report cards with new design tokens

### 4.4 Browse / Map Page

**Source:** `trailready-ui-design/src/pages/MapView.tsx`
**Target:** `TrailReady-web/src/app/trails/browse/page.tsx`

- [ ] Port `MapControls` floating UI (search button, filter button, offline indicator)
- [ ] Port right-side zoom/location controls styling
- [ ] Port bottom trail list panel (sliding panel with `TrailCardCompact`)
- [ ] **Keep:** existing Leaflet map integration and real map tiles
- [ ] **Keep:** existing trail markers with real coordinate data
- [ ] **Keep:** existing map bounds change handler and trail filtering
- [ ] Replace Lovable's placeholder map div with the existing Leaflet `<MapView>` component

### 4.5 Submit Report Page

**Source:** *No Lovable equivalent*
**Target:** `TrailReady-web/src/app/trails/[id]/submit/page.tsx`

- [ ] Apply new design tokens (colors, shadows, radius)
- [ ] Update form card styling to `rounded-2xl`, `shadow-soft`
- [ ] Update status selector cards with `animate-scale-in`
- [ ] Update buttons with new primary color
- [ ] **Keep:** ALL existing form logic, validation, API submission, auth

---

## Phase 5: Navigation Decision

**This requires a decision from you, Jacob.**

The Lovable app uses a **mobile-first BottomNav** (Explore, Map, Upload, Profile tabs at the bottom). Your existing Next.js app uses a **top Header** with desktop nav links (Browse, Search) + vehicle selector.

### Options:

**Option A: Keep Header, add BottomNav for mobile**
- Desktop: existing top header (restyled)
- Mobile: hide header nav links, show BottomNav
- Best for: responsive web app that works on both desktop and mobile

**Option B: Full BottomNav (mobile-first)**
- Replace Header with BottomNav everywhere
- Best for: if you're treating this as a mobile web app / PWA preview for the future iOS app

**Option C: Keep Header only (restyle it)**
- Just update the Header component with Lovable's design tokens
- Skip BottomNav entirely
- Best for: keeping it simple, desktop-focused for now

---

## Phase 6: Polish & Verify

### 6.1 Animation & Transitions
- [ ] Verify `animate-fade-in`, `animate-slide-up`, `animate-scale-in` all work
- [ ] Add staggered animation delays on list items (`animationDelay: ${index * 0.05}s`)
- [ ] Verify hover transitions on cards (`hover:shadow-medium`, `active:scale-[0.99]`)

### 6.2 Responsive Design
- [ ] Test all pages at mobile widths (375px, 390px)
- [ ] Test at tablet width (768px)
- [ ] Test at desktop width (1280px+)
- [ ] Verify map page split view works (50/50 mobile, 70/30 desktop)

### 6.3 Functional Verification
- [ ] Browse trails loads real trail data from PostgreSQL
- [ ] Search trails filters correctly
- [ ] Trail detail shows real condition reports
- [ ] TrailVerdict risk assessment still calculates correctly
- [ ] Vehicle selector persists selection in localStorage
- [ ] Submit report form works end-to-end
- [ ] Anonymous auth still functions
- [ ] Leaflet map renders with real trail markers

### 6.4 Deployment
- [ ] Run `npm run build` locally to verify no build errors
- [ ] Push to GitHub
- [ ] Verify Vercel deployment succeeds
- [ ] Test production site at `trailready.sadham.org`

---

## Files to NOT Touch

These files should remain completely unchanged during migration:

```
# Backend / API
src/app/api/**/*              # All API routes
prisma/schema.prisma          # Database schema
prisma/seed.ts                # Seed script
prisma/migrations/**/*        # Database migrations

# Services & Data
src/services/trailService.ts  # Real API client
src/lib/prisma.ts             # Database client
src/lib/api/response.ts       # API utilities
src/lib/validations/**/*      # Zod schemas
src/lib/trailOutcome.ts       # Trail outcome calculation logic

# Types
src/types/index.ts            # TypeScript types (source of truth)

# Context
src/contexts/VehicleContext.tsx # Vehicle selection state

# Config (modify carefully)
next.config.js                # Next.js config
vercel.json                   # Deployment config
.env.local                    # Environment variables
```

---

## Claude Code Startup Prompt

Use this when starting a Claude Code session for the migration:

```
I'm migrating the visual design from my Lovable project (trailready-ui-design) into my 
production Next.js app (TrailReady-web). Both repos are cloned locally.

Key context:
- trailready-ui-design: Vite + React Router + shadcn/ui + Tailwind 3.4 + hardcoded data
- TrailReady-web: Next.js 14 App Router + Prisma + PostgreSQL + shadcn/ui + Tailwind 4
- I want to KEEP all backend logic, API routes, data services, and types from TrailReady-web
- I want to TAKE the visual design (CSS tokens, component styles, layouts, animations) from trailready-ui-design
- The Lovable CSS uses HSL variables in @layer base; the Next.js CSS uses @theme inline with HEX values

Please start with Phase 1 from the migration checklist: merge the design system CSS tokens from 
trailready-ui-design/src/index.css into TrailReady-web/src/app/globals.css, then update the 
tailwind config to include the new animations, shadows, and spacing. Don't touch any API routes, 
services, or Prisma files.
```
