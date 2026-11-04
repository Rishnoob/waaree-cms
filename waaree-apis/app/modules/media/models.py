"""media schema: the media library (PLAN.md §8). One row per uploaded file."""

from sqlalchemy import BigInteger, Identity, String, Unicode
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import AuditColumns, Base

SCHEMA = "media"


class MediaFile(AuditColumns, Base):
    __tablename__ = "files"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    stored_name: Mapped[str] = mapped_column(String(200), unique=True)  # name in storage (uuid + extension)
    original_name: Mapped[str] = mapped_column(Unicode(255))
    content_type: Mapped[str] = mapped_column(String(100))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    folder: Mapped[str] = mapped_column(Unicode(100), default="general", server_default="general")
    alt_text: Mapped[str | None] = mapped_column(Unicode(300))
