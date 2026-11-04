# core

**Folder:** `app/core/`

## Purpose
Shared plumbing that every module uses. **No business logic lives here.** If code is about pages, users or media, it belongs in a module.

## Files
| File | What it does |
|---|---|
| `config.py` | `get_settings()` reads all config from env / `.env` (pydantic-settings). The only place env vars are read. `db_url(migrator=True)` gives the Alembic login. Auth settings: JWT secret, token lifetimes, lockout, cookie SameSite |
| `db.py` | Engine, `get_db()` session dependency, the shared `Base` with constraint naming rules, `AuditColumns` mixin (`created_at/by`, `updated_at/by`), and `is_db_reachable()` |
| `errors.py` | One error format: `{"error": {code, message, details}}`. Raise `AppError(status, code, message)` from services. Unexpected errors are logged, and the client only sees `internal_error` |
| `http.py` | CORS allowlist from `CORS_ORIGINS` (never `*`) and security headers on every response (HSTS outside local) |
| `modules.py` | Auto-discovers `app/modules/*/router.py`. A module that fails to import is **logged and skipped**, and the rest of the API still starts. Runs optional `startup.py → on_startup()` hooks (failures logged, never fatal). `import_all_models()` feeds Alembic |
| `security.py` | Argon2id password hashing, JWT access tokens, and refresh tokens (only the SHA-256 hash is stored). `utcnow()` gives naive UTC for `DATETIME2` |
| `permissions.py` | `Permission(key, description, default_roles)` and `collect_permissions()`, which gathers every module's `permissions.py`. Guards themselves live in `app/modules/auth/deps.py` |

Coming in later steps: `storage.py`, `audit.py`, `search.py` (see PLAN.md §4).

## Rules
- Modules may import from `core`. `core` never imports from modules, except discovery in `modules.py` and `permissions.py`.
- Every new setting goes in `Settings` **and** in `.env.example`.

## Changelog
- 2026-10-30: Created: config, db, errors, http, modules.
- 2026-10-30: Added security, permissions, startup hooks, AuditColumns.
