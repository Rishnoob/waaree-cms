"""Where file bytes live. One small interface so switching to S3 is a setting, not a rewrite.

- LocalStorage: files under `media_dir` on this server (development, and until the bucket exists).
- S3 is plugged in here when Waaree's bucket and keys are available (`media_storage = "s3"`).
"""

from pathlib import Path

from app.core.config import get_settings
from app.core.errors import AppError


class LocalStorage:
    def __init__(self, root: str) -> None:
        self.root = Path(root).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def path(self, name: str) -> Path:
        p = (self.root / name).resolve()
        if self.root not in p.parents:  # never escape the media folder
            raise AppError(400, "bad_name", "Invalid file name")
        return p

    def save(self, name: str, data: bytes) -> None:
        self.path(name).write_bytes(data)

    def delete(self, name: str) -> None:
        self.path(name).unlink(missing_ok=True)


def get_storage() -> LocalStorage:
    s = get_settings()
    if s.media_storage == "s3":
        raise AppError(503, "s3_not_configured", "S3 storage is selected but not set up yet")
    return LocalStorage(s.media_dir)


def public_url(name: str) -> str:
    return f"{get_settings().public_api_url.rstrip('/')}/media/files/{name}"
