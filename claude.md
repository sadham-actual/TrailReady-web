
# Claude Operating Rules — TrailReady

This document defines how Claude must behave when working on the TrailReady codebase.
These rules are authoritative and override default assumptions.

---

## 1. Product North Star

TrailReady exists to help users decide **whether their vehicle can make it through a trail before they go**.

TrailReady is used:
- BEFORE trip planning
- BEFORE route selection in OnX, AllTrails, Gaia, etc.

TrailReady must NEVER:
- Become a navigation or mapping competitor
- Offer turn-by-turn routing
- Attempt to replace OnX, AllTrails, Gaia, or similar tools

After using TrailReady, the user should feel:
- Confident
- Reassured
- Thankful they avoided a bad decision

---

## 2. Design Philosophy (Non-Negotiable)

Primary inspirations:
- onX
- Apple system app simplicity

Design priorities (in order):
1. **Clean, polished, modern UI**
2. **Clarity and confidence**
3. Functionality
4. Performance optimizations

Rules:
- Utility-first UI (not marketing-heavy)
- Minimal text, strong hierarchy
- Generous spacing and containment
- Map-first layouts when reasonable
- No clutter, no visual noise

Spacing and containment issues are **P0 bugs** and must be fixed immediately.

---

## 3. Scope Boundaries (Hard Limits)

Forbidden features unless explicitly approved:
- Messaging or chat
- Social feeds
- Gamification (badges, streaks, points)
- Trail creation or discovery of unmarked trails
- Route navigation or GPS guidance

TrailReady is a **decision-support tool**, not a social platform.

---

## 4. Authentication Rules

Access model:
- **Read-only content:** Anonymous access allowed
- **User input (reports, contributions):** Account required

This is not a monetization wall.
This is required to reduce spam and improve trustworthiness of reports.

Claude must not:
- Introduce login walls for browsing
- Require accounts to view trail data
- Add social account features

---

## 5. Claude Authority & Permissions

Claude MAY:
- Modify global layout files (layout.tsx, globals.css) to fix bugs or layout issues
- Refactor UI components for clarity, spacing, or polish

Claude MUST ASK BEFORE:
- Adding new dependencies
- Introducing new folders
- Creating new components not explicitly requested
- Changing authentication strategy
- Introducing global state libraries

When uncertain, Claude must ask clarifying questions **before coding**.

---

## 6. Change Strategy

Default behavior:
- Small, incremental changes
- Precise commits aligned to the requested task

If the current structure fundamentally blocks success:
- Claude may propose a larger refactor
- Refactors must be justified clearly before implementation

Claude should never “boil the ocean” without approval.

---

## 7. UX Behavior Rules

- All trails should be visible by default
- Risk must be clearly indicated when data is missing
- Reports should show:
  - Chronological order
  - Vehicle type labels
  - Differing outcomes by vehicle category
    - Passable for Type A
    - High risk for Type B
    - Impassable for Type C

When no vehicle is selected:
- Show a summarized outcome across vehicle types
- Prompt the user to select a vehicle (non-blocking)

---

## 8. Technical Defaults

Unless explicitly instructed otherwise:
- Next.js App Router
- TypeScript (strict)
- Tailwind CSS only
- Feature-based organization
- Server Components by default
- Client Components only when interactivity is required
- Read-heavy performance bias
- Anonymous-first browsing

---

## 9. Visual Quality Bar

TrailReady must feel:
- Modern
- Purpose-built
- Professional
- Outdoor-focused but not rustic or gimmicky

Avoid:
- Boxy layouts
- Edge-to-edge buttons without breathing room
- Overuse of borders
- Flat, lifeless components

Spacing, alignment, and hierarchy matter as much as functionality.

---

## 10. Final Rule

If a change makes TrailReady feel:
- More cluttered
- More social
- More like a mapping app
- Less confident or clear

It is the wrong change.

Stop and reassess.
