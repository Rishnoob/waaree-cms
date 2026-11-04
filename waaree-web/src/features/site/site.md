# Site (CMS feature)

**Backend module:** `waaree-apis/app/modules/site`

- **Where a page shows in the menu** (`components/WherePicker.tsx`):
  - It is drawn as a small copy of the website menu. Click the menu item the page belongs in, "Its own menu item", or "Not in the menu".
  - Waaree's menu items have sub-menus, the columns of their mega menu (Company has "Company" and "Group Business"). Picking one asks "Which part of Company?", and the page appears in that column on the website, after Waaree's own links (`ColumnLinks` in `landing/components/SiteLinks.tsx`).
  - **New menu item** (admins) is right in the picker: type a name, press Enter, and the page goes in it. There is no "on its own" option.
  - **More:** a page placed nowhere else is listed under "More" at the end of the website menu (`/site/public` → `more`). No page is ever unreachable.
  - **Removing a menu item** (Website menu → ⋯ → "Remove menu item…", or "Remove this menu item" when it's empty): a dialog says exactly what happens. Its pages move to More and stay live; its plain links are removed. Waaree's own menu items can't be removed.
  - Places are written as strings: `section:Company/Group Business`, `item:12`, `top`, `none` (see `menu.ts`).
  - It is used in the New page dialog and in Page settings (`Placement.tsx`, which saves at once).
  - A page shows in the menu only while it's live, and its link always reads as the page's title.
- **The menu itself** is managed in Pages → "Website menu" (`features/pages` → `MenuOutline`). Admins (`menu.manage`) can add menu items and links, rename, hide and delete. Deleting a menu item moves its pages to the Main menu.
- **On the website**, `landing/components/SiteLinks.tsx` adds your menu items to the navbar and puts a "More" column in Waaree's mega menus. Empty menu items are hidden.
- **Settings** (`/cms/settings`): company details, the announcement bar and feature switches. AI search and the share ticker stay off until Waaree provides keys.

`menu.ts` holds the hooks (`useMenu`, `useMenuActions`, `usePlacement`) and the "where" helpers (`whereOf`, `toParent`).
