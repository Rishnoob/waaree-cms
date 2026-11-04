# Blocks module (custom blocks)

**Table:** `cms.custom_blocks` (migration 0009): name, description, body (`{"blocks": [...]}`, the same shape as a page body).

**API:**
- `GET /blocks` and `GET /blocks/{id}` need `pages.view`.
- `POST`, `PUT` and `DELETE /blocks/{id}` need `blocks.manage` (Admin, Editor).

The editor copies a custom block into a page when it's added. Editing or deleting a custom block never changes pages that already use it, so maker-checker approval still covers every change.
