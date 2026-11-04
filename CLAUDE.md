# Waaree CMS — Agent Rules

Read this file first, then [PLAN.md](PLAN.md) for the full design. If the code and these rules disagree, stop and ask. Don't guess.

## What this is

A CMS + public site for Waaree Energies. Admins build pages from **blocks** and **templates**, and every change goes through **maker-checker** approval before publishing. A **smart search** covers CMS pages and Waaree's existing website.

It's a completely separate project. Never import, copy or call code or data from other GIA projects (gisBackend, go-india-invest, finexcel, ...).

## Layout

```
WaareeCMS/            ← ONE git repo (monorepo): shared docs, skills, AI config + both apps
├── waaree-web/       ← Next.js + TypeScript (CMS at (cms)/, public site at (site)/) → Vercel, Root Directory = waaree-web
└── waaree-apis/      ← FastAPI + SQL Server "Waaree" + Meilisearch + S3 → server via GitHub Action (only on waaree-apis/** changes)
```

A change that touches both the API and the UI goes in **one commit**, so they never drift apart.

## Golden rules

1. **Keep it simple.** Build the smallest thing that does the job well. No speculative features or abstractions.
2. **One feature = one folder.**
   - Frontend: `src/features/<name>/` or `src/blocks/<type>/`.
   - Backend: `app/modules/<name>/`.
   - A feature must never import another feature's internals. Use `components/ui`, `lib/`, `core/`, or the other module's public `service.py`.
3. **Every page, module and block has a `.md` beside it**, using the templates in [docs/templates/](docs/templates/). **Update the `.md` in the same change as the code.** A change without its doc update is not done.
4. **Use the design system.** Build UI only from `src/components/ui/` and the tokens in `src/styles/tokens.css`. No hard-coded colors, fonts, spacing or one-off styled elements. If something is missing, add it to the UI kit first.
5. **Isolation.** A broken block renders an error placeholder; a broken backend module is skipped at startup and logged. Never let one feature take down another.
6. **Typed contracts.**
   - Pydantic on the backend, Zod on the frontend.
   - The frontend API types are **generated** from the backend OpenAPI. Never hand-write them.
7. **Database changes go through Alembic migrations only.** Follow the naming rules in PLAN.md §5:
   - SQL Server schema per domain (`auth`, `cms`, `media`, `nav`, `workflow`, `search`, `audit`, `site`).
   - Plural snake_case table names.
   - A child table is prefixed with its parent's name (`cms.pages` → `cms.page_blocks`).
8. **Security:**
   - No secrets in code. Use `.env`, and keep `.env.example` up to date.
   - Permission checks happen on the server for every route, through `Depends(require("<module>.<action>"))` from `app.modules.auth.deps`.
   - Sanitise rich text, and validate every upload's type and size.
   - Never use `allow_origins=["*"]`.
9. **Maker-checker is sacred.**
   - Content reaches the live site only through an approved `workflow.change_requests` row.
   - Nobody approves their own request.
   - `audit.logs` is insert-only.
10. **Plain words in the UI.** Use Pages, Media, Templates, Menu, Users. Never use "slug", "entity" or "schema" on screen.
11. **Accessible and testable.** Every interactive element gets a real label and role, so AI testers and screen readers can find it.

## Recipes (skills)

Use these instead of improvising:

| Task | Skill |
|---|---|
| New feature (frontend feature + backend module) | [.claude/skills/add-feature](.claude/skills/add-feature/SKILL.md) |
| New block type | [.claude/skills/add-block](.claude/skills/add-block/SKILL.md) |
| New table / DB change | [.claude/skills/add-migration](.claude/skills/add-migration/SKILL.md) |
| Test a flow in the browser | [.claude/skills/ai-test](.claude/skills/ai-test/SKILL.md) |

## Seeded roles & test accounts

| Role | Can |
|---|---|
| Super Admin | Everything, including managing users and roles. Still can't approve their own requests |
| Admin | Edit content + settings, submit for approval |
| Editor (maker) | Edit content, submit for approval |
| Approver (checker) | Review, approve or reject, view the audit log |

Every role has a dev-only test account seeded locally by `uv run python -m app.cli seed-dev`: `superadmin@waaree.test`, `admin@waaree.test`, `editor@waaree.test`, `approver@waaree.test`. The shared password is `DEV_SEED_PASSWORD` in `waaree-apis/.env` (never committed). `seed-dev` refuses to run unless `ENVIRONMENT=local`.

## Decisions

Big decisions live in [PLAN.md](PLAN.md). Smaller "why we chose X" notes go in [docs/decisions/](docs/decisions/). If you change a decision, update the doc in the same change.
