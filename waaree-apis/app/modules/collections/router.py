"""Collections API. See models.py for the safety rules (no runtime table changes, nothing hard-deleted).

- Adding (data.edit): create a collection and add fields (additive, so it can never lose data; this
  is how a page's card design creates its data), add and edit rows, send for approval, publish when
  approval is off, Trash and restore, history and restore a version, import many rows (adds only).
- Changing structure (data.structure): rename, the approval switch, archive/restore; a field's
  label/required/choices, reorder, hide/show.
- Approving (data.publish): publish rows sent by others, or send them back with a note.
- Website (public): the published rows of a collection, sorted, searched and paged.
"""

import json
from datetime import datetime
from typing import Any, Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import AppError
from app.modules.auth.deps import CurrentUser, require
from app.modules.collections import service as s
from app.modules.collections.models import Collection, CollectionField, CollectionItem, CollectionItemVersion

router = APIRouter(prefix="/collections", tags=["collections"])

FieldType = Literal["text", "richtext", "number", "date", "boolean", "choice", "image", "file", "link"]


# ── Shapes ───────────────────────────────────────────────────────────────────
class FieldIn(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    type: FieldType
    required: bool = False
    options: dict[str, Any] | None = None


class FieldEdit(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    required: bool = False
    options: dict[str, Any] | None = None
    hidden: bool = False


class FieldOut(BaseModel):
    id: int
    key: str
    label: str
    type: str
    required: bool
    options: dict[str, Any]
    hidden: bool


class CollectionIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=300)
    approval_required: bool = False
    origin: Literal["cms", "import"] = "cms"
    fields: list[FieldIn] = Field(default_factory=list, max_length=60)
    items: list[dict[str, Any]] = Field(default_factory=list, max_length=5000)  # e.g. rows from an Excel


class CollectionEdit(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=300)
    approval_required: bool = False


class CollectionOut(BaseModel):
    id: int
    key: str
    name: str
    description: str | None
    origin: str
    approval_required: bool
    archived: bool
    fields: list[FieldOut]
    counts: dict[str, int]  # published, draft, in_review, trash
    updated_at: datetime


class ItemIn(BaseModel):
    data: dict[str, Any]


class ItemOut(BaseModel):
    id: int
    data: dict[str, Any]
    status: str
    live: bool
    changed: bool  # the working copy differs from what the website shows
    published_at: datetime | None
    updated_at: datetime
    in_trash: bool


class VersionOut(BaseModel):
    id: int
    action: str
    data: dict[str, Any]
    comment: str | None
    actor_name: str
    at: datetime


class ReviewIn(BaseModel):
    comment: str | None = Field(default=None, max_length=1000)


class ImportIn(BaseModel):
    items: list[dict[str, Any]] = Field(max_length=5000)


class PublicOut(BaseModel):
    name: str
    fields: list[FieldOut]
    items: list[dict[str, Any]]
    total: int


# ── Helpers ──────────────────────────────────────────────────────────────────
def _field_out(f: CollectionField) -> FieldOut:
    return FieldOut(
        id=f.id,
        key=f.key,
        label=f.label,
        type=f.type,
        required=f.required,
        options=s.field_options(f),
        hidden=f.hidden,
    )


def _collection_out(db: Session, c: Collection) -> CollectionOut:
    counts = {"published": 0, "draft": 0, "in_review": 0, "trash": 0}
    for status, deleted_at in db.execute(
        select(CollectionItem.status, CollectionItem.deleted_at).where(CollectionItem.collection_id == c.id)
    ):
        k = "trash" if deleted_at else status
        counts[k] = counts.get(k, 0) + 1
    return CollectionOut(
        id=c.id,
        key=c.key,
        name=c.name,
        description=c.description,
        origin=c.origin,
        approval_required=c.approval_required,
        archived=c.archived_at is not None,
        fields=[_field_out(f) for f in c.fields],
        counts=counts,
        updated_at=c.updated_at,
    )


def _item_out(i: CollectionItem) -> ItemOut:
    return ItemOut(
        id=i.id,
        data=json.loads(i.data or "{}"),
        status=i.status,
        live=i.live_data is not None,
        changed=i.live_data is not None and i.live_data != i.data,
        published_at=i.published_at,
        updated_at=i.updated_at,
        in_trash=i.deleted_at is not None,
    )


# ── Website (public) ─────────────────────────────────────────────────────────
@router.get("/public/{key}", response_model=PublicOut, summary="Public: the published rows of a collection")
def public_items(
    key: str,
    db: Session = Depends(get_db),
    sort: str | None = None,
    order: Literal["asc", "desc"] = "desc",
    limit: int = Query(default=12, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(default=None, max_length=100),
):
    c = s.get_collection(db, key, include_archived=False)
    visible = [f for f in c.fields if not f.hidden]
    rows = db.scalars(
        select(CollectionItem).where(
            CollectionItem.collection_id == c.id,
            CollectionItem.live_data.is_not(None),
            CollectionItem.deleted_at.is_(None),
        )
    ).all()
    items = [
        {
            "id": r.id,
            **{k: v for k, v in json.loads(r.live_data or "{}").items() if k in {f.key for f in visible}},
        }
        for r in rows
    ]
    if q:
        needle = q.lower()
        items = [i for i in items if any(needle in str(v).lower() for k, v in i.items() if k != "id")]
    if sort and sort in {f.key for f in visible}:
        filled = sorted(
            (i for i in items if i.get(sort) not in (None, "")),
            key=lambda i: i[sort],
            reverse=order == "desc",
        )
        items = filled + [i for i in items if i.get(sort) in (None, "")]  # empty values last either way
    else:
        pos = {r.id: r.position for r in rows}
        items.sort(key=lambda i: pos[i["id"]], reverse=order == "desc")
    return PublicOut(
        name=c.name,
        fields=[_field_out(f) for f in visible],
        items=items[offset : offset + limit],
        total=len(items),
    )


# ── Collections ──────────────────────────────────────────────────────────────
@router.get("", response_model=list[CollectionOut], dependencies=[Depends(require("data.view"))])
def list_collections(db: Session = Depends(get_db), archived: bool = False):
    q = select(Collection).where(
        Collection.archived_at.is_not(None) if archived else Collection.archived_at.is_(None)
    )
    return [_collection_out(db, c) for c in db.scalars(q.order_by(Collection.name))]


@router.post("", response_model=CollectionOut, status_code=201)
def create_collection(
    body: CollectionIn, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("data.edit"))
):
    c = Collection(
        key=s.unique_key(db, body.name),
        name=body.name,
        description=body.description,
        origin=body.origin,
        approval_required=body.approval_required,
        created_by=actor.id,
        updated_by=actor.id,
    )
    db.add(c)
    for f in body.fields:
        s.add_field(c, actor, f.label, f.type, f.required, f.options)
    db.flush()
    by_label = {f.label: f.key for f in c.fields}  # rows from an Excel/CSV come keyed by column name
    for row in body.items:  # they start as drafts
        s.create_item(db, c, actor, {by_label.get(k, k): v for k, v in row.items()}, action="imported")
    db.commit()
    return _collection_out(db, c)


@router.get("/{key}", response_model=CollectionOut, dependencies=[Depends(require("data.view"))])
def get_collection(key: str, db: Session = Depends(get_db)):
    return _collection_out(db, s.get_collection(db, key))


@router.get(
    "/{key}/usage", dependencies=[Depends(require("data.view"))], summary="Pages that show this collection"
)
def usage(key: str, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    return s.pages_using(db, key)


@router.put("/{key}", response_model=CollectionOut)
def edit_collection(
    key: str,
    body: CollectionEdit,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("data.structure")),
):
    c = s.get_collection(db, key)
    c.name, c.description, c.approval_required, c.updated_by = (
        body.name,
        body.description,
        body.approval_required,
        actor.id,
    )
    db.commit()
    return _collection_out(db, c)


@router.post("/{key}/archive", response_model=CollectionOut, summary="Archive (never deletes data)")
def archive(key: str, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("data.structure"))):
    c = s.get_collection(db, key)
    used = s.pages_using(db, key)
    if used:
        raise AppError(
            409, "in_use", f"Used on {', '.join(p['title'] for p in used)}. Remove it from those pages first."
        )
    c.archived_at, c.updated_by = s.now(db), actor.id
    db.commit()
    return _collection_out(db, c)


