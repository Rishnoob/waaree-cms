# pages module (maker-checker)

**Tables:** `cms.pages`, `cms.page_events` (append-only history).
**Permissions:** `pages.view`, `pages.edit` (maker), `pages.approve` (checker).

## Workflow
draft → **submit** → in_review → **approve** → approved → **publish** → published
in_review → **reject** (comment required) → rejected → edit → draft …

Rules:
- A reviewer can't approve or reject a page they submitted (Super Admin excepted).
- Pages in review are locked.
- Editing a published page starts a new draft that needs review.
- Every step is logged with who, when and any comment.

## API
`GET/POST /pages`, `GET/PUT/DELETE /pages/{id}`, `POST /pages/{id}/submit|withdraw|approve|reject|publish`.

- `PageOut.has_live` is true once a version has been published.
- Autosave sends many PUTs, so one person's saves within 30 minutes count as a single "edited" step in the history.
- Deleting a page that has been live needs `pages.approve`. Its menu links are removed with it.
