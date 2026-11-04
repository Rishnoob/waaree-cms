# <Block name> block

> Doc template for a **block type** (`src/blocks/<type>/`). Copy it as `<type>.md` inside the block folder and delete these quote lines.

**Type key:** `<type>` (stored in `cms.page_blocks.type`, never rename)
**Gallery name:** what editors see in "+ Add block"
**Can contain child blocks:** yes / no
**Interactive:** no | yes → backend module `app/modules/<name>/`

## Purpose
What editors use this block for, in plain words.

## Props (`schema.ts`)
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `title` | string | yes | — | ... |

## Rendering
- How it looks on the site, including mobile and the empty state.

## Search (`search.ts`)
- Which entries it adds to the search index (kind, title, url anchor), or "none".

## Editor (`Editor.tsx`)
- Fields shown in the settings panel and anything special (media picker, rich text, ...).

## Gotchas
- Anything non-obvious.

## Changelog
- YYYY-MM-DD: Created.
