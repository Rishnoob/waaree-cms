"""auth schema: users, roles, permissions and login sessions (PLAN.md §5, §7)."""

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    ForeignKey,
    Identity,
    Integer,
    String,
    Table,
    Unicode,
    false,
)
from sqlalchemy.dialects.mssql import DATETIME2
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import AuditColumns, Base

SCHEMA = "auth"

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", BigInteger, ForeignKey(f"{SCHEMA}.roles.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "permission_id",
        BigInteger,
        ForeignKey(f"{SCHEMA}.permissions.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    schema=SCHEMA,
)

user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", BigInteger, ForeignKey(f"{SCHEMA}.users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", BigInteger, ForeignKey(f"{SCHEMA}.roles.id", ondelete="CASCADE"), primary_key=True),
    schema=SCHEMA,
)


class Permission(Base):
    """One action a role can be allowed to do, e.g. 'pages.edit'. Rows are synced from code on startup."""

    __tablename__ = "permissions"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    key: Mapped[str] = mapped_column(String(100), unique=True)
    module: Mapped[str] = mapped_column(String(50))
    description: Mapped[str] = mapped_column(Unicode(300))


class Role(AuditColumns, Base):
    """A named set of permissions. The one system role (Super Admin) always has every permission."""

    __tablename__ = "roles"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    name: Mapped[str] = mapped_column(Unicode(100), unique=True)
    description: Mapped[str | None] = mapped_column(Unicode(500))
    is_system: Mapped[bool] = mapped_column(Boolean, server_default=false())

    permissions: Mapped[list[Permission]] = relationship(secondary=role_permissions, lazy="selectin")


class User(AuditColumns, Base):
    __tablename__ = "users"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    email: Mapped[str] = mapped_column(Unicode(320), unique=True)  # stored lower-case
    full_name: Mapped[str] = mapped_column(Unicode(200))
    password_hash: Mapped[str | None] = mapped_column(String(255))  # null for external-login users
    external_id: Mapped[str | None] = mapped_column(Unicode(255))  # id in Waaree's login system, later
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="1")
    failed_login_count: Mapped[int] = mapped_column(Integer, server_default="0")
    locked_until: Mapped[datetime | None] = mapped_column(DATETIME2)
    last_login_at: Mapped[datetime | None] = mapped_column(DATETIME2)

    roles: Mapped[list[Role]] = relationship(secondary=user_roles, lazy="selectin")


class UserSession(Base):
    """One logged-in device. Holds only a hash of the refresh token; rotated on every refresh."""

    __tablename__ = "user_sessions"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey(f"{SCHEMA}.users.id", ondelete="CASCADE"), index=True
    )
    refresh_token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    ip: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(Unicode(400))
    created_at: Mapped[datetime] = mapped_column(DATETIME2)
    expires_at: Mapped[datetime] = mapped_column(DATETIME2)
    revoked_at: Mapped[datetime | None] = mapped_column(DATETIME2)
