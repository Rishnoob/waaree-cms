# Roles feature

**Folder:** `src/features/roles/`
**Backend module:** `waaree-apis/app/modules/roles/`
**Routes using it:** `/cms/team` (Roles & permissions tab); `useRoles` is also used by `features/users`

## Purpose
Dynamic roles: a card per role, and an editor with a permissions matrix grouped by area.

## Contents
| File | What it is |
|---|---|
| `hooks.ts` | `useRoles`, `usePermissionCatalog` (cached 5 min), `useSaveRole` (create or update), `useDeleteRole` |
| `components/RolesScreen.tsx` | Role cards (name, description, users, permissions; Super Admin first with a "System" badge) + New role |
| `components/RoleEditorDialog.tsx` | Name, description, permissions matrix. Group checkbox shows all / some / none. Super Admin is read-only. Delete only for roles with no users |
| `nav.ts` | Sidebar entry (Administration → Roles & permissions, needs `roles.view`) |
| `index.ts` | Public API |

## Public API (what other code may import)
- `RolesScreen`, `useRoles`, `Role` type, `rolesNav`.

## Gotchas
- The editor is **remounted every time it opens** (`key={dialog.opened}` in RolesScreen), so it always starts from saved values. This avoids resetting state inside an effect.
- Permissions you don't have yourself are disabled with a note, matching the API's no-escalation rule.
- Area names: add friendly labels in `MODULE_LABEL` in `RoleEditorDialog.tsx` when a new backend module adds permissions.

## Changelog
- 2026-10-30: Created.
