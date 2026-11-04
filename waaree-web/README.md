# waaree-web

The Next.js frontend for Waaree CMS: the **CMS** (`/cms/...`) and the **public site** (everything else). Read [../CLAUDE.md](../CLAUDE.md) and [../PLAN.md](../PLAN.md) first.

## Setup
Needs Node 24+ and pnpm.

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
pnpm install
```

## Run
Start the API first (`../waaree-apis`, see its README), then:
```bash
pnpm dev        # http://localhost:3000  (CMS at /cms)
```

## Check
```bash
pnpm typecheck  # TypeScript 7 (native)
pnpm lint
pnpm test       # Vitest
pnpm build
```

### Browser tests (Playwright, uses your installed Chrome)
Both apps must be running, and the test accounts seeded (`uv run python -m app.cli seed-dev` in waaree-apis).
```bash
E2E_PASSWORD=<DEV_SEED_PASSWORD from waaree-apis/.env> pnpm test:e2e
```
Tests live in `tests/e2e/`. Each passing AI test run gets saved there (see `.claude/skills/ai-test`).

## API types
```bash
pnpm gen:api    # needs the API running; regenerates src/lib/api/schema.d.ts
```
Run this after **any** backend endpoint change. Never edit `schema.d.ts` by hand.

## TypeScript setup (why there are two)
TypeScript 7 (native, fast) has no programmatic API yet, and ESLint/typescript-eslint, Next's build and openapi-typescript still need it. Following Microsoft's side-by-side guidance:

| Package name | Actually is | Used by |
|---|---|---|
| `@typescript/native` | `typescript@7` (`tsc`) | `pnpm typecheck` |
| `typescript` | `@typescript/typescript6` (`tsc6`) | ESLint, Next build, openapi-typescript |

Once TypeScript 7.1 ships its API and the tools support it, drop the alias and use plain `typescript@7`.

## Structure
```
src/
├── app/
│   ├── (site)/          ← public site routes (URL has no "(site)")
│   └── (cms)/cms/       ← CMS routes, served at /cms/...
├── features/<name>/     ← one folder per feature (features/README.md)
├── blocks/<type>/       ← one folder per block type (blocks/README.md)
├── components/ui/       ← design system
├── styles/tokens.css    ← design tokens (the only place for colors/fonts)
└── lib/                 ← api client, env
```
Every `page.tsx` has a `page.md`, and every feature and block has its own `.md`.
