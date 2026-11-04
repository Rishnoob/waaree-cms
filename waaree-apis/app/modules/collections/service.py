"""Collections: rules for structure, rows, publishing and safety (see models.py)."""

import json
import re
from datetime import date
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.modules.auth.deps import CurrentUser
from app.modules.collections.models import (
    FIELD_TYPES,
    Collection,
    CollectionField,
    CollectionItem,
    CollectionItemVersion,
)
from app.modules.pages.models import Page

MAX_TEXT = 500
MAX_RICH = 20000
MAX_URL = 1000


def slug(text: str, fallback: str = "field") -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:50]
    return s or fallback


def now(db: Session):
    return db.scalar(select(func.sysutcdatetime()))


# ── Collections ─────────────────────────────────────────────────────────────
def get_collection(db: Session, key: str, *, include_archived: bool = True) -> Collection:
    c = db.scalar(select(Collection).where(Collection.key == key))
    if c is None or (c.archived_at and not include_archived):
        raise AppError(404, "not_found", "Collection not found")
    return c


def unique_key(db: Session, name: str) -> str:
    base = slug(name, "collection")
    key, n = base, 2
    while db.scalar(select(Collection.id).where(Collection.key == key)):
        key, n = f"{base}-{n}", n + 1
    return key


def field_options(f: CollectionField) -> dict[str, Any]:
    try:
        return json.loads(f.options) if f.options else {}
    except ValueError:
        return {}


def add_field(
    c: Collection, actor: CurrentUser, label: str, type_: str, required: bool, options: dict | None
) -> CollectionField:
    if type_ not in FIELD_TYPES:
        raise AppError(422, "bad_type", f"Unknown field type: {type_}")
    if type_ == "choice" and not (options or {}).get("choices"):
        raise AppError(422, "choices_required", f"'{label}' needs at least one choice")
    taken = {f.key for f in c.fields}
    base = slug(label)
    key, n = base, 2
    while key in taken:
        key, n = f"{base}-{n}", n + 1
    f = CollectionField(
        key=key,
        label=label,
        type=type_,
        required=required,
        options=json.dumps(options) if options else None,
        position=len(c.fields),
        created_by=actor.id,
        updated_by=actor.id,
    )
    c.fields.append(f)
    return f


def pages_using(db: Session, key: str) -> list[dict[str, Any]]:
    """Pages whose sections show this collection (so it isn't archived from under them)."""
    needle = f'"collection":"{key}"'
    rows = db.scalars(select(Page).where(Page.body.contains(needle) | Page.live_body.contains(needle)))
    return [{"id": p.id, "title": p.title} for p in rows]


# ── Values ──────────────────────────────────────────────────────────────────
def clean_value(f: CollectionField, v: Any) -> Any:
    """Check one value against its field type. Empty is allowed here; `required` is checked on publish."""
    if v is None or v == "":
        return None
    t = f.type
    try:
        if t == "text":
            return str(v)[:MAX_TEXT]
        if t == "richtext":
            return str(v)[:MAX_RICH]
        if t == "number":
            n = float(str(v).replace(",", "").strip())
            return int(n) if n.is_integer() else n
        if t == "date":
            return date.fromisoformat(str(v)[:10]).isoformat()
        if t == "boolean":
            return v if isinstance(v, bool) else str(v).strip().lower() in ("true", "yes", "1", "y")
        if t == "choice":
            s = str(v)
            if s not in field_options(f).get("choices", []):
                raise ValueError
            return s
        if t in ("image", "file", "link"):
            s = str(v).strip()[:MAX_URL]
            if not re.match(r"^(https?://|/|#|mailto:|tel:)", s):
                raise ValueError
            return s
    except ValueError, TypeError:
        raise AppError(422, "bad_value", f"'{f.label}': {v!r} isn't a valid {t}") from None
    return None


def clean_data(c: Collection, data: dict[str, Any]) -> dict[str, Any]:
    by_key = {f.key: f for f in c.fields}
    out: dict[str, Any] = {}
    for k, v in data.items():
        f = by_key.get(k)
        if f is None:
            continue  # unknown keys are ignored, never stored
        val = clean_value(f, v)
        if val is not None:
            out[k] = val
    return out


def check_required(c: Collection, data: dict[str, Any]) -> None:
    missing = [f.label for f in c.fields if f.required and not f.hidden and data.get(f.key) in (None, "")]
    if missing:
        raise AppError(422, "required", f"Fill in {', '.join(missing)} first")


