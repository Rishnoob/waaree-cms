# site module

Site settings (known keys only, with defaults) and main-menu links.
Public `GET /site/public` gives the website its menu and public settings.
Permissions: `settings.manage`, `menu.manage`. Tables: `site.settings`, `nav.menu_items`.

## Sub-menus (2026-11-02)
- **What it is:** `nav.menu_items.column` (migration 0008) records which sub-menu of a built-in section a link sits in, e.g. Company → "Group Business".
- **Where the sub-menus are defined:** `SECTION_COLUMNS` in `router.py`. It mirrors the website's mega-menu columns (`waaree-web/src/features/landing/data/home.ts`), so keep the two in step.
- **What the API returns:** `columns` on `GET /site/menu` and `/site/public`.
- **How to place a page in one:** `PUT /site/placement/{id}` accepts `section:Company/Group Business`. An unknown sub-menu is refused with 422.
- **Older links:** links placed in a section before sub-menus existed have no column. They show in a "More" column.

## More, and removing a menu item (2026-11-02)
- `GET /site/public` returns `more`: every live page with no menu link, sorted by title. The website shows them under "More" at the end of the menu.
- `DELETE /site/menu/{id}` removes the item and everything under it. Pages inside fall back to More and stay live; plain links inside are deleted.
