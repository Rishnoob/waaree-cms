# Users module

**Folder:** `app/modules/users/`
**Route prefix:** `/users`
**DB tables:** none of its own; uses `auth.users` and `auth.user_roles` through the auth module

## Purpose
Lets admins manage CMS users: list, add, rename, assign roles, deactivate and reset passwords.

## Endpoints
| Method | Path | Permission | Does |
|---|---|---|---|
| GET | `/users` | `users.view` | All users with roles, active/locked state and last login |
| POST | `/users` | `users.manage` | Create a user (email, name, password ≥ 12 chars, role_ids) |
| PATCH | `/users/{id}` | `users.manage` | Change name, `is_active` or `role_ids` |
| POST | `/users/{id}/password` | `users.manage` | Set a new password, unlock, and **log the user out everywhere** |

## Permissions defined
| Key | Meaning | Default roles |
|---|---|---|
| `users.view` | See the list of CMS users | Admin |
| `users.manage` | Add users, change roles, deactivate, reset passwords | (Super Admin only) |

## Business rules
- **No privilege escalation:** a non-Super-Admin can only assign roles whose permissions they already have, and never the Super Admin role.
- Only a Super Admin can change a Super Admin.
- You can't deactivate yourself.
- There is **always at least one active Super Admin**. Any change that would remove the last one is rejected (`last_super_admin`).
- Deactivating a user revokes all their sessions immediately.
- Emails are stored lower-case and must be unique (`email_taken`).

## Depends on / used by
- **Depends on:** `auth.service` (lookups, `is_super_admin`), `auth.deps` (`require`, `CurrentUser`), `auth.models`.
- **Used by:** frontend `features/users` (Users screen).

## Audit & workflow
- User and role changes are admin actions, so they don't go through maker-checker. They will be written to `audit.logs` (build step 10).

## Changelog
- 2026-10-30: Created.
