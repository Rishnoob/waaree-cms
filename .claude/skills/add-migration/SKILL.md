---
name: add-migration
description: Create or change database tables in the Waaree SQL Server database via Alembic, following the project naming rules. Use for any new table, column, index or constraint in waaree-apis.
---

# Add a DB migration

All schema changes go through **Alembic** in `waaree-apis/migrations/`. Never run loose `.sql` against the database, and never edit a migration that has already been applied anywhere.

## Naming rules (PLAN.md §5)
- **SQL Server schema = domain**: `auth`, `cms`, `media`, `nav`, `workflow`, `search`, `audit`, `site`. A new domain needs a new schema plus a note in PLAN.md.
- Tables are **plural snake_case**. A **child table is prefixed with its parent's name**: `cms.pages` → `cms.page_blocks` → `cms.page_versions`.
- Link tables are named after both sides: `auth.role_permissions`.
- Foreign keys are `<thing>_id`.
- Constraint names:
  - `pk_<table>`
  - `fk_<table>_<column>`
  - `ix_<table>_<columns>`
  - `uq_<table>_<columns>`
  - `ck_<table>_<rule>`

## Standard columns
- `id BIGINT IDENTITY` primary key.
- `created_at`, `created_by`, `updated_at`, `updated_by` (`DATETIME2`, UTC).
- `deleted_at` when soft delete makes sense.
- JSON goes in `NVARCHAR(MAX)` with `CHECK (ISJSON(col) = 1)`.

## Steps
1. Add or change the SQLAlchemy model in the owning module's `models.py`.
2. Autogenerate: `uv run alembic revision --autogenerate -m "<schema>: <what changed>"`.
3. **Read the generated file.** Fix anything autogenerate misses: schemas, check constraints, data backfills, index names.
4. Make sure `downgrade()` really reverses `upgrade()`.
5. Apply it locally (`uv run alembic upgrade head`), then test the downgrade and upgrade again.
6. Update the module's `.md` table list.

## Special rules
- `audit.logs` must stay **insert-only**. Don't add update or delete paths, and keep the DB-level deny for the app user.
- Destructive changes (drop or rename a column or table) need a two-step migration (add new → backfill → switch code → drop old) and explicit approval from Rishabh.
