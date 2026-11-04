# Waaree CMS — Plan

> Status: **planning approved, build not started**
> Last updated: 2026-10-30
> Read this first. When a decision changes, update this file in the same change.

---

## 1. Goal

A **CMS MVP** for Waaree Energies, built to pitch and win the project.

- Waaree's team opens the CMS and **builds pages without a demo**.
- Pages are made of **blocks** (banner, heading, rich text, video, chat, ...) and **templates**. Admins can also make their own reusable templates and blocks.
- Pages appear on **Waaree's existing website**, through our site on their domain or an embed script (see §11).
- The product is **AI-native**: AI can read, extend and **test** it.
- It's our own test too. Adding or removing a feature must be easy, safe and isolated.
- It's a **completely separate project**. It never uses GIA / GoIndia / finexcel data or code.

---

## 2. Principles (non-negotiable)

1. **Simple first.** Build the smallest thing that works well.
2. **One feature = one folder**, on both frontend and backend. Adding a feature means adding a folder; removing it means deleting the folder.
3. **One design system.** Every screen uses the same tokens and components.
4. **Same pattern everywhere**, for users and for developers.
5. **A `.md` next to every page, module and block.** Use the templates in `docs/templates/`.
6. **Isolation.** A broken feature or block fails alone, never the whole app.
7. **Secure by default** (see §9).
8. **Latest stable versions**, pinned. Upgrade on purpose, not by accident.

---

## 3. Tech stack

Versions are the latest stable as of 2026-10-30. They are pinned in the lockfiles at scaffold time.

### Frontend: `waaree-web`
| Purpose | Choice |
|---|---|
| Framework | **Next.js 16.4** (App Router, React Server Components) |
| UI library | **React 19.3** |
| Language | **TypeScript 7** (strict) for type checking. The TS 6 compatibility package stays aliased as `typescript` for ESLint, the Next build and openapi-typescript until TS 7.1 ships an API (see `waaree-web/README.md`) |
| Styling | **Tailwind CSS 4.3**, with design tokens in one `@theme` file |
| Components | **shadcn/ui** (Radix primitives). The code lives in our repo, so we own it |
| Animation | **Motion** (micro-interactions only, respects reduced motion) |
| Server data | **TanStack Query 5** |
| Forms + validation | **React Hook Form + Zod 4** (the same Zod schemas define the blocks) |
| Drag & drop | **dnd-kit** |
| Rich text | **TipTap 3** |
| Search palette (Ctrl+K) | **cmdk** |
| Icons / toasts | lucide-react / sonner |
| API types | **Generated from the backend OpenAPI** (`openapi-typescript`), so frontend and backend can't drift apart |
| Package manager | **pnpm** |
| Tests | **Vitest** (unit) + **Playwright 1.64** (end-to-end) |

### Backend: `waaree-apis`
| Purpose | Choice |
|---|---|
| Language | **Python 3.14+** (managed by **uv**) |
| Framework | **FastAPI 0.162** |
| Validation | **Pydantic 2.14** + pydantic-settings (config from `.env`) |
| Database access | **SQLAlchemy 2.1** + `pyodbc` (ODBC Driver 18) |
| Migrations | **Alembic**. Every DB change is a migration file, never a loose `.sql` |
| Passwords | **Argon2** (`argon2-cffi`) |
| Tokens | **PyJWT**: short access token + httpOnly refresh cookie |
| HTML sanitising | **nh3** (rich text is cleaned on save) |
| Storage | **boto3** → AWS S3 (separate Waaree bucket) |
| Lint / format / types | **Ruff** + **Pyright** |
| Tests | **pytest** |

### Database
**SQL Server**, database **`Waaree`**. Tables are grouped into **SQL Server schemas** per domain (see §5).

- **Server:** the shared GIA RDS instance, **SQL Server 2017 Express**.
  - JSON functions (`ISJSON`, `JSON_VALUE`) and full-text search are available.
  - It has **no native JSON or vector types**. Vectors for AI search will live in Meilisearch.
  - Express caps a database at **10 GB**. That's plenty, because files live in S3 and only metadata goes in the DB. Production on Waaree's side should use a full edition.
- **Logins** (they can only reach `Waaree`, not the GIS databases):
  - `waaree_app`: the running API, read/write data only.
  - `waaree_migrator`: Alembic only, can create and alter tables.
  - Credentials are only in `waaree-apis/.env`.

---

