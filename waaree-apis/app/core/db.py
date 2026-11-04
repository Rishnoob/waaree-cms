"""Database engine, sessions and the shared SQLAlchemy Base."""

from collections.abc import Iterator
from datetime import datetime
from functools import lru_cache

from sqlalchemy import BigInteger, Engine, MetaData, create_engine, func, text
from sqlalchemy.dialects.mssql import DATETIME2
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

from app.core.config import get_settings

# Predictable constraint names (PLAN.md §5) so migrations stay readable.
NAMING_CONVENTION = {
    "pk": "pk_%(table_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s",
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class AuditColumns:
    """Standard who/when columns (PLAN.md §5). Times are UTC.

    created_by / updated_by hold auth.users ids without a foreign key, so any table in any
    schema can use them without cross-schema cascade cycles.
    """

    created_at: Mapped[datetime] = mapped_column(DATETIME2, server_default=func.sysutcdatetime())
    created_by: Mapped[int | None] = mapped_column(BigInteger)
    updated_at: Mapped[datetime] = mapped_column(
        DATETIME2, server_default=func.sysutcdatetime(), onupdate=func.sysutcdatetime()
    )
    updated_by: Mapped[int | None] = mapped_column(BigInteger)


@lru_cache
def get_engine() -> Engine:
    return create_engine(get_settings().db_url(), pool_pre_ping=True, pool_recycle=1800)


@lru_cache
def _session_factory() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request, always closed."""
    session = _session_factory()()
    try:
        yield session
    finally:
        session.close()


def is_db_reachable() -> bool:
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
