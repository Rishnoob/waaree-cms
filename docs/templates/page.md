# <Page name>

> Doc template for a **frontend route** (`src/app/**/page.tsx`). Copy it as `page.md` next to `page.tsx` and delete these quote lines.

**Route:** `/cms/...`
**Area:** CMS | Public site
**Permission needed:** `<module>.<action>` (or "public")
**Feature folder:** `src/features/<name>/`

## Purpose
One or two sentences: what the user does here.

## What's on screen
- Main parts of the page, top to bottom.

## Data
| Calls | Endpoint | When |
|---|---|---|
| `useXxx()` | `GET /...` | On load |

## User actions
- Action → what happens → which endpoint it calls.

## Depends on / used by
- **Depends on:** UI components, features, blocks.
- **Linked from:** menus, other pages, Ctrl+K entries.

## Gotchas
- Anything non-obvious: edge cases, permission quirks, known limits.

## Changelog
- YYYY-MM-DD: Created.
