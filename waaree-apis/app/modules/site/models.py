"""site + nav schemas: site-wide settings (key/value) and the website menu.

The menu is a small tree. A link sits either
- inside one of Waaree's built-in navbar sections (`section`, e.g. "Company"), in one of its
  sub-menus (`column`, e.g. "Group Business"),
- under another link (`parent_id`), or
- at the top level of the navbar (neither).
A link either points at a CMS page (`page_id`, shown only while that page is live) or at any URL (`href`).
"""

from sqlalchemy import BigInteger, Boolean, ForeignKey, Identity, Index, Integer, String, Unicode, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import AuditColumns, Base


class Setting(AuditColumns, Base):
    __tablename__ = "settings"
    __table_args__ = {"schema": "site"}

    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[str | None] = mapped_column(Unicode(2000))


class MenuItem(AuditColumns, Base):
    __tablename__ = "menu_items"
    # a page appears in the menu at most once (filtered: many links have no page)
    __table_args__ = (
        Index("uq_menu_items_page_id", "page_id", unique=True, mssql_where=text("page_id IS NOT NULL")),
        {"schema": "nav"},
    )

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    label: Mapped[str] = mapped_column(Unicode(60))
    href: Mapped[str] = mapped_column(Unicode(500))
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    visible: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    section: Mapped[str | None] = mapped_column(String(50))
    column: Mapped[str | None] = mapped_column(Unicode(60))  # sub-menu inside the section
    parent_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("nav.menu_items.id"))
    page_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("cms.pages.id", ondelete="CASCADE"))
