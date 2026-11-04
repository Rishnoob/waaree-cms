"""Audit log (read-only): every recorded step across the CMS, newest first. Today that is the page
workflow (cms.page_events); other modules add their events here as they gain history."""

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.deps import require
from app.modules.pages.models import Page, PageEvent

router = APIRouter(prefix="/audit", tags=["audit"])


class AuditEntry(BaseModel):
    id: int
    at: datetime
    actor_name: str
    action: str
    target_type: str
    target_id: int
    target_title: str
    target_slug: str
    comment: str | None


@router.get("", response_model=list[AuditEntry], dependencies=[Depends(require("audit.view"))])
def list_audit(
    action: str | None = Query(
        default=None, description="created, edited, submitted, approved, rejected, published"
    ),
    q: str | None = Query(default=None, description="Search person, page title or comment"),
    limit: int = Query(default=500, le=5000),
    db: Session = Depends(get_db),
) -> list[AuditEntry]:
    stmt = (
        select(PageEvent, Page)
        .join(Page, Page.id == PageEvent.page_id)
        .order_by(PageEvent.id.desc())
        .limit(limit)
    )
    if action:
        stmt = stmt.where(PageEvent.action == action)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            PageEvent.actor_name.ilike(like) | Page.title.ilike(like) | PageEvent.comment.ilike(like)
        )
    return [
        AuditEntry(
            id=e.id,
            at=e.at,
            actor_name=e.actor_name,
            action=e.action,
            target_type="page",
            target_id=p.id,
            target_title=p.title,
            target_slug=p.slug,
            comment=e.comment,
        )
        for e, p in db.execute(stmt).all()
    ]