@router.post("/{key}/unarchive", response_model=CollectionOut)
def unarchive(
    key: str, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("data.structure"))
):
    c = s.get_collection(db, key)
    c.archived_at, c.updated_by = None, actor.id
    db.commit()
    return _collection_out(db, c)


# ── Fields (never dropped) ───────────────────────────────────────────────────
@router.post("/{key}/fields", response_model=CollectionOut, status_code=201)
def add_field(
    key: str,
    body: FieldIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("data.edit")),
):
    c = s.get_collection(db, key)
    s.add_field(c, actor, body.label, body.type, body.required, body.options)
    db.commit()
    return _collection_out(db, c)


@router.put(
    "/{key}/fields/{field_id}", response_model=CollectionOut, summary="Rename, required, choices, hide/show"
)
def edit_field(
    key: str,
    field_id: int,
    body: FieldEdit,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("data.structure")),
):
    c = s.get_collection(db, key)
    f = next((x for x in c.fields if x.id == field_id), None)
    if f is None:
        raise AppError(404, "not_found", "Field not found")
    if f.type == "choice" and not (body.options or {}).get("choices"):
        raise AppError(422, "choices_required", "A choice field needs at least one choice")
    # existing choices may be added to but not removed, so stored values stay valid
    if f.type == "choice":
        kept = [
            x
            for x in s.field_options(f).get("choices", [])
            if x not in (body.options or {}).get("choices", [])
        ]
        if kept:
            raise AppError(
                422,
                "choice_in_use",
                f"Choices can be added, not removed: {', '.join(kept)}. Hide the field instead.",
            )
    f.label, f.required, f.hidden, f.updated_by = body.label, body.required, body.hidden, actor.id
    f.options = json.dumps(body.options) if body.options else f.options
    db.commit()
    return _collection_out(db, c)


