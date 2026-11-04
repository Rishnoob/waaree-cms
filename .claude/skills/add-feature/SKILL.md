---
name: add-feature
description: Add a new feature to Waaree CMS the standard way, as a backend module in waaree-apis plus a frontend feature in waaree-web, with permissions, search entries and docs. Use whenever a new capability, screen or API area is requested.
---

# Add a feature

A feature is **one backend module + one frontend feature folder**. Nothing outside those two folders changes, except the registrations listed below.

## 0. Confirm first
- What the feature does, who can use it (permissions), and whether it needs maker-checker approval.
- Check that no existing module already owns this. If one does, extend it instead.

## 1. Backend: `waaree-apis/app/modules/<name>/`
Copy the structure of an existing module:

| File | Contains |
|---|---|
| `models.py` | SQLAlchemy tables (schema + naming rules: PLAN.md §5) |
| `schemas.py` | Pydantic request/response models |
| `repository.py` | DB queries only |
| `service.py` | Business rules. Other modules may import only this file, plus `deps.py`, `schemas.py` and `models.py` (for relationships). Never another module's `repository.py` |
| `router.py` | HTTP routes only. Every route has `Depends(require("<name>.<action>"))` (from `app.modules.auth.deps`) |
| `permissions.py` | Permission keys + descriptions (synced to `auth.permissions` on startup) |
| `tests/` | pytest: happy path, permission denied, validation error |
| `<name>.md` | From `docs/templates/module.md` |

- New tables → run the **add-migration** skill.
- Content that goes live → route it through `workflow.change_requests`, never publish directly.
- Write audit entries via `core/audit.py` for create, update, delete, submit and approve.
- The module is auto-loaded, so don't edit `main.py`.

## 2. Contract
- Regenerate the frontend API types from OpenAPI (command in `waaree-web/README.md`). Never hand-write API types.

## 3. Frontend: `waaree-web/src/features/<name>/`

| File | Contains |
|---|---|
| `api.ts` | Calls using the generated client |
| `hooks.ts` | TanStack Query hooks |
| `components/` | UI built only from `src/components/ui/` |
| `permissions.ts` | Keys this feature checks (same strings as the backend) |
| `search.ts` | Ctrl+K entries (screens/actions + the permission each needs) |
| `<name>.md` | From `docs/templates/feature.md` |

- CMS routes go in `src/app/(cms)/cms/(app)/<name>/page.tsx`, kept thin: they only compose feature components. Each `page.tsx` gets a `page.md` from `docs/templates/page.md`.
- Every CMS `page.tsx` exports `export const instant = false;`. It sits behind the login check, so Next can't prerender it. Without this, the dev overlay shows "Could not validate … instant navigation".
- Add the screen's sidebar entry in `<feature>/nav.ts`, plus one line in `src/features/cms-nav.ts`.
- Use plain words on screen, empty states that teach, and labels on every control.

## 4. Done means
- [ ] Backend tests pass; lint (Ruff) and types (Pyright) are clean.
- [ ] Frontend type check and lint are clean.
- [ ] All `.md` files are written. PLAN.md is updated if the feature changes a decision.
- [ ] The flow passes the **ai-test** skill in a real browser.
