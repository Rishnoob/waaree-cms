from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.deps import CurrentUser, require
from app.modules.users import service
from app.modules.users.schemas import PasswordResetIn, UserCreateIn, UserOut, UserUpdateIn

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut], dependencies=[Depends(require("users.view"))])
def list_users(db: Session = Depends(get_db)) -> list[UserOut]:
    return service.list_users(db)


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    body: UserCreateIn, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("users.manage"))
) -> UserOut:
    return service.create_user(db, actor, body)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    body: UserUpdateIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("users.manage")),
) -> UserOut:
    return service.update_user(db, actor, user_id, body)


@router.post(
    "/{user_id}/password", status_code=204, summary="Set a new password (logs the user out everywhere)"
)
def reset_password(
    user_id: int,
    body: PasswordResetIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("users.manage")),
) -> None:
    service.reset_password(db, actor, user_id, body.password)