@router.put("/{key}/fields-order", response_model=CollectionOut)
def order_fields(
    key: str,
    ids: list[int],
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("data.structure")),
):
    c = s.get_collection(db, key)
    rank = {fid: i for i, fid in enumerate(ids)}
    for f in c.fields:
        f.position = rank.get(f.id, len(ids) + f.position)
    db.commit()
    db.refresh(c)
    return _collection_out(db, c)


# ── Rows ─────────────────────────────────────────────────────────────────────
@router.get("/{key}/items", response_model=list[ItemOut], dependencies=[Depends(require("data.view"))])
def list_items(key: str, db: Session = Depends(get_db), trash: bool = False):
    c = s.get_collection(db, key)
    q = select(CollectionItem).where(
        CollectionItem.collection_id == c.id,
        CollectionItem.deleted_at.is_not(None) if trash else CollectionItem.deleted_at.is_(None),
    )
    return [_item_out(i) for i in db.scalars(q.order_by(CollectionItem.position.desc()))]


@router.post("/{key}/items", response_model=ItemOut, status_code=201)
def add_item(
    key: str, body: ItemIn, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("data.edit"))
):
    c = s.get_collection(db, key, include_archived=False)
    item = s.create_item(db, c, actor, body.data)
    db.commit()
    db.refresh(item)
    return _item_out(item)


