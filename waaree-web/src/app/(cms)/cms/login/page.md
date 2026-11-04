# CMS login

**Route:** `/cms/login` (optional `?next=/cms/...`)
**Area:** CMS
**Permission needed:** public
**Feature folder:** `src/features/auth/`

## Purpose
Where CMS users log in. Afterwards they go back to the page they wanted (`next`), or to the dashboard.

## What's on screen
- Waaree wordmark, "Welcome back", work email + password, **Log in** button.
- Brand background: green→blue tint with faint circles, like waaree.com.
- An error box for wrong credentials or a locked account.

## Data
| Calls | Endpoint | When |
|---|---|---|
| `login()` | `POST /auth/login` | Submit. Stores the access token in memory; the refresh cookie is set by the API |

## User actions
- Log in. Pressing Enter submits.

## Depends on / used by
- **Depends on:** `@/features/auth` (`LoginForm`).
- **Linked from:** `RequireAuth` redirects (`?next=`), and the log-out button.

## Gotchas
- `next` only accepts `/cms...` paths, so it can't be used to redirect to other sites.
- Marked `noindex`.
- The same "Email or password is incorrect" message is shown for unknown emails and inactive users, so attackers can't tell which emails exist.

## Changelog
- 2026-10-30: Created.
