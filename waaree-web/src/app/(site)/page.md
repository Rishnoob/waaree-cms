# Public home (landing)

**Route:** `/`
**Area:** Public site
**Permission needed:** public
**Feature folder:** `src/features/landing/`

## Purpose
The showpiece: a scroll-driven, 3D story of Waaree (sunrise → the panel’s layers and value chain → scale → the platform). See `src/features/landing/landing.md`.

## What's on screen
- Floating glass nav (logo, Our story, Scale, Platform, Explore the CMS).
- Pinned story with the 3D solar panel, then the scale counters, the platform teaser and the footer.

## Data
None from the API yet. Facts are static, from waaree.com.

## User actions
- Scroll through the story. Move the pointer to tilt the panel. Open the CMS.

## Depends on / used by
- **Depends on:** `@/features/landing`.
- **Linked from:** the CMS login (later), and Waaree’s domain once deployed.

## Gotchas
- WebGL loads client-side only. The copy and sky render immediately.
- The old API/DB status card (`features/system-status`) is no longer shown here. `/health` is still available for monitoring.

## Changelog
- 2026-10-30: Created as a temporary status page.
- 2026-10-30: Replaced with the landing story (stage 1).
