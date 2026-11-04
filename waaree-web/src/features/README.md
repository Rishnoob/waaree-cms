# features/

One folder per **feature** (auth, users, roles, pages, media, ...). Each holds its components, API hooks, `nav.ts` (sidebar entry), Ctrl+K search entries, permission keys and a `<name>.md`.

- Other code imports a feature **only through its `index.ts`** (and `nav.ts` for the registry). Never reach into another feature's files.
- **Sidebar registry:** `cms-nav.ts` has one line per feature. Add a screen → add its line.
- How to add one: [.claude/skills/add-feature](../../../.claude/skills/add-feature/SKILL.md)

| Feature | What it is |
|---|---|
| [auth](auth/auth.md) | Login, logout, route guard, user menu |
| [cms-shell](cms-shell/cms-shell.md) | Labelled CMS tabs, Ctrl+K search, full-screen editor |
| [users](users/users.md) | People (`/cms/team`) |
| [roles](roles/roles.md) | People → Roles tab |
| [landing](landing/landing.md) | Public showpiece at `/`: 3D scroll story of Waaree |
| [pages](pages/pages.md) | Pages (`/cms`): filterable list + website-menu outline, the page editor, approvals |
| [page-builder](page-builder/page-builder.md) | Sections, typing on the page, templates |
| [site](site/site.md) | Where pages appear (menu) + settings |
| [media](media/media.md) | Files (`/cms/media`) |
| [audit](audit/audit.md) | Activity (`/cms/audit`) |
| [system-status](system-status/system-status.md) | API/DB status card (no longer on the home page; kept for reuse) |
