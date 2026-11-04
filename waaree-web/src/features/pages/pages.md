# Pages (CMS feature)

Design and reasons: [docs/design/cms-ux.md](../../../../docs/design/cms-ux.md).
Backend: `waaree-apis/app/modules/pages` (maker-checker). Permissions: `pages.view`, `pages.edit`, `pages.approve`.

## Screens
- **`/cms` Pages** (`PagesScreen.tsx`, also at `/cms/pages`) has two views of the same pages:
  - **All pages** (`PagesTable.tsx`) is one list, like an inbox.
    - Status filters with counts: All, Live, Drafts, Waiting for approval. Needs changes, Approved and Scheduled appear only when there are some.
    - A "Menu item" dropdown and search sit above the list.
    - Each row shows the page and its web address, the status, where it is in the menu, and the last change.
    - "⋯" on a row offers Edit, Move in the menu…, View on website and Delete.
  - **Website menu** (`MenuOutline.tsx`) shows the menu as one outline, in navbar order. Waaree's menu items show their sub-menus, with Waaree's own links in grey (locked).
    - Each menu item lists its pages and links. "Add a page" sits on each item, and admins also get "Add a link" and "New menu item".
    - Drag a page to move it. Dropping it on a row also reorders it, for admins only.
  - A one-line notice ("2 pages are waiting for your approval · Show them") applies the matching filter.
- **New page** (`NewPageDialog.tsx`): the name, how it starts (template pictures), and where it shows in the menu (`WherePicker`). The web address comes from the name.
- **`/cms/pages/[id]` editor** (`PageEditor.tsx`):
  - Full screen. The page itself is in the middle (`PageCanvas`), and you type on it.
  - Changes autosave, and the top bar shows Saving…/Saved.
  - There is one main button, and its label follows the state: Send for approval, Approve and publish (with "later" and "Ask for changes" under its arrow), Publish now, or View on website.
  - A sentence under the bar says what's happening.
  - "Page settings" (a drawer) holds the name, web address, menu place, history and delete.
- `status.ts` holds the page state in plain words (Draft, Waiting for approval, Needs changes, Approved, Goes live …, Live). It is used everywhere.

## Workflow
draft → **submit** → in_review → **approve** → approved → **publish** → published
in_review → **reject** (comment required) → rejected → edit → draft
in_review/approved → **withdraw** → draft (the author takes it back to edit)

- A reviewer can't approve or reject a page they submitted.
- Pages in review are locked.
- Editing a live page starts a draft. Visitors keep seeing the live version until it's published again.
