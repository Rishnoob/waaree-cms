import mimetypes
import uuid
from datetime import datetime
from pathlib import PurePath

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.core.errors import AppError
from app.modules.auth.deps import CurrentUser, require
from app.modules.media.models import MediaFile
from app.modules.media.storage import get_storage, public_url

router = APIRouter(prefix="/media", tags=["media"])

# Images, documents and video that pages may use. Anything else is refused.
ALLOWED = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "image/avif",
    "application/pdf",
    "video/mp4",
    "video/webm",
}


class MediaOut(BaseModel):
    id: int
    url: str
    original_name: str
    content_type: str
    size_bytes: int
    folder: str
    alt_text: str | None
    created_at: datetime


def _out(f: MediaFile) -> MediaOut:
    return MediaOut(
        id=f.id,
        url=public_url(f.stored_name),
        original_name=f.original_name,
        content_type=f.content_type,
        size_bytes=f.size_bytes,
        folder=f.folder,
        alt_text=f.alt_text,
        created_at=f.created_at,
    )


@router.get("", response_model=list[MediaOut], dependencies=[Depends(require("media.view"))])
def list_media(
    folder: str | None = None, q: str | None = None, db: Session = Depends(get_db)
) -> list[MediaOut]:
    stmt = select(MediaFile).order_by(MediaFile.id.desc())
    if folder:
        stmt = stmt.where(MediaFile.folder == folder)
    if q:
        stmt = stmt.where(MediaFile.original_name.ilike(f"%{q}%"))
    return [_out(f) for f in db.scalars(stmt)]


@router.post("", response_model=MediaOut, status_code=201)
async def upload(
    file: UploadFile = File(...),
    folder: str = Form("general"),
    alt_text: str | None = Form(None),
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("media.upload")),
) -> MediaOut:
    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or ""
    if content_type not in ALLOWED:
        raise AppError(415, "file_type", "Only images, PDFs and MP4/WebM videos can be uploaded")
    data = await file.read()
    limit = get_settings().media_max_mb * 1024 * 1024
    if len(data) > limit:
        raise AppError(413, "too_large", f"Files can be up to {get_settings().media_max_mb} MB")
    ext = PurePath(file.filename or "").suffix.lower()[:10] or (mimetypes.guess_extension(content_type) or "")
    stored = f"{uuid.uuid4().hex}{ext}"
    get_storage().save(stored, data)
    row = MediaFile(
        stored_name=stored,
        original_name=(file.filename or stored)[:255],
        content_type=content_type,
        size_bytes=len(data),
        folder=(folder or "general").strip()[:100] or "general",
        alt_text=alt_text,
        created_by=actor.id,
        updated_by=actor.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _out(row)


@router.delete("/{file_id}", status_code=204, dependencies=[Depends(require("media.upload"))])
def delete(file_id: int, db: Session = Depends(get_db)) -> None:
    row = db.get(MediaFile, file_id)
    if row is None:
        raise AppError(404, "not_found", "File not found")
    get_storage().delete(row.stored_name)
    db.delete(row)
    db.commit()


@router.get("/files/{name}", include_in_schema=False)
def serve(name: str) -> FileResponse:
    """Public: the file itself (pages show these to visitors)."""
    path = get_storage().path(name)
    if not path.is_file():
        raise AppError(404, "not_found", "File not found")
    return FileResponse(path, headers={"Cache-Control": "public, max-age=31536000, immutable"})
