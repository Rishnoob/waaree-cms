"""Alembic environment. Connects with the *migrator* login from .env and sees every module's models."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool

from app.core.config import get_settings
from app.core.db import Base
from app.core.modules import import_all_models

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

import_all_models()
target_metadata = Base.metadata

# Domain schemas (PLAN.md §5). Tables outside these are ignored by autogenerate.
DOMAIN_SCHEMAS = {"auth", "cms", "media", "nav", "workflow", "search", "audit", "site"}


def include_name(name: str | None, type_: str, _parent_names: object) -> bool:
    if type_ == "schema":
        return name in DOMAIN_SCHEMAS
    return True


def run_migrations_offline() -> None:
    context.configure(
        url=get_settings().db_url(migrator=True).render_as_string(hide_password=False),
        target_metadata=target_metadata,
        literal_binds=True,
        include_schemas=True,
        include_name=include_name,
        version_table_schema="dbo",
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(get_settings().db_url(migrator=True), poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_schemas=True,
            include_name=include_name,
            version_table_schema="dbo",
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