# ── Items ───────────────────────────────────────────────────────────────────
def log(
    db: Session, item: CollectionItem, actor: CurrentUser, action: str, comment: str | None = None
) -> None:
    db.add(
        CollectionItemVersion(
            item_id=item.id,
            action=action,
            data=item.data,
            comment=comment,
            actor_id=actor.id,
            actor_name=actor.full_name,
        )
    )


def get_item(db: Session, item_id: int) -> tuple[CollectionItem, Collection]:
    item = db.get(CollectionItem, item_id)
    if item is None:
        raise AppError(404, "not_found", "Row not found")
    c = db.get(Collection, item.collection_id)
    if c is None:
        raise AppError(404, "not_found", "Collection not found")
    return item, c


def create_item(
    db: Session, c: Collection, actor: CurrentUser, data: dict[str, Any], action: str = "created"
) -> CollectionItem:
    pos = (
        db.scalar(select(func.max(CollectionItem.position)).where(CollectionItem.collection_id == c.id)) or 0
    ) + 1
    item = CollectionItem(
        collection_id=c.id,
        data=json.dumps(clean_data(c, data)),
        position=pos,
        created_by=actor.id,
        updated_by=actor.id,
    )
    db.add(item)
    db.flush()
    log(db, item, actor, action)
    return item


def update_item(
    db: Session, item: CollectionItem, c: Collection, actor: CurrentUser, data: dict[str, Any]
) -> None:
    if item.deleted_at:
        raise AppError(409, "in_trash", "Restore this row from Trash first")
    if item.status == "in_review":
        raise AppError(409, "locked", "This row is waiting for approval and can't be edited right now")
    item.data = json.dumps(clean_data(c, data))
    item.status = "draft"  # the live version (if any) stays on the website until published again
    item.updated_by = actor.id
    log(db, item, actor, "edited")


def publish(
    db: Session, item: CollectionItem, c: Collection, actor: CurrentUser, comment: str | None = None
) -> None:
    """Approval off: anyone who can edit publishes. Approval on: an approver (not the sender) publishes."""
    if item.deleted_at:
        raise AppError(409, "in_trash", "Restore this row from Trash first")
    check_required(c, json.loads(item.data))
    if c.approval_required:
        if not actor.can("data.publish"):
            raise AppError(
                403, "forbidden", "This collection needs approval. Send the row for approval instead."
            )
        if item.status != "in_review":
            raise AppError(409, "bad_state", "Send the row for approval first")
        if item.submitted_by == actor.id and not actor.is_super_admin:
            raise AppError(403, "self_approval", "Someone else has to approve a row you sent")
    item.live_data = item.data
    item.status = "published"
    item.published_at = now(db)
    item.updated_by = actor.id
    log(db, item, actor, "published", comment)


def submit(db: Session, item: CollectionItem, c: Collection, actor: CurrentUser) -> None:
    if not c.approval_required:
        raise AppError(409, "no_approval", "This collection doesn't need approval; publish the row directly")
    if item.status != "draft" or item.deleted_at:
        raise AppError(409, "bad_state", "Only drafts can be sent for approval")
    check_required(c, json.loads(item.data))
    item.status, item.submitted_by = "in_review", actor.id
    log(db, item, actor, "submitted")


def reject(db: Session, item: CollectionItem, actor: CurrentUser, comment: str) -> None:
    if item.status != "in_review":
        raise AppError(409, "bad_state", "This row isn't waiting for approval")
    if not comment.strip():
        raise AppError(422, "comment_required", "Say what needs to change")
    item.status = "draft"
    log(db, item, actor, "rejected", comment)


def unpublish(db: Session, item: CollectionItem, actor: CurrentUser) -> None:
    """Take a row off the website (it stays in the CMS as a draft)."""
    item.live_data = None
    item.published_at = None
    item.status = "draft"
    log(db, item, actor, "unpublished")


def trash(db: Session, item: CollectionItem, actor: CurrentUser) -> None:
    item.deleted_at = now(db)
    log(db, item, actor, "deleted")


def restore(db: Session, item: CollectionItem, actor: CurrentUser) -> None:
    item.deleted_at = None
    log(db, item, actor, "restored")


def restore_version(db: Session, item: CollectionItem, c: CollectionItemVersion, actor: CurrentUser) -> None:
    """Bring back an earlier version as the working copy (a draft; publishing it is a separate step)."""
    if item.status == "in_review":
        raise AppError(409, "locked", "This row is waiting for approval")
    item.data = c.data
    item.status = "draft"
    log(db, item, actor, "restored", f"Restored the version from {c.at:%d %b %Y, %H:%M} UTC")
