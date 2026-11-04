"""cms schema: pages and their workflow history (PLAN.md §5, §9 maker-checker)."""

from datetime import datetime

from sqlalchemy import BigInteger, ForeignKey, Identity, String, Unicode, UnicodeText
from sqlalchemy.dialects.mssql import DATETIME2
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.db import AuditColumns, Base

SCHEMA = "cms"

# draft -> in_review -> approved -> published; in_review -> rejected -> (edit) -> draft
STATUSES = ("draft", "in_review", "approved", "rejected", "published")


class Page(AuditColumns, Base):
    __tablename__ = "pages"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    title: Mapped[str] = mapped_column(Unicode(200))
    slug: Mapped[str] = mapped_column(String(200), unique=True)
    summary: Mapped[str | None] = mapped_column(Unicode(500))
    body: Mapped[str | None] = mapped_column(UnicodeText)
    status: Mapped[str] = mapped_column(String(20), default="draft", server_default="draft")
    submitted_by: Mapped[int | None] = mapped_column(BigInteger)
    reviewed_by: Mapped[int | None] = mapped_column(BigInteger)
    published_at: Mapped[datetime | None] = mapped_column(DATETIME2)
    # The live version: a snapshot taken at publish, so edits (new drafts) never change the live page
    # until they are approved and published again.
    live_title: Mapped[str | None] = mapped_column(Unicode(200))
    live_summary: Mapped[str | None] = mapped_column(Unicode(500))
    live_body: Mapped[str | None] = mapped_column(UnicodeText)

    events: Mapped[list[PageEvent]] = relationship(
        back_populates="page", order_by="PageEvent.id", cascade="all, delete-orphan"
    )

    @property
    def has_live(self) -> bool:
        """True once a version has been published (it may be scheduled for later)."""
        return self.live_title is not None


class PageEvent(Base):
    """One step in a page's life (created, edited, submitted, approved, rejected, published). Append-only."""

    __tablename__ = "page_events"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    page_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey(f"{SCHEMA}.pages.id", ondelete="CASCADE"), index=True
    )
    action: Mapped[str] = mapped_column(String(20))
    actor_id: Mapped[int] = mapped_column(BigInteger)
    actor_name: Mapped[str] = mapped_column(Unicode(200))
    comment: Mapped[str | None] = mapped_column(Unicode(1000))
    at: Mapped[datetime] = mapped_column(DATETIME2, server_default=func.sysutcdatetime())

    page: Mapped[Page] = relationship(back_populates="events")
