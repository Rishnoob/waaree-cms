# Auth feature

**Folder:** `src/features/auth/`
**Backend module:** `waaree-apis/app/modules/auth/`
**Routes using it:** `/cms/login`, and every CMS screen (through `RequireAuth` in `app/(cms)/cms/(app)/layout.tsx`)

## Purpose
Logging in and out, and keeping CMS screens behind login.

## Contents
| File | What it is |
|---|---|
| `api.ts` | `login(email, password)` stores the session. `logout()` revokes it on the server and clears it locally, even if offline |
| `components/LoginForm.tsx` | Email + password form (React Hook Form + Zod). Redirects to `?next=` (only `/cms…` paths) or `/cms` |
| `components/RequireAuth.tsx` | Restores the session from the refresh cookie on first load. If that fails → `/cms/login?next=<current page>`. Shows a skeleton meanwhile |
| `components/UserMenu.tsx` | Initials avatar, name, roles, log-out button (sidebar footer) |
| `index.ts` | Public API |

The session itself lives in **`src/lib/auth/session.ts`** (shared, not a feature):
- The **access token is kept only in memory**, never in localStorage.
- `getAccessToken()` refreshes it automatically when it's within 30 s of expiry. Concurrent callers share one refresh.
- `useSession()` returns `unknown` / `anonymous` / `authenticated` + user.
- `useCan("users.manage")` is for showing or hiding UI. The API is what actually enforces permissions.

`src/lib/api/client.ts` adds `Authorization: Bearer …` to every call except public ones, and clears the session on a 401.

## Public API (what other code may import)
- `LoginForm`, `RequireAuth`, `UserMenu`. Client components only, so server pages can import this index safely.

## Gotchas
- `session.ts` is marked `"use client"`. Server components must never call it. They only render client components that do.
- The refresh cookie belongs to the API's domain, path `/auth`. In production, if web and API are on different domains, set `COOKIE_SAMESITE=none` (HTTPS required).
- Hiding a button is never security. Every permission is checked again by the API.

## Changelog
- 2026-10-30: Created.

## Sign-in for the whole website (2026-11-02)
- **Signing in:** staff sign in at **`/login`**, a website page with the site's own navbar. `/cms/login` redirects there, keeping `?next`. After signing in you go back to `next`, which must be a path on this site, or to `/cms`.
- **Account menu** (`AccountMenu`, in `LandingNav` on every page): your initials, with Open the CMS and Log out. Visitors see nothing. Phones get `MobileAccount` at the foot of the menu panel.
- **Footer** (`StaffSignIn`): "Staff sign in" for visitors, or "Log out (name)".
- **Logging out:** inside the CMS it goes to `/login`; anywhere else you stay on the page.
- **Reserved web addresses:** pages can't take `login`, `cms`, `factories` and a few others (`RESERVED_SLUGS` in the pages module).