## 4. Folder structure

```
WaareeCMS/
├── PLAN.md                     ← this file
├── CLAUDE.md                   ← rules for AI agents, whole project
├── .mcp.json                   ← AI tools for this project (Playwright MCP for testing)
├── .claude/
│   └── skills/
│       ├── add-feature/        ← recipe: new frontend feature + backend module
│       ├── add-block/          ← recipe: new block type
│       ├── add-migration/      ← recipe: new DB table / change
│       └── ai-test/            ← recipe: AI tests a flow in the browser
├── docs/
│   ├── templates/              ← .md templates: page.md, feature.md, module.md, block.md
│   ├── decisions/              ← short "why we chose X" notes (ADRs)
│   └── design/                 ← Waaree screenshots + extracted design rules
├── waaree-web/                 ← frontend app
└── waaree-apis/                ← backend app
```

**One git repo for everything (monorepo).**
- **Frontend deploy:** Vercel with Root Directory = `waaree-web`.
- **Backend deploy:** a GitHub Action that runs only when `waaree-apis/**` changes.
- A change to both the API and the UI goes in one commit.

### `waaree-web`
```
src/
├── app/                              ← routes only, kept thin
│   ├── (cms)/cms/                    ← admin, served at /cms/... (cms.<domain> later via proxy.ts)
│   │   ├── layout.tsx
│   │   ├── pages/
│   │   │   ├── page.tsx              ← list of pages
│   │   │   ├── page.md
│   │   │   └── [pageId]/edit/
│   │   │       ├── page.tsx          ← block editor
│   │   │       └── page.md
│   │   ├── media/ ...
│   │   ├── templates/ ...
│   │   └── settings/roles/ ...
│   ├── (site)/                       ← public site
│   │   └── [...path]/page.tsx        ← renders any published page by URL
│   └── embed/                        ← embed script entry (later)
│
├── features/                         ← one folder per feature
│   ├── auth/
│   │   ├── components/  LoginForm.tsx
│   │   ├── api.ts                    ← calls to /auth/*
│   │   ├── hooks.ts
│   │   ├── search.ts                 ← entries this feature adds to Ctrl+K
│   │   ├── permissions.ts            ← permission keys this feature uses
│   │   └── auth.md
│   ├── pages/ ...
│   ├── page-editor/ ...
│   ├── media/ ...
│   ├── templates/ ...
│   ├── menu/ ...
│   ├── roles/ ...
│   └── search/ ...
│
├── blocks/                           ← one folder per block type
│   ├── registry.ts                   ← auto-lists all blocks for the "+ Add block" gallery
│   ├── banner/
│   │   ├── schema.ts                 ← Zod: fields of this block
│   │   ├── Editor.tsx                ← settings form in the CMS
│   │   ├── Render.tsx                ← how it looks on the site
│   │   ├── preview.png               ← thumbnail for the gallery
│   │   └── banner.md
│   ├── heading/ ...  rich-text/ ...  image/ ...  pdf/ ...  video/ ...  columns/ ...
│
├── components/
│   ├── ui/                           ← design system: Button, Input, Card, Modal, Table, EmptyState ...
│   └── layout/                       ← CMS shell: Sidebar, Topbar, PageHeader
├── styles/
│   └── tokens.css                    ← colors, fonts, radius, shadows (from Waaree screenshots)
└── lib/
    ├── api/                          ← generated API client + fetch wrapper
    ├── auth/                         ← session, permission checks
    └── utils/
```

### `waaree-apis`
```
app/
├── main.py                           ← creates app, auto-loads modules
├── core/                             ← shared, no business logic
│   ├── config.py                     ← settings from .env
│   ├── db.py                         ← engine + session
│   ├── security.py                   ← hashing, tokens
│   ├── permissions.py                ← require("pages.edit") dependency
│   ├── storage.py                    ← the ONLY place that talks to S3
│   ├── audit.py                      ← writes audit log entries
│   ├── errors.py                     ← one error format for every API
│   └── core.md
├── modules/                          ← one folder per feature
│   ├── auth/
│   │   ├── providers/
│   │   │   ├── base.py               ← provider interface
│   │   │   └── local.py              ← MVP: email + password
│   │   ├── router.py                 ← HTTP routes only
│   │   ├── service.py                ← business logic
│   │   ├── repository.py             ← DB queries
│   │   ├── schemas.py                ← Pydantic request/response models
│   │   ├── models.py                 ← SQLAlchemy tables
│   │   ├── permissions.py            ← permission keys this module defines
│   │   ├── tests/
│   │   └── auth.md
│   ├── users/ ...  roles/ ...  pages/ ...  media/ ...
│   ├── templates/ ...  menu/ ...  search/ ...  audit/ ...
├── migrations/                       ← Alembic
└── tests/                            ← cross-module tests
```

