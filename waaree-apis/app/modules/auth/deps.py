"""Route guards. Use from any module:

from app.modules.auth.deps import CurrentUser, require

@router.get("", dependencies=[Depends(require("pages.view"))])
def list_pages(): ...

@router.post("")
def create_page(user: CurrentUser = Depends(require("pages.edit"))): ...  # also gives you the user
"""

from collections.abc import Callable
from dataclasses import dataclass

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import AppError
from app.core.security import decode_access_token
from app.modules.auth import repository as repo
from app.modules.auth.service import is_super_admin, user_permission_keys

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: int
    email: str
    full_name: str
    permissions: frozenset[str]
    is_super_admin: bool

    def can(self, key: str) -> bool:
        return key in self.permissions


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> CurrentUser:
    user_id = decode_access_token(creds.credentials) if creds else None
    user = repo.get_user(db, user_id) if user_id else None
    if user is None or not user.is_active:
        raise AppError(401, "not_authenticated", "Please log in")
    return CurrentUser(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        permissions=user_permission_keys(db, user),
        is_super_admin=is_super_admin(user),
    )


def require(*keys: str) -> Callable[..., CurrentUser]:
    """Dependency: the logged-in user must have every listed permission."""

    def _check(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        missing = [k for k in keys if k not in user.permissions]
        if missing:
            raise AppError(403, "forbidden", "You don't have permission to do this", {"missing": missing})
        return user

    return _check
