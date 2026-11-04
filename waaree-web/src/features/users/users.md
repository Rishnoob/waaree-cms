# Users feature

**Folder:** `src/features/users/`
**Backend module:** `waaree-apis/app/modules/users/`
**Routes using it:** `/cms/team` (People tab)

## Purpose
The Users screen: list, search, add, edit roles/access, set passwords.

## Contents
| File | What it is |
|---|---|
| `hooks.ts` | `useUsers`, `useCreateUser`, `useUpdateUser` (also refreshes role counts), `useResetPassword`. Types come from the generated API schema |
| `components/UsersScreen.tsx` | Page body: header + Add user, search, table (name/email, role badges, status, last login, actions), empty/loading/error states |
| `components/UserDialog.tsx` | Add/edit form: name, email (read-only when editing), password (add only, ≥ 12), role checkboxes, "Can log in" switch (not for yourself) |
| `components/ResetPasswordDialog.tsx` | New password (≥ 12). The API logs the user out everywhere |
| `nav.ts` | Sidebar entry (Administration → Users, needs `users.view`) |
| `index.ts` | Public API |

## Public API (what other code may import)
- `UsersScreen`, `usersNav`.

## Gotchas
- Action buttons only show with `users.manage`. Server rule violations (last Super Admin, escalation) come back as toast messages.
- The role list comes from `@/features/roles` (`useRoles`). Without `roles.view`, the dialog says so.

## Changelog
- 2026-10-30: Created.
