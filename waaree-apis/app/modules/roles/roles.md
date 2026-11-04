# Roles module

**Folder:** `app/modules/roles/`
**Route prefix:** `/roles`
**DB tables:** none of its own; uses `auth.roles`, `auth.permissions` and `auth.role_permissions` through the auth module

## Purpose
**Dynamic RBAC:** admins create roles and tick exactly which permissions each role has. This is what powers the permissions matrix in the CMS.

## Endpoints
| Method | Path | Permission | Does |
|---|---|---|---|
| GET | `/roles` | `roles.view` | Roles with their permission keys and user counts (Super Admin listed first) |
| GET | `/roles/permissions` | `roles.view` | Every permission grouped by module, used to draw the matrix |
| POST | `/roles` | `roles.manage` | Create a role (name, description, permissions) |
| PATCH | `/roles/{id}` | `roles.manage` | Rename, re-describe or change permissions |
| DELETE | `/roles/{id}` | `roles.manage` | Delete a role that has no users |

## Permissions defined
| Key | Meaning | Default roles |
|---|---|---|
| `roles.view` | See roles and what each one can do | Admin |
| `roles.manage` | Create, edit and delete roles | (Super Admin only) |

## Business rules
- **Super Admin (`is_system`)** always has every permission, including ones added in future. It can't be renamed, edited or deleted.
- **No privilege escalation:** you can only grant permissions you have yourself.
- Role names are unique (case-insensitive).
- A role with users can't be deleted (`role_in_use`). Move its users first.
- New permissions from code show up in the catalog automatically after an API restart.

## Depends on / used by
- **Depends on:** `auth.service` (`permissions_by_key`, `all_permission_keys`), `auth.deps`, `auth.models`.
- **Used by:** frontend `features/roles` (Roles screen + permissions matrix), and `features/users` (role picker).

## Changelog
- 2026-10-30: Created.
