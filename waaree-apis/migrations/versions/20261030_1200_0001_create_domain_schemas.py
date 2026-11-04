"""Create the domain schemas (PLAN.md §5). Tables come in later migrations.

Revision ID: 0001
Revises:
Create Date: 2026-10-30
"""

from collections.abc import Sequence

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SCHEMAS = ("auth", "cms", "media", "nav", "workflow", "search", "audit")


def upgrade() -> None:
    for schema in SCHEMAS:
        # CREATE SCHEMA must be the only statement in its batch on SQL Server
        op.execute(f"IF SCHEMA_ID('{schema}') IS NULL EXEC('CREATE SCHEMA [{schema}]')")


def downgrade() -> None:
    for schema in reversed(SCHEMAS):
        op.execute(f"IF SCHEMA_ID('{schema}') IS NOT NULL DROP SCHEMA [{schema}]")