@router.post("/{key}/import", response_model=CollectionOut, summary="Add many rows at once (never replaces)")
def import_items(
    key: str,
    body: ImportIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("data.edit")),
):
    c = s.get_collection(db, key, include_archived=False)
    by_label = {f.label: f.key for f in c.fields}  # rows may be keyed by field key or by label
    for row in body.items:
        s.create_item(db, c, actor, {by_label.get(k, k): v for k, v in row.items()}, action="imported")
    db.commit()
    return _collection_out(db, c)


@router.put("/items/{item_id}", response_model=ItemOut)
def edit_item(
    item_id: int,
    body: ItemIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("data.edit")),
):
    item, c = s.get_item(db, item_id)
    s.update_item(db, item, c, actor, body.data)
    db.commit()
    db.refresh(item)
    return _item_out(item)


def _step(item_id: int, db: Session, actor: CurrentUser, fn) -> ItemOut:
    item, c = s.get_item(db, item_id)
    fn(item, c)
    db.commit()
    db.refresh(item)
    return _item_out(item)


@router.post("/items/{item_id}/publish", response_model=ItemOut, summary="Publish (or approve and publish)")
def publish(
    item_id: int,
    body: ReviewIn | None = None,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("data.view")),
):
    # editors publish where approval is off; approvers publish what was sent to them (service checks which)
    if not (actor.can("data.edit") or actor.can("data.publish")):
        raise AppError(403, "forbidden", "You can't publish rows")
    return _step(item_id, db, actor, lambda i, c: s.publish(db, i, c, actor, body.comment if body else None))


@router.post("/items/{item_id}/submit", response_model=ItemOut, summary="Send for approval")
def submit(item_id: int, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("data.edit"))):
    return _step(item_id, db, actor, lambda i, c: s.submit(db, i, c, actor))


@router.post("/items/{item_id}/reject", response_model=ItemOut, summary="Send back with a note")
def reject(
    item_id: int,
    body: ReviewIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("data.publish")),
):
    return _step(item_id, db, actor, lambda i, c: s.reject(db, i, actor, body.comment or ""))


@router.post(
    "/items/{item_id}/unpublish", response_model=ItemOut, summary="Take off the website (kept as a draft)"
)
def unpublish(
    item_id: int, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("data.edit"))
):
    return _step(item_id, db, actor, lambda i, c: s.unpublish(db, i, actor))


@router.post("/items/{item_id}/trash", response_model=ItemOut, summary="Move to Trash (restorable)")
def trash(item_id: int, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("data.edit"))):
    return _step(item_id, db, actor, lambda i, c: s.trash(db, i, actor))


@router.post("/items/{item_id}/restore", response_model=ItemOut, summary="Bring back from Trash")
def restore(item_id: int, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("data.edit"))):
    return _step(item_id, db, actor, lambda i, c: s.restore(db, i, actor))


@router.get(
    "/items/{item_id}/versions", response_model=list[VersionOut], dependencies=[Depends(require("data.view"))]
)
def versions(item_id: int, db: Session = Depends(get_db)):
    rows = db.scalars(
        select(CollectionItemVersion)
        .where(CollectionItemVersion.item_id == item_id)
        .order_by(CollectionItemVersion.id.desc())
    )
    return [
        VersionOut(
            id=v.id,
            action=v.action,
            data=json.loads(v.data or "{}"),
            comment=v.comment,
            actor_name=v.actor_name,
            at=v.at,
        )
        for v in rows
    ]


@router.post(
    "/items/{item_id}/versions/{version_id}/restore",
    response_model=ItemOut,
    summary="Restore an earlier version (as a draft)",
)
def restore_version(
    item_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("data.edit")),
):
    v = db.get(CollectionItemVersion, version_id)
    if v is None or v.item_id != item_id:
        raise AppError(404, "not_found", "Version not found")
    return _step(item_id, db, actor, lambda i, c: s.restore_version(db, i, v, actor))