---

## 5. Database design

### Naming rules
- **SQL Server schema = domain**: `auth`, `cms`, `media`, `nav`, `workflow`, `search`, `audit`, `site`.
- Tables are **plural snake_case**. A **child table carries its parent's name as a prefix**, so the hierarchy shows in the name: `cms.pages` → `cms.page_blocks` → `cms.page_versions`.
- Link tables are named after both sides: `auth.role_permissions`, `auth.user_roles`.
- Every table has `id`, `created_at`, `created_by`, `updated_at`, `updated_by`. Tables that support soft delete also have `deleted_at`.
- All times are **UTC** (`DATETIME2`). JSON columns are `NVARCHAR(MAX)` with an `ISJSON` check.
- Foreign keys are always named `<thing>_id`.

### Tables

```
auth.users                    id, email, full_name, password_hash, external_id, is_active, last_login_at, ...
auth.roles                    id, name, description, is_system            ← Super Admin is_system = 1 (can't delete)
auth.permissions              id, key ('pages.edit'), module, description  ← synced from code on startup
auth.role_permissions         role_id, permission_id
auth.user_roles               user_id, role_id
auth.user_sessions            id, user_id, refresh_token_hash, ip, user_agent, expires_at, revoked_at

cms.pages                     id, title, url_path, status, seo_title, seo_description, template_id, published_at, ...
cms.page_blocks               id, page_id, parent_block_id, type, sort_order, is_visible, props (JSON)
cms.page_versions             id, page_id, version_no, snapshot (JSON), published_by, published_at
cms.templates                 id, name, description, kind ('page' | 'block'), thumbnail_media_id, is_system, ...
cms.template_blocks           id, template_id, parent_block_id, type, sort_order, props (JSON)

cms.categories                id, name, slug, description, sort_order, is_highlighted, is_retired, seo_title, seo_description
cms.content_items             id, category_id, kind ('pdf' | 'video_upload' | 'video_embed'), title, descriptor, slug,
                              published_on (date), year, media_asset_id, embed_url, thumbnail_media_id,
                              allow_download, is_pending_asset, new_until (date), is_featured, featured_order,
                              featured_label, featured_cta, keywords, seo_title, seo_description, status, published_at
                              ← file size / page count / duration come from media.assets

media.assets                  id, page_id (nullable), s3_key, file_name, mime_type, size_bytes, kind, width, height, duration_sec, ...

nav.menus                     id, key ('header' | 'footer'), name
nav.menu_items                id, menu_id, parent_item_id, label, link_type, link_target, sort_order, is_highlighted

audit.logs                    id, user_id, action, entity_type, entity_id, changes (JSON), ip, at   ← insert-only

workflow.change_requests      id, entity_type, entity_id, action, snapshot (JSON), status ('pending' | 'approved' | 'rejected'),
                              submitted_by, submitted_at, reviewed_by, reviewed_at, review_comment, publish_at

site.settings                 key, value (JSON), updated_by, updated_at   ← portal behaviour switches (see §13a)
site.map_pins                 id, name, pin_type ('plant' | 'project_site' | 'distributor'), descriptor, x_pct, y_pct,
                              address, lat, lng, sort_order, status
site.consents                 id, consent_id (random, no personal data), choices (JSON), at   ← cookie consent record
```

**Content items vs pages:** a **content item** is one PDF / video / embed with its own fields (the unit Waaree uploads, searches and shares). A **page** is a layout of blocks. Blocks like *Category shelf*, *Featured carousel* and *Category rail* **show content items**. So uploading a new annual report updates every shelf, the carousel, search and its category page without editing a page. `content_items` isn't prefixed with `categories_` because items are first-class: they appear in shelves, the carousel, search and their own page.

**Maker-checker (MVP):** edits stay in draft. "Submit for approval" creates a `workflow.change_requests` row with a snapshot. A user with `workflow.approve` approves (it publishes now or at `publish_at`) or rejects it with a required comment. **Nobody can approve their own request**, and the DB rule holds no matter how roles are set up. Applies to pages, menus and templates.

