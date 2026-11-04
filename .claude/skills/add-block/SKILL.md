---
name: add-block
description: Add a new block type (banner, video, chat, FAQ, ...) to the Waaree CMS page builder. Use when someone wants a new kind of content section editors can place on pages or in templates.
---

# Add a block type

A block type is **one folder** in `waaree-web/src/blocks/<type>/`. It needs **no database change**: blocks are stored as `type` + `props` JSON in `cms.page_blocks` / `cms.template_blocks`.

## 0. Check first
- Can editors already get this by combining existing blocks? If yes, make a **custom block** (saved template, kind = block) in the CMS instead of writing code.
- Pick a `type` key in kebab-case. **It can never be renamed** once used, because it's stored in the DB.

## 1. Files

| File | Contains |
|---|---|
| `schema.ts` | Zod schema for `props`. Every field has a default or is required. **It must be complete**: it's used for validation and later for AI template generation |
| `Editor.tsx` | Settings form for the CMS side panel, built from `components/ui` + React Hook Form + the schema |
| `Render.tsx` | How it looks on the public site. Works from 360 px up, has an empty state, and uses design tokens only |
| `search.ts` | Returns search entries for this block (`kind`, title, text, `#anchor`), or `[]` |
| `preview.png` | Thumbnail for the "+ Add block" gallery |
| `index.ts` | Exports `{ type, name, description, icon, schema, Editor, Render, search, allowsChildren }` |
| `<type>.md` | From `docs/templates/block.md` |

`blocks/registry.ts` picks the folder up automatically, so don't hand-edit other blocks.

## 2. Interactive blocks (chat, forms, live data)
- `props` hold **settings only**. Live data never goes in `props`.
- `Render.tsx` is a client component.
- If it needs server logic, create a backend module with the **add-feature** skill (e.g. `app/modules/chat/`).
- Wrap risky rendering so a failure shows the block's error placeholder, not a broken page.

## 3. Backend validation
- If the block stores HTML or links, make sure the backend sanitises them on save (nh3 / URL allowlist).

## 4. Done means
- [ ] Schema, Editor, Render and search are done, plus the `.md`.
- [ ] Unit test: the schema accepts defaults and rejects bad input.
- [ ] **ai-test**: add the block to a page, edit it, reorder it, hide it, submit, approve, and check it on the public site at desktop + 360 px.
