# <Feature name> feature

> Doc template for a **frontend feature** (`src/features/<name>/`). Copy it as `<name>.md` inside the feature folder and delete these quote lines.

**Folder:** `src/features/<name>/`
**Backend module:** `app/modules/<name>/`
**Routes using it:** `/cms/...`

## Purpose
One or two sentences.

## Contents
| File | What it is |
|---|---|
| `components/...` | ... |
| `api.ts` | Calls to `/<name>/*` |
| `hooks.ts` | TanStack Query hooks |
| `search.ts` | Ctrl+K entries this feature adds |
| `permissions.ts` | Permission keys this feature checks |

## Public API (what other code may import)
- List exactly what's exported for other features. Everything else is internal.

## Gotchas
- Anything non-obvious.

## Changelog
- YYYY-MM-DD: Created.