**How it fits together:**
- A **page** has **blocks** (`cms.page_blocks`). Blocks nest through `parent_block_id`.
- **Publish** saves a full snapshot in `cms.page_versions`. The public site reads only that snapshot, so drafts never leak, and rollback is just republishing an old version.
- A **template** has the same shape (`cms.template_blocks`). "Create page from template" copies template blocks into page blocks. "Save as template" copies them the other way.
- Adding a new **block type** needs **no DB change**. It's just a new `type` value + `props`.

---

## 6. Blocks, templates & custom building blocks

| Thing | Who makes it | What it is | Stored in |
|---|---|---|---|
| **Block type** | Developer | A building block with its own behaviour: banner, video, chat, map ... | Code: `blocks/<type>/` |
| **Custom block** | Admin | A saved, reusable group of blocks, e.g. "Factory card" = image + heading + text | `cms.templates` (kind = block) |
| **Page template** | Admin / us | A whole starting page, e.g. "Investor page" | `cms.templates` (kind = page) |

- **Initial templates and blocks** come from **screenshots of Waaree's existing pages** that you share. We rebuild those as block types plus system templates.
- **Interactive blocks** (video player, chat, forms) keep only **settings** in `props`. Live behaviour lives in `Render.tsx`, plus that block's own backend module if needed (e.g. `modules/chat/`). If the block breaks, only that block shows an error.
- **AI-ready:** every block type has a complete Zod schema (exportable as JSON Schema). Later, "AI builds a template from a prompt" works like this: the AI returns a block tree, we validate it against the schemas, and save it as a template. It's the same path as today, so no redesign is needed.

---

## 7. Login & permissions

- **Authentication** sits behind a **provider interface**. The MVP uses `local` (email + password). Later we add a Waaree provider (e.g. Microsoft Entra ID / their user DB) and switch it in config. Users are linked through `external_id`.
- **Permissions** are declared in code by each module and synced to `auth.permissions` on startup. **Roles** are data, and **Super Admin** creates and edits them in a permissions matrix.
- The backend enforces permissions on every route. The frontend only hides what the user can't use.

---

## 8. Media (S3)

- A **separate bucket** for Waaree (name in `.env`), **private by default**.
- **Per-page folders through the file key:** `pages/{page_id}/{asset_id}-{file-name}.ext`, and `shared/...` for files used on many pages. Keys use the page **id**, so renames never break links.
- All uploads go through `core/storage.py`. Files are streamed (no temp files), the type and size are checked, and the key is stored in `media.assets`.
- Public files are served through a bucket policy / CDN. Large videos upload straight from the browser via **presigned URLs**.

---

## 9. Security

- No secrets in code. Everything is in `.env` (git-ignored); a `.env.example` is committed.
- Passwords are hashed with **Argon2**. Login is rate-limited, and the account locks after repeated failures.
- Short-lived access token. The refresh token is in an **httpOnly, Secure, SameSite** cookie and stored only as a hash.
- **CORS allowlist** (never `*`). Security headers include CSP, HSTS and X-Frame-Options (except on embed routes).
- Pydantic validates every input on the backend, and Zod validates it on the frontend.
- Rich text is sanitised on save (nh3). Uploads are checked by type and size.
- The audit log is **insert-only**, and the DB user can't update or delete rows in it.
- Permission checks happen on the server for every request.
- Each app has its own DB user with least privilege.
- Built with the **OWASP Top 10** in mind, ready for a VAPT audit.

---

## 10. UI / UX

**Feel:** minimal, modern, calm, slightly futuristic. Lots of whitespace, crisp type, soft depth, smooth micro-motion. No clutter.

- **Design tokens from Waaree's screenshots** (colors, font, radius, spacing) go in `styles/tokens.css`. The rules we extract are documented in `docs/design/`. Change a token and everything updates.
- Light + dark mode from day one.
- **Visual page editor:** you edit on the page itself, with a "+" between blocks that opens a gallery with previews, drag to reorder, an eye icon to hide, and settings in a side panel.
- **Ctrl+K smart search** everywhere. It shows only what you're allowed to see or do.
- **Plain words** only: Pages, Media, Templates, Menu, Users.
- **Empty states that teach**, a **first-login checklist**, autosave drafts, preview, undo.
- **Every list and form uses the same layout.** Learn one screen and you know them all.
- **Accessible:** keyboard navigation, visible focus, contrast that meets WCAG 2.2 AA.
- The public site works from 360 px phones up; the CMS is desktop-first.

