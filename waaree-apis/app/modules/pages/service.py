"""Pages with maker-checker: the maker drafts and submits; a different person approves or rejects
(with a comment); approved pages are published. Every step is recorded in page_events."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.errors import AppError
from app.modules.auth.deps import CurrentUser
from app.modules.pages.models import Page, PageEvent
from app.modules.pages.schemas import PageIn


def _log(page: Page, actor: CurrentUser, action: str, comment: str | None = None) -> None:
    page.events.append(
        PageEvent(action=action, actor_id=actor.id, actor_name=actor.full_name, comment=comment)
    )


def _get(db: Session, page_id: int) -> Page:
    page = db.scalar(select(Page).options(selectinload(Page.events)).where(Page.id == page_id))
    if page is None:
        raise AppError(404, "not_found", "Page not found")
    return page


def list_pages(db: Session) -> list[Page]:
    return list(db.scalars(select(Page).options(selectinload(Page.events)).order_by(Page.updated_at.desc())))


def get_page(db: Session, page_id: int) -> Page:
    return _get(db, page_id)


def create_page(db: Session, actor: CurrentUser, body: PageIn) -> Page:
    if db.scalar(select(Page.id).where(Page.slug == body.slug)):
        raise AppError(409, "slug_taken", "Another page already uses this URL")
    page = Page(**body.model_dump(), status="draft", created_by=actor.id, updated_by=actor.id)
    db.add(page)
    _log(page, actor, "created")
    db.commit()
    return _get(db, page.id)


def update_page(db: Session, actor: CurrentUser, page_id: int, body: PageIn) -> Page:
    page = _get(db, page_id)
    if page.status not in ("draft", "rejected", "published"):
        raise AppError(409, "locked", "This page is in review and can't be edited right now")
    if body.slug != page.slug and db.scalar(select(Page.id).where(Page.slug == body.slug)):
        raise AppError(409, "slug_taken", "Another page already uses this URL")
    for k, v in body.model_dump().items():
        setattr(page, k, v)
    page.status = "draft"  # editing a published page starts a new draft that needs review
    page.updated_by = actor.id
    # The editor autosaves, so a burst of saves by one person is one "edited" step in the history.
    last = page.events[-1] if page.events else None
    now: datetime = db.scalar(select(func.sysutcdatetime())) or datetime.now(UTC).replace(tzinfo=None)
    if (
        last
        and last.action == "edited"
        and last.actor_id == actor.id
        and now - last.at < timedelta(minutes=30)
    ):
        last.at = now
    else:
        _log(page, actor, "edited")
    db.commit()
    return _get(db, page.id)


def withdraw(db: Session, actor: CurrentUser, page_id: int) -> Page:
    """Take a page back from review to keep editing it."""
    page = _get(db, page_id)
    if page.status not in ("in_review", "approved"):
        raise AppError(409, "bad_state", "This page isn't waiting for review")
    page.status = "draft"
    _log(page, actor, "withdrawn")
    db.commit()
    return _get(db, page.id)


def delete_page(db: Session, actor: CurrentUser, page_id: int) -> None:
    """Delete a page and its menu links. Removing a page that has been live takes an approver."""
    page = _get(db, page_id)
    if page.has_live and not actor.can("pages.approve"):
        raise AppError(403, "forbidden", "This page has been live. Ask an approver to delete it.")
    db.delete(page)
    db.commit()


def submit(db: Session, actor: CurrentUser, page_id: int) -> Page:
    page = _get(db, page_id)
    if page.status not in ("draft", "rejected"):
        raise AppError(409, "bad_state", "Only drafts can be submitted for review")
    page.status, page.submitted_by = "in_review", actor.id
    _log(page, actor, "submitted")
    db.commit()
    return _get(db, page.id)


def _checker(page: Page, actor: CurrentUser) -> None:
    if page.status != "in_review":
        raise AppError(409, "bad_state", "This page isn't waiting for review")
    if page.submitted_by == actor.id and not actor.is_super_admin:
        raise AppError(403, "self_approval", "You can't review a page you submitted. Ask another reviewer.")


def approve(db: Session, actor: CurrentUser, page_id: int, comment: str | None) -> Page:
    page = _get(db, page_id)
    _checker(page, actor)
    page.status, page.reviewed_by = "approved", actor.id
    _log(page, actor, "approved", comment)
    db.commit()
    return _get(db, page.id)


def reject(db: Session, actor: CurrentUser, page_id: int, comment: str | None) -> Page:
    if not comment or not comment.strip():
        raise AppError(422, "comment_required", "Please say what needs to change")
    page = _get(db, page_id)
    _checker(page, actor)
    page.status, page.reviewed_by = "rejected", actor.id
    _log(page, actor, "rejected", comment.strip())
    db.commit()
    return _get(db, page.id)


def publish(db: Session, actor: CurrentUser, page_id: int, at: datetime | None = None) -> Page:
    """Publish now, or schedule: with a future `at` (UTC) the page goes live at that time."""
    page = _get(db, page_id)
    if page.status != "approved":
        raise AppError(409, "bad_state", "Only approved pages can be published")
    page.status = "published"
    page.live_title, page.live_summary, page.live_body = page.title, page.summary, page.body
    now = db.scalar(select(func.sysutcdatetime()))
    when = at.replace(tzinfo=None) if at else now
    scheduled = when > now
    page.published_at = when if scheduled else now
    _log(
        page,
        actor,
        "scheduled" if scheduled else "published",
        f"Goes live {when:%d %b %Y, %H:%M} UTC" if scheduled else None,
    )
    db.commit()
    return _get(db, page.id)


def public_page(db: Session, slug: str) -> Page:
    """The live version of a page, for the public website. Never shows unapproved drafts."""
    page = db.scalar(
        select(Page).where(
            Page.slug == slug, Page.published_at.is_not(None), Page.published_at <= func.sysutcdatetime()
        )
    )
    if page is None or page.live_title is None:
        raise AppError(404, "not_found", "Page not found")
    return page


def live_pages(db: Session) -> list[Page]:
    """Every page that is live right now (published, and its time has come)."""
    return list(
        db.scalars(
            select(Page)
            .where(
                Page.published_at.is_not(None),
                Page.published_at <= func.sysutcdatetime(),
                Page.live_title.is_not(None),
            )
            .order_by(Page.published_at.desc())
        )
    )
