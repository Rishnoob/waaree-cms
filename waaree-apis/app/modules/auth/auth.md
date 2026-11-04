# Auth module

**Folder:** `app/modules/auth/`
**Route prefix:** `/auth`
**DB tables:** `auth.users`, `auth.roles`, `auth.permissions`, `auth.role_permissions`, `auth.user_roles`, `auth.user_sessions`

## Purpose
Owns **who you are** (login, sessions) and **what you can do** (permission resolution and route guards). It owns all `auth.*` tables. The `users` and `roles` modules manage those tables through this module's public functions.

## Endpoints
| Method | Path | Permission | Does |
|---|---|---|---|
| POST | `/auth/login` | public | Email + password → `{access_token, expires_in, user}`. Sets the httpOnly refresh cookie |
| POST | `/auth/refresh` | refresh cookie | Rotates the refresh token, returns a new access token + user |
| POST | `/auth/logout` | refresh cookie | Revokes this device's session, clears the cookie |
| GET | `/auth/me` | logged in | Current user, roles and every permission key |

## Permissions defined
None. Login is public, and the guards (`deps.py`) serve every other module.

## Tables
| Table | Purpose | Key columns |
|---|---|---|
| `auth.users` | CMS users | `email` (unique, lower-case), `password_hash` (Argon2id, null for external login), `external_id` (Waaree login later), `is_active`, `failed_login_count`, `locked_until` |
| `auth.roles` | Named permission sets | `name` (unique), `is_system` (= Super Admin: every permission, can't be edited or deleted) |
| `auth.permissions` | One row per permission key | `key` ('users.view'), `module`. **Synced from code on startup**, never edited by hand |
| `auth.role_permissions` | role ↔ permission | |
| `auth.user_roles` | user ↔ role | |
| `auth.user_sessions` | One row per logged-in device | `refresh_token_hash` (SHA-256; the raw token never touches the DB), `expires_at`, `revoked_at` |

Default roles (seeded by migration 0002): Super Admin (system), Admin, Editor, Approver.

## Business rules
- **Tokens:** a 15-minute JWT access token is sent as `Authorization: Bearer`. A 7-day refresh token lives in an httpOnly cookie scoped to `/auth`, with `Secure` outside local. SameSite is set by `COOKIE_SAMESITE`.
- **Rotation + theft detection:** every refresh revokes the old session and issues a new one. If a revoked refresh token is reused, **all of that user's sessions are revoked**.
- **Lockout:** after `MAX_FAILED_LOGINS` (5) wrong passwords, the account is locked for `LOCKOUT_MINUTES` (15).
- **No user enumeration:** unknown emails get the same `invalid_credentials` answer, and a dummy hash check keeps the timing equal. Inactive users get the same answer too.
- **Permissions:** declared per module in `permissions.py`, synced on startup (`startup.py`). `default_roles` are granted only when a permission first appears, so later admin changes are never overwritten. Super Admin = all permissions, always.
- **Provider pattern:** `providers/` checks credentials. `local` is the MVP. Waaree's login is a new provider file + `AUTH_PROVIDER=<name>`. Roles and permissions don't change.

## Public API for other modules
- `deps.py`: `require("x.y")` route guard, `get_current_user`, `CurrentUser` (`.can(key)`).
- `service.py`: `get_user`, `get_user_by_email`, `revoke_all_sessions`, `permissions_by_key`, `all_permission_keys`, `is_super_admin`, `user_permission_keys`, `sync_permissions`.
- `models.py`: `User`, `Role`, `Permission`, `user_roles`, for relationships and queries.

## Depends on / used by
- **Depends on:** `core/security.py` (hashing, tokens), `core/permissions.py` (catalog), `core/db.py`, `core/config.py`.
- **Used by:** every module's routes (`require`), plus `users` and `roles`. The frontend uses it in `features/auth`.

## Audit & workflow
- Audit logging of logins and failures will be added with `core/audit.py` (build step 10).

## Gotchas
- Login accepts any email *string* (no format check), so seeded `.test` addresses work. Creating a user still validates the format strictly.
- If you rename a permission key in code, the old key and its role grants are deleted on the next startup. Treat a rename as "new permission": re-grant it.
- `cli.py` has `create-superadmin` (first real admin) and `seed-dev` (local test accounts).

## Changelog
- 2026-10-30: Created: local login, sessions with rotation, lockout, permission sync, guards.
