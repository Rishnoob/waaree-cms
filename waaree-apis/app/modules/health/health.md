# Health module

**Folder:** `app/modules/health/`
**Route prefix:** `/health`
**DB tables:** none

## Purpose
Tells load balancers, deploy scripts and the frontend whether the API is up and can reach the database.

## Endpoints
| Method | Path | Permission | Does |
|---|---|---|---|
| GET | `/health` | public | Returns `{status, api, database, version}`. Gives **200** when everything is ok, **503** when the DB is down |

## Permissions defined
None. The endpoint is public on purpose and reveals no internals: no module names, hostnames or error text.

## Business rules
- The DB check is a `SELECT 1` using the app login (`waaree_app`). It runs in a thread so it doesn't block the event loop.

## Depends on / used by
- **Depends on:** `core/db.py` (`is_db_reachable`), `core/config.py`.
- **Used by:** the `waaree-web` status page (`src/features/system-status`), and later deploy and uptime checks.

## Gotchas
- A 503 here means "API fine, DB unreachable". Check the `.env` DB settings, the RDS security group, or your VPN/IP allowlist.

## Changelog
- 2026-10-30: Created.
