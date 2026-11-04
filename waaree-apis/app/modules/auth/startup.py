from app.core.db import get_db
from app.modules.auth.service import sync_permissions


def on_startup() -> None:
    """Sync permissions declared in code to auth.permissions."""
    db = next(get_db())
    try:
        sync_permissions(db)
    finally:
        db.close()