---

## 10a. Smart search (public site + CMS)

**One search box for everything Waaree has**: CMS pages, their documents and videos, **and Waaree's existing website pages**.

### What goes into the index (sources)
| Source | How it gets in | When |
|---|---|---|
| CMS pages, blocks, PDFs, videos | Each block's `search.ts` returns its searchable entries | On approve + publish |
| **Existing Waaree website pages** | Our crawler reads their sitemap / URL list, extracts title, headings, text and linked PDFs | Nightly + "Re-index now" button |
| CMS screens & actions (Ctrl+K only) | Each feature's `search.ts` | On startup |

### Tables
```
search.sources        id, name, type ('cms' | 'sitemap' | 'url_list'), base_url, include_rules, exclude_rules,
                      schedule, is_active, last_indexed_at        ← admin adds "waaree.com sitemap" here
search.entries        id, source_id, source_type, source_ref, page_id, block_id, title, body_text, url,
                      kind ('page' | 'section' | 'document' | 'video'), year, keywords,
                      audience ('public' | 'cms'), boost, content_hash, indexed_at
search.synonyms       id, term, synonyms
search.promotions     id, query, entry_id, rank
search.query_logs     id, query, results_count, clicked_entry_id, at     ← anonymous
```

### Engine
- **`search.entries` (SQL Server) is the source of truth.** Every source writes here.
- **Meilisearch** (free, MIT, self-hosted) is the fast, typo-tolerant copy that visitors actually query. It can be rebuilt from `search.entries` at any time.
- The engine sits behind `core/search.py`. If Meilisearch is down, search falls back to SQL Server.
- Meilisearch is **never public**. Only our backend talks to it, using a restricted key.
- The crawler only fetches allowed Waaree domains, respects `robots.txt`, and skips unchanged pages (`content_hash`).

---

## 11. Showing pages on Waaree's existing website

| Option | Work for Waaree | Dynamic blocks |
|---|---|---|
| **Our site on their domain** (`portal.waaree.com` / `waaree.com/...`) | One DNS / routing rule | ✅ |
| **Embed script** (2 lines in their HTML) | Paste a snippet | ✅ |
| HTML from our API | Small server change | ⚠️ needs a small script |
| Raw JSON API | Build all renderers | ❌ they rebuild them |

The MVP focuses on our site on their domain. The embed script comes later. The block JSON supports all four options.

**waaree.com is built on Next.js, like us.** That gives two extra easy routes later:
- their Next.js can rewrite a path (e.g. `/investors/*`) to our site;
- we publish our block renderers as a package their Next.js app imports. That makes the "raw JSON API" option cheap for them too.

---

## 12. AI-native development & AI testing

**AI understands the code:**
- `CLAUDE.md` at the root, plus a `.md` beside every page, module and block, using the same template each time.
- `.claude/skills/` hold recipes, so an agent adds a feature, block or migration **the same way every time**.
- Typed contracts everywhere (OpenAPI → TS types, Zod, Pydantic), so mistakes fail at build time, not in production.

**AI tests the app:**
- **Playwright MCP** in `.mcp.json`: Claude Code opens the local app in a real browser, clicks through flows, fills forms, takes screenshots and reports bugs.
- **Claude in Chrome**: you can also ask Claude to test from your own Chrome browser.
- Turn passed AI test runs into **Playwright test files**, so they re-run automatically and catch regressions.
- To make AI testing reliable:
  - Seed **test accounts for each role** (Super Admin, Admin, Editor, Approver) and seed demo data.
  - Every interactive element gets a real **label** and an accessible role (plus `data-testid` where needed), so AI and screen readers find the same things.
- `.claude/skills/ai-test/` describes the main flows to check: login → create page → add blocks → publish → view on site.

---

## 13. Build order

Each step ends working, tested and documented before the next starts.

