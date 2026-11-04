# CMS shell

The CMS is part of the Waaree website.

- **Global navbar:** the website's own navbar (`LandingNav`) stays on top. "CMS" is one of its items, shown only to signed-in staff (`landing/components/AdminLink.tsx`).
- **CMS sections:** plain labelled tabs under the navbar: Pages, UI Kit, Files, People, Activity, Settings. Your account (sign out) is in the website navbar, as on every page. Each one shows only with its permission. On the right is Search (Ctrl K). Phones get the same tabs; they scroll sideways.
- **Editing a page** (`/cms/pages/[id]`) takes the whole screen, like a document. Neither the navbar nor the tabs show there.

The tabs come from each feature's `nav.ts` via `features/cms-nav.ts`.

**Changelog**
- 2026-11-02: The icon rail was replaced. People couldn't tell what the icons meant (see docs/design/cms-ux.md).
