"""Custom blocks for the UI Kit: list and read (anyone who can see pages), create/edit/delete
(blocks.manage). See models.py for why inserting one copies it."""

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import AppError
from app.modules.auth.deps import CurrentUser, require
from app.modules.blocks.models import CustomBlock

router = APIRouter(prefix="/blocks", tags=["blocks"])


class BlockIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=300)
    body: str | None = None


class BlockOut(BaseModel):
    id: int
    name: str
    description: str | None
    body: str | None
    updated_at: datetime

    model_config = {"from_attributes": True}


def _get(db: Session, block_id: int) -> CustomBlock:
    b = db.get(CustomBlock, block_id)
    if b is None:
        raise AppError(404, "not_found", "Custom block not found")
    return b


@router.get("", response_model=list[BlockOut], dependencies=[Depends(require("pages.view"))])
def list_blocks(db: Session = Depends(get_db)):
    return list(db.scalars(select(CustomBlock).order_by(CustomBlock.name)))


@router.get("/{block_id}", response_model=BlockOut, dependencies=[Depends(require("pages.view"))])
def get_block(block_id: int, db: Session = Depends(get_db)):
    return _get(db, block_id)


@router.post("", response_model=BlockOut, status_code=201)
def create_block(
    body: BlockIn, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("blocks.manage"))
):
    b = CustomBlock(**body.model_dump(), created_by=actor.id, updated_by=actor.id)
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.put("/{block_id}", response_model=BlockOut)
def update_block(
    block_id: int,
    body: BlockIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("blocks.manage")),
):
    b = _get(db, block_id)
    for k, v in body.model_dump().items():
        setattr(b, k, v)
    b.updated_by = actor.id
    db.commit()
    db.refresh(b)
    return b


@router.delete("/{block_id}", status_code=204, dependencies=[Depends(require("blocks.manage"))])
def delete_block(block_id: int, db: Session = Depends(get_db)) -> None:
    db.delete(_get(db, block_id))
    db.commit()
