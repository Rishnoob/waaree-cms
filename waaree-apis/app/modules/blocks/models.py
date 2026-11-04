"""cms schema: custom blocks, your own reusable sections built from the standard ones.

Inserting a custom block copies its sections into the page, so every page change still goes
through approval; editing a custom block never changes live pages behind anyone's back.
"""

from sqlalchemy import BigInteger, Identity, Unicode, UnicodeText
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import AuditColumns, Base


class CustomBlock(AuditColumns, Base):
    __tablename__ = "custom_blocks"
    __table_args__ = {"schema": "cms"}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    name: Mapped[str] = mapped_column(Unicode(80))
    description: Mapped[str | None] = mapped_column(Unicode(300))
    body: Mapped[str | None] = mapped_column(UnicodeText)  # {"blocks": [...]}, same shape as a page body
