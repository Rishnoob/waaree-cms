from typing import Literal

from fastapi import APIRouter, Response
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool

from app.core.config import get_settings
from app.core.db import is_db_reachable

router = APIRouter(prefix="/health", tags=["health"])


class HealthOut(BaseModel):
    status: Literal["ok", "degraded"]
    api: Literal["ok"]
    database: Literal["ok", "down"]
    version: str


@router.get("", response_model=HealthOut, summary="Is the API and database up?")
async def get_health(response: Response) -> HealthOut:
    db_ok = await run_in_threadpool(is_db_reachable)
    if not db_ok:
        response.status_code = 503
    return HealthOut(
        status="ok" if db_ok else "degraded",
        api="ok",
        database="ok" if db_ok else "down",
        version=get_settings().app_version,
    )
