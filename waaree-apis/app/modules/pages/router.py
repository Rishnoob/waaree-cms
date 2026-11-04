from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.deps import CurrentUser, require
from app.modules.pages import service
from app.modules.pages.schemas import PageIn, PageOut, PublicPageOut, PublishIn, ReviewIn

router = APIRouter(prefix="/pages", tags=["pages"])


@router.get("", response_model=list[PageOut], dependencies=[Depends(require("pages.view"))])
def list_pages(db: Session = Depends(get_db)):
    return service.list_pages(db)


class PublicListItem(BaseModel):
    slug: str
    title: str
    published_at: datetime


@router.get(
    "/public", response_model=list[PublicListItem], summary="Public: every live page (for the sitemap)"
)
def public_list(db: Session = Depends(get_db)):
    return [
        PublicListItem(slug=p.slug, title=p.live_title or p.title, published_at=p.published_at)  # type: ignore[arg-type]
        for p in service.live_pages(db)
    ]


@router.get(
    "/public/{slug}", response_model=PublicPageOut, summary="Public: the live version of a published page"
)
def public_page(slug: str, db: Session = Depends(get_db)):
    p = service.public_page(db, slug)
    return PublicPageOut(
        slug=p.slug,
        title=p.live_title or p.title,
        summary=p.live_summary,
        body=p.live_body,
        published_at=p.published_at,
    )  # type: ignore[arg-type]


@router.get("/{page_id}", response_model=PageOut, dependencies=[Depends(require("pages.view"))])
def get_page(page_id: int, db: Session = Depends(get_db)):
    return service.get_page(db, page_id)


@router.post("", response_model=PageOut, status_code=201)
def create_page(
    body: PageIn, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("pages.edit"))
):
    return service.create_page(db, actor, body)


@router.put("/{page_id}", response_model=PageOut)
def update_page(
    page_id: int,
    body: PageIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("pages.edit")),
):
    return service.update_page(db, actor, page_id, body)


@router.post("/{page_id}/withdraw", response_model=PageOut, summary="Take a page back from review to edit")
def withdraw(
    page_id: int, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("pages.edit"))
):
    return service.withdraw(db, actor, page_id)


@router.delete(
    "/{page_id}", status_code=204, summary="Delete a page (a page that was live needs an approver)"
)
def delete_page(
    page_id: int, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("pages.edit"))
):
    service.delete_page(db, actor, page_id)


@router.post("/{page_id}/submit", response_model=PageOut, summary="Maker: send a draft for review")
def submit(page_id: int, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("pages.edit"))):
    return service.submit(db, actor, page_id)


@router.post(
    "/{page_id}/approve", response_model=PageOut, summary="Checker: approve (never your own submission)"
)
def approve(
    page_id: int,
    body: ReviewIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("pages.approve")),
):
    return service.approve(db, actor, page_id, body.comment)


@router.post("/{page_id}/reject", response_model=PageOut, summary="Checker: send back with a comment")
def reject(
    page_id: int,
    body: ReviewIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("pages.approve")),
):
    return service.reject(db, actor, page_id, body.comment)


@router.post(
    "/{page_id}/publish", response_model=PageOut, summary="Publish an approved page now, or schedule it"
)
def publish(
    page_id: int,
    body: PublishIn | None = None,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("pages.approve")),
):
    return service.publish(db, actor, page_id, body.at if body else None)