0. Answer the open questions (§14)
1. **AI foundation:** `CLAUDE.md`, `.md` templates, skills, `.mcp.json`
2. **Skeletons:** both apps, `core/`, module auto-loading, DB connection, Alembic, `/health`
3. **Design system:** tokens (after screenshots) + base UI components + CMS shell
4. **Login, users, roles & permissions** + CMS shell (sidebar)
5. **Media library** (S3 per-page folders, replace-file-everywhere)
6. **Categories + content items** (PDF / video upload / embed, "New" with expiry, featured)
7. **Pages + block editor** + starter blocks, including the content blocks: category rail, category shelf, featured carousel, media viewer
8. **Templates & custom blocks** (system templates from Waaree screenshots)
9. **Menu + Draft → Preview → Submit → Approve → Publish** (maker-checker, versions, scheduled publish, approval queues)
10. **Audit log** screen (filters + CSV export, 180-day minimum retention) + **Settings** screen (§13a)
11. **Public site:** home, category pages (automatic), item pages, search results (type + year filters), standard pages, 404, sitemap, share images + demo content
12. **Smart search (Ctrl+K)** + **Waaree map** (approximate pins) + **cookie consent**
13. **AI search** and **stock ticker** behind on/off switches (need a provider key; see §13a)
14. **AI test pass** over all flows → saved as Playwright tests

---

## 13a. Competitor proposal coverage (FE Ventures, WEL-PORTAL-01)

Everything they offer is in this plan. Items needing a **third-party account** are built behind a switch and stay off until Waaree gives keys.

| Their feature | Where in our plan | Status |
|---|---|---|
| Category rail, live counts, "New" badges | Content items + rail block (steps 6–7) | MVP |
| Search + type/year filters, empty state | Smart search + results page (steps 11–12) | MVP |
| AI search with source links, on/off, disclaimer | Step 13 | MVP behind switch (needs AI provider key) |
| Featured carousel | Block (step 7) | MVP |
| Category shelves, YouTube auto thumbnail, pending marker | Block + content items | MVP |
| In-page media viewer (YouTube, Vimeo, upload), PDF new tab + download | Block (step 7) | MVP |
| Waaree map | Approximate pins (step 12); Google Maps is a later switch | MVP (approx.) |
| Stock ticker | Step 13, server-cached, last value kept on failure | MVP behind switch (needs market-data key) |
| Behaviour settings | `site.settings` + Settings screen (step 10) | MVP |
| Responsive, a11y, reduced motion | Design system | MVP |
| SEO: clean URLs, meta, share images, XML sitemap | Step 11 | MVP |
| Analytics after cookie consent | Consent in MVP; analytics tag is a switch (needs Waaree's analytics ID) | MVP behind switch |
| Pages: home, category, item, search results, map, growth plan, standard pages, 404 | Pages + templates + step 11 | MVP |
| Section order, menu, create pages | Block editor + menu | MVP |
| Content by type with thumbnails, date/year, size/pages/duration | Content items + media | MVP |
| Draft → preview → approve → scheduled publish | Step 9 | MVP |
| Maker-checker, can't self-approve, rejection comment, queues | Step 9 | MVP |
| Audit log: read-only, filters, CSV, 180 days | Step 10 | MVP |
| 4 roles | **Dynamic roles** (better) | ✅ built |
| Users, lockout, password rules, session timeout | Step 4 | ✅ built (password rules/timeout via config) |
| Approval emails + reminders | In-app queue in MVP; email needs SMTP/SES | Later (needs mail account) |
| DPDPA admin tools (access / erasure requests) | Later | Later |
| Infra on Waaree's AWS/GCP, CDN, backups | Deployment doc for the pitch | Doc |

**Where we go beyond them:**
- Dynamic roles with escalation guards.
- Templates and reusable custom blocks.
- Nested and interactive blocks.
- Search that also covers the existing waaree.com pages.
- Refresh-token theft detection.
- WCAG-safe brand colors.
- Same stack as waaree.com (Next.js).
- AI-native codebase with AI browser testing.

---

## 14. Open questions

- [x] Maker-checker approval → **in the MVP**
- [x] Smart search → **public + CMS**, Meilisearch, also indexes Waaree's existing website pages (§10a)
- [x] Demo content → **generic solar-company placeholders**, labelled as demo
- [x] Media → **new bucket in our AWS account** (ap-south-1, own restricted IAM key); moves to Waaree's account later via `.env`
- [x] Waaree's current website tech → **Next.js** (same as ours). This makes our-site-on-their-domain or a shared block package straightforward (§11).
- [x] Screenshots + design rules → [docs/design/design-rules.md](docs/design/design-rules.md)

## 15. Later (not MVP)

AI template generation from a prompt · Waaree's real login (SSO) · embed script · approval emails (needs mail account) · Google Maps option · DPDPA request tools · video transcoding.
