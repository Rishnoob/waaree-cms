# Page builder (CMS feature)

Pages are built from **sections** ("blocks"), stored as JSON in the page body (`{"blocks": [...]}`). The editor and the public page draw them with the same code, so what you see is what goes live.

## How it's organised (add a block type = one file + one line)
| File | What it is |
|---|---|
| `types.ts` | `Block` (id, type, visible, props, style), `BlockStyle`, `BlockDef` |
| `registry.ts` | `BLOCKS`, the one list of block types, in gallery order, by group |
| `blocks/text.tsx` | Heading (size), Paragraph (bold, italic, links, lists), Quote |
| `blocks/media.tsx` | Picture (shape), Video (YouTube, Vimeo or an uploaded file), Downloads |
| `blocks/layout.tsx` | Big banner, Columns (2–4), Cards, Call to action, Divider, Space; `SiteButton` |
| `blocks/actions.tsx` | Buttons (solid, outline or text link) |
| `blocks/data.tsx` | Key numbers, Table (type into cells; add or remove rows and columns; header row), FAQ |
| `blocks/dataview.tsx` | **Data view** and **Carousel**: one block that shows a collection as a carousel, cards, list or table, laid out by a **card design** (see below) |
| `kit.tsx` | Editing helpers: `Txt` (plain text typed in place), `Choice`, `ListEditor` (with `rich` fields) |
| `rich.tsx` | **Tiptap** rich text: `RichField` (starts on click, cursor where you clicked; floating format bar), `RichSlot`, `RenderRich`, `cleanHtml` |
| `imports.ts` | Files → sections: Excel/CSV → table, Word → headings/text/tables/pictures, pictures, PDFs, videos; Excel paste |
| `history.ts` | `useUndoable`: page-level undo/redo (typing merges into one step; structure changes never do) |
| `components/EditorTools.tsx` | Undo/redo buttons and the Desktop/Tablet/Phone preview switch |
| `render.tsx` | `RenderBlock` and `RenderBlocks`, `StyleFrame` (the Look), parse/serialise, sketches |
| `canvas.tsx` | `PageCanvas`: the editor (type on the page, toolbar, gallery with search and "Your blocks", Content/Look panel) |
| `custom.ts`, `components/UiKit.tsx`, `components/CustomBlockEditor.tsx` | The UI Kit and custom blocks |
| `templates.ts` | Starting pages. Plain data, also read on the server, so no client helpers here |

A `BlockDef` has a label, hint, icon, group, `defaults()`, an optional `defaultStyle`, `Render` (takes `edit` to type in place), optional `Options` (the side panel) and `Sketch`.

## Look (every block)
- **Background:** none, soft, green tint, dark or brand. On dark and brand backgrounds, colour tokens are re-themed so text turns light.
- **Width:** full or narrow.
- **Alignment:** left or centre.
- **Space around:** less, normal or more.

All stored in `block.style`.

## UI Kit (`/cms/ui-kit`)
- Every block, shown live with sample content (real Waaree photos and published figures).
- **Custom blocks:** build a section once (`/cms/ui-kit/[id]`, same canvas, autosaved) and add it to any page from "Your blocks" in the gallery.
- Adding a custom block **copies** it into the page. A page change always goes through approval, and editing a custom block never alters live pages.
- Backend: `waaree-apis/app/modules/blocks`. Permission `blocks.manage` (Admin, Editor).

## Rich text (Tiptap 3)
- Paragraphs, banner and call-to-action lines, column and card text, and FAQ answers are rich text, stored as HTML.
- The editor starts only when a field is clicked, so pages with many fields stay fast.
- Select words to get the format bar: paragraph and two heading levels, bold, italic, underline, strikethrough, highlight, link (with an inline box), bulleted and numbered lists, alignment, and clear formatting. The usual keyboard shortcuts work.
- `cleanHtml` keeps a short allow-list on save and on display: b/strong, i/em, u, s, mark, a (http, mailto, tel or site paths only), ul/ol/li, p, br, h2/h3, blockquote, and text-align. No scripts, styles or other attributes get through.
- Older plain-text fields still show correctly (`toHtml`).

## Drag and drop (dnd-kit)
- **Moving sections:** drag a section's ⠿ handle (in its toolbar, shown on hover). The keyboard works too: Space to pick up, arrow keys to move.
- **Adding blocks:** drag a block, or one of your custom blocks, from the gallery onto the page. A green line shows where it will land; clicking still adds it.
- **Dropping files:** drop files from your computer onto the page. An overlay shows what each kind becomes, and the sections go where you dropped them.
- **Gotcha:** dnd-kit's drag delta includes the gallery's own scrolling, so the drop position comes from the pointer, tracked directly.

## Files → content
| File | Becomes |
|---|---|
| `.xlsx`, `.csv` | A table (first sheet with data; up to 200 rows × 12 columns) |
| `.docx` | Headings, paragraphs (bold, links and lists kept), tables and pictures (pictures go to Files) |
| Pictures | A Picture section each |
| PDFs | One Downloads list |
| Videos | A Video section each |

- **Table panel:** the "Import from Excel or CSV" button fills the table from a file. Cells copied from Excel or Google Sheets can be pasted into any cell, and the table grows to fit.
- **Libraries:** read-excel-file, PapaParse and mammoth, all loaded only when a file is used. Old `.xls` files get a clear "save as .xlsx" message.

## Undo, redo and device preview
- **Undo and redo:** buttons in the top bar, or Ctrl+Z and Ctrl+Shift+Z when you're not typing in a field.
- **Preview:** Desktop, Tablet (820 px) or Phone (400 px).
- **How the preview stays true:** blocks use container queries (`@xl` instead of `sm`, `@3xl` instead of `md`, `@4xl` instead of `lg`), so they lay out by the width they're given. The public page wraps blocks in `@container` too. **New blocks must use `@` variants, not `sm:`, `md:` or `lg:`.**

## Design first: the card designer (Data view and Carousel)
- **The card design** is an ordered list of **parts** (`slots`): Picture, Title, Description, Date, Tag, Number and Button. Each part is linked to a field of the data. In table and list layouts, the same parts become the columns or the line.
- **Designing before any data exists:** parts can be added before there is data. The block shows the card as it will look.
- **"Make data for this"** creates a collection whose fields are exactly the card's parts, in order, and links them. The collection is made in the CMS, with no approval by default.
- **"+ Add to the card"** offers to use a matching field the data already has, or to make a new field. A new field is **added to the collection** (an add-only step, allowed for editors); existing items show it empty until filled in.
- **Removing a part** only takes it off the card. The field and its data stay in Data.
- **Managing items inside the page editor:** the panel lists the items with their status, with "Add an item" and the row form (`RowDrawer`). Clicking a card on the canvas opens that item. The editor shows drafts too (marked); visitors only ever get live items.

## Changelog
- 2026-11-01: Blocks, templates, documents block.
- 2026-11-02: Rebuilt on a registry; 16 blocks; Look options; rich text; UI Kit and custom blocks.
- 2026-11-02 (later): Tiptap rich text, drag and drop, sections from files, Excel paste, undo/redo, device preview.
