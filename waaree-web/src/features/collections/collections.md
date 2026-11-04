# Data (CMS feature: collections)

Backend and architecture: [waaree-apis/app/modules/collections/collections.md](../../../../waaree-apis/app/modules/collections/collections.md).

| Route | Screen |
|---|---|
| `/cms/data` | `DataHome`: collection cards (live and not-yet-live counts, origin, needs-approval badge), Archived tab, and **New collection** |
| `/cms/data/[key]` | `CollectionScreen`: Rows, Fields, Settings, Trash |

- **New collection** (`DataHome`) starts from a template (Quarterly results, Blog posts, News & press, Job openings), from scratch, or **from an Excel/CSV**. Columns become fields with guessed types (`guessType`), and rows become draft rows.
- **Rows tab:** a spreadsheet-like table with search, Export (CSV), "Add from Excel" (adds only) and "Add a row". Clicking a row opens `RowDrawer`:
  - one input per field type;
  - Save as draft, Save and publish, or Save and send for approval;
  - approvers see Approve and publish, or Send back;
  - Take off website and Move to Trash;
  - the row's **history**, with "Restore this version".
- **Fields tab:** add, rename, required, choices (add only), reorder, hide/show. Nothing is deleted.
- **Settings tab:** name, description, the approval switch, "where it's used" (pages), and archive or bring back.
- `fields.tsx` holds the type names and icons, `ShowValue` (Indian number format, en-IN dates, pictures, files, links, rich text), Excel type guessing and the templates.
- **Shown on pages** by the page builder's **Data view** block (`page-builder/blocks/dataview.tsx`): a table, cards or list, with fields, sort, how many, "Show more" and an optional search box. It reads `/collections/public/{key}`, so the page updates when rows are published.
