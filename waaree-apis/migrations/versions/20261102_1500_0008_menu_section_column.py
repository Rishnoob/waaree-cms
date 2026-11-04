"""menu: which sub-menu (column) of a built-in section a link sits in, e.g. Company → Group Business

Revision ID: 0008
Revises: 0007
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: str | Sequence[str] | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("menu_items", sa.Column("column", sa.Unicode(60), nullable=True), schema="nav")


def downgrade() -> None:
    op.drop_column("menu_items", "column", schema="nav")
