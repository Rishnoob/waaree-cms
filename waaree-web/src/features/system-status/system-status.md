# System status feature

**Folder:** `src/features/system-status/`
**Backend module:** `waaree-apis/app/modules/health/`
**Routes using it:** `/` (temporary, until the public site exists)

## Purpose
Shows whether the API and the database are reachable. It proves the frontend → API → DB chain works, including CORS. It's also the first example of the feature-folder pattern.

## Contents
| File | What it is |
|---|---|
| `api.ts` | `fetchSystemStatus()` calls `GET /health` through the typed client. **Never throws**: if the API can't be reached, it returns `down` |
| `hooks.ts` | `useSystemStatus()` is a TanStack Query hook that refreshes every 15 s |
| `components/SystemStatus.tsx` | Card with API and Database rows (Connected / Unreachable / Checking…) |
| `index.ts` | Public API |

## Public API (what other code may import)
- `SystemStatus` component, from `@/features/system-status`.

## Gotchas
- A 503 from `/health` means "API ok, DB down". It's handled separately from "API unreachable".
- Styling is temporary. It moves to `components/ui` once the design system exists (step 3).

## Changelog
- 2026-10-30: Created.
