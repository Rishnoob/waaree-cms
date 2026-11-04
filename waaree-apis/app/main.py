"""App entry point. Run: uv run uvicorn app.main:app --reload"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.routing import APIRoute
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.core.http import register_http
from app.core.modules import include_module_routers, run_startup_hooks

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


def _operation_id(route: APIRoute) -> str:
    # Readable OpenAPI ids for the generated frontend types, e.g. "health-get_health"
    return f"{route.tags[0]}-{route.name}" if route.tags else route.name


@asynccontextmanager
async def _lifespan(_: FastAPI) -> AsyncIterator[None]:
    await run_in_threadpool(run_startup_hooks)  # e.g. sync permissions to the DB
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        # Interactive docs only outside production
        docs_url="/docs" if settings.environment != "production" else None,
        redoc_url=None,
        generate_unique_id_function=_operation_id,
        lifespan=_lifespan,
    )
    register_http(app, settings)
    register_error_handlers(app)
    app.state.modules = include_module_routers(app)
    return app


app = create_app()
