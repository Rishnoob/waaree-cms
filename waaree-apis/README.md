# waaree-apis

The FastAPI backend for Waaree CMS. Read [../CLAUDE.md](../CLAUDE.md) and [../PLAN.md](../PLAN.md) first.

## Setup
Needs [uv](https://docs.astral.sh/uv/) and **ODBC Driver 18 for SQL Server**.

```bash
cp .env.example .env        # fill in DB values
uv sync                     # installs Python 3.14 + dependencies into .venv
uv run alembic upgrade head # bring the DB up to date
```

## Run
```bash
uv run uvicorn app.main:app --reload --port 8000
```
- Health: http://localhost:8000/health
- Docs: http://localhost:8000/docs (not in production)
- OpenAPI: http://localhost:8000/openapi.json, which the frontend generates its API types from

## Check
```bash
uv run ruff check . && uv run ruff format --check .   # lint + format
uv run pyright                                          # types
uv run pytest                                           # tests
```

## Structure
```
app/
├── main.py          ← creates the app, auto-loads modules
├── core/            ← shared plumbing (core/core.md)
└── modules/<name>/  ← one folder per feature (router, service, repository, schemas, models, <name>.md)
migrations/          ← Alembic (one file per DB change)
tests/               ← cross-module tests
```

- **New feature:** `.claude/skills/add-feature`
- **New table:** `.claude/skills/add-migration`

## Database logins
| Login | Used by | Rights |
|---|---|---|
| `waaree_app` | The running API | Read/write data |
| `waaree_migrator` | Alembic only | Create/alter tables |

Both can reach only the `Waaree` database.
