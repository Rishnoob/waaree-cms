# Collections module (CMS: "Data")

Structured content that changes often: quarterly results, blog posts, news, job openings. It is managed in CMS → Data and shown on pages by the "Data view" block, always from the published rows.

## Architecture: safe by design (the Wix / Webflow / Contentful model)
The database structure **never changes at runtime**. A collection is a catalogue entry, not a new SQL table. The API's database login stays read/write only, so nothing a user does can create, alter or drop a table.

| Table (`cms` schema) | Role |
|---|---|
| `collections` | **The catalogue.** One row per collection: `key` (stable id used by pages), name, description, **origin** (`cms` made in the CMS, `import` made from an Excel/CSV, `code` defined by developers), `approval_required`, `archived_at` |
| `collection_fields` | **The fields.** `key` (stable; the label can change), label, **type** (text, richtext, number, date, boolean, choice, image, file, link), required, options (JSON, e.g. choices), position, `hidden` |
| `collection_items` | **Every row of every collection.** `data` (the working copy, JSON keyed by field key), `live_data` (what the website shows), status (draft, in_review, published), `deleted_at` (Trash) |
| `collection_item_versions` | **Every saved state of every row** (append-only): action, data, comment, who, when |

## Safety rules (enforced by the API)
- **Nothing is permanently deleted.**
  - Rows go to **Trash** (`/trash`, `/restore`).
  - Collections are **archived** (`/archive`, `/unarchive`). There is no DELETE endpoint.
  - "Removing" a field hides it, and its data is kept.
- **A collection used on a page can't be archived.** The API refuses and names the pages.
- **Choices can be added, never removed,** so stored values stay valid.
- **Import only adds rows.** Imported rows start as drafts.
- **Values are checked per type on the server.** Unknown keys are dropped, and the required fields are checked before publishing.
- **Every step is a version.** Any version can be restored as a draft.
- **Edits don't reach the website until published:** `live_data` only changes on publish.

## Publishing
- **Approval off:** anyone with `data.edit` publishes.
- **Approval on:** `data.edit` sends the row; someone with `data.publish` (not the sender) approves and publishes, or sends it back with a note.
- **Taking a row off the website:** "Take off website" (unpublish) keeps the row as a draft.

## Permissions
| Permission | What it allows | Default roles |
|---|---|---|
| `data.view` | See collections and rows | Admin, Editor, Approver |
| `data.edit` | Add and edit rows; **create collections and add fields** (adding never removes anything, so a page's card design can make its data) | Admin, Editor |
| `data.publish` | Approve and publish | Admin, Approver |
| `data.structure` | Change structure: rename, approval, archive; rename, hide or reorder fields | Admin |

## API
- **Collections:** `GET/POST /collections`, `GET/PUT /collections/{key}`, `/archive`, `/unarchive`, `/usage`.
- **Fields:** `POST /collections/{key}/fields`, `PUT /collections/{key}/fields/{id}`, `PUT /collections/{key}/fields-order`.
- **Rows:**
  - `GET/POST /collections/{key}/items` (`?trash=true` for Trash).
  - `POST /collections/{key}/import` (adds rows only).
  - `PUT /collections/items/{id}`.
  - `POST /collections/items/{id}/submit|publish|reject|unpublish|trash|restore`.
  - `GET /collections/items/{id}/versions` and `POST …/versions/{vid}/restore`.
- **Website:** `GET /collections/public/{key}?sort&order&limit&offset&q` returns published rows and visible fields only. Sorting and search run in Python, which is fine for thousands of rows per collection.

## Next
- Detail pages per row (e.g. `/blog/<slug>`).
- `code`-origin collections registered at startup (e.g. an ERP feed).

## Naming and scale (how many collections can there be?)
- **No SQL tables are added per collection,** whether there are 10 collections or 10,000. The database keeps the same four tables; each collection is a catalogue row.
- **Collection keys:**
  - Made from the name: `quarterly-results`, `blog-posts`, `careers-openings`.
  - Lower-case words joined by hyphens, unique, with `-2`, `-3`… added if a name repeats.
  - Fixed forever, so renaming a collection never breaks a page. Names are free text.
- **Field keys:** made from the field label (`revenue-crore`, `period-end`) and unique within their collection. They are fixed too, so labels can be renamed freely.
- **Rows** live in `cms.collection_items`, indexed by `collection_id`, so one collection's rows never mix with another's. The data is stored as JSON keyed by those field keys.
- **Every collection records its origin** (`cms`, `import` or `code`) in the catalogue, plus who and when.
- **Limits today:** the website endpoint sorts and searches in Python, which is fine for thousands of rows per collection.
- **When a collection grows past that:**
  1. Move sorting and search into SQL, using `JSON_VALUE` with paging.
  2. Add an index on a busy field, using a computed column.
  3. For a very large or external feed, a developer can turn it into a dedicated `code`-origin collection backed by its own migration.
