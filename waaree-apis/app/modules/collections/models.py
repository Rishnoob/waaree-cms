"""cms schema: collections, i.e. structured, changing data for the website (quarterly results, blog
posts, job openings…), managed in the CMS and shown on pages by the "Data view" block.

Safe by design (the way Wix, Webflow and Contentful store content):
- The database structure never changes at runtime. A collection is a row in the catalogue
  (`collections` + `collection_fields`); its rows live in the one shared `collection_items` table
  as JSON keyed by field. So nothing a user does can create, alter or drop a database table.
- Nothing is permanently deleted from the CMS: items go to Trash (`deleted_at`), collections are
  archived (`archived_at`), and a removed field is only hidden (`hidden`), its data kept.
- Every change to an item is kept in `collection_item_versions`, and any version can be restored.
"""

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, ForeignKey, Identity, Integer, String, Unicode, UnicodeText
from sqlalchemy.dialects.mssql import DATETIME2
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.db import AuditColumns, Base

SCHEMA = "cms"

# Where a collection came from (kept in the catalogue, shown in the CMS)
ORIGINS = ("cms", "import", "code")  # built in the CMS · made from an Excel/CSV · defined by developers
FIELD_TYPES = ("text", "richtext", "number", "date", "boolean", "choice", "image", "file", "link")
ITEM_STATUSES = ("draft", "in_review", "published")


class Collection(AuditColumns, Base):
    """The catalogue: one row per collection."""

    __tablename__ = "collections"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    key: Mapped[str] = mapped_column(
        String(60), unique=True
    )  # stable id used by pages, e.g. "quarterly-results"
    name: Mapped[str] = mapped_column(Unicode(100))
    description: Mapped[str | None] = mapped_column(Unicode(300))
    origin: Mapped[str] = mapped_column(String(10), default="cms", server_default="cms")
    approval_required: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    archived_at: Mapped[datetime | None] = mapped_column(DATETIME2)

    fields: Mapped[list[CollectionField]] = relationship(
        back_populates="collection", order_by="CollectionField.position", cascade="all, delete-orphan"
    )


class CollectionField(AuditColumns, Base):
    """One field (column) of a collection. Never dropped: removing it hides it and keeps the data."""

    __tablename__ = "collection_fields"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    collection_id: Mapped[int] = mapped_column(BigInteger, ForeignKey(f"{SCHEMA}.collections.id"), index=True)
    key: Mapped[str] = mapped_column(String(60))  # stable key in item data; the label can change freely
    label: Mapped[str] = mapped_column(Unicode(100))
    type: Mapped[str] = mapped_column(String(20))
    required: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")
    options: Mapped[str | None] = mapped_column(UnicodeText)  # JSON, e.g. {"choices": ["Q1", "Q2"]}
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    hidden: Mapped[bool] = mapped_column(Boolean, default=False, server_default="0")

    collection: Mapped[Collection] = relationship(back_populates="fields")


class CollectionItem(AuditColumns, Base):
    """One row of a collection. `data` is the working copy; `live_data` is what the website shows."""

    __tablename__ = "collection_items"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    collection_id: Mapped[int] = mapped_column(BigInteger, ForeignKey(f"{SCHEMA}.collections.id"), index=True)
    data: Mapped[str] = mapped_column(UnicodeText, default="{}")
    live_data: Mapped[str | None] = mapped_column(UnicodeText)
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft")
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    submitted_by: Mapped[int | None] = mapped_column(BigInteger)
    published_at: Mapped[datetime | None] = mapped_column(DATETIME2)
    deleted_at: Mapped[datetime | None] = mapped_column(DATETIME2)  # in Trash; restorable


class CollectionItemVersion(Base):
    """Every saved state of an item, with who and why. Append-only."""

    __tablename__ = "collection_item_versions"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    item_id: Mapped[int] = mapped_column(BigInteger, ForeignKey(f"{SCHEMA}.collection_items.id"), index=True)
    action: Mapped[str] = mapped_column(
        String(20)
    )  # created, edited, submitted, published, rejected, deleted, restored…
    data: Mapped[str] = mapped_column(UnicodeText)
    comment: Mapped[str | None] = mapped_column(Unicode(1000))
    actor_id: Mapped[int] = mapped_column(BigInteger)
    actor_name: Mapped[str] = mapped_column(Unicode(200))
    at: Mapped[datetime] = mapped_column(DATETIME2, server_default=func.sysutcdatetime())
