"""menu: a page appears at most once (filtered unique index)

Revision ID: 0007
Revises: 0006
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | Sequence[str] | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "uq_menu_items_page_id",
        "menu_items",
        ["page_id"],
        unique=True,
        schema="nav",
        mssql_where=sa.text("page_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_menu_items_page_id", table_name="menu_items", schema="nav")
