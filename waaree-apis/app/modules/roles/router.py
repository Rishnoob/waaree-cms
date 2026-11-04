from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.modules.auth.deps import CurrentUser, require
from app.modules.roles import service
from app.modules.roles.schemas import PermissionGroup, RoleIn, RoleOut, RoleUpdateIn

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[RoleOut], dependencies=[Depends(require("roles.view"))])
def list_roles(db: Session = Depends(get_db)) -> list[RoleOut]:
    return service.list_roles(db)


@router.get(
    "/permissions",
    response_model=list[PermissionGroup],
    dependencies=[Depends(require("roles.view"))],
    summary="Every permission, grouped by module (for the role editor)",
)
def permission_catalog(db: Session = Depends(get_db)) -> list[PermissionGroup]:
    return service.permission_catalog(db)


@router.post("", response_model=RoleOut, status_code=201)
def create_role(
    body: RoleIn, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("roles.manage"))
) -> RoleOut:
    return service.create_role(db, actor, body)


@router.patch("/{role_id}", response_model=RoleOut)
def update_role(
    role_id: int,
    body: RoleUpdateIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("roles.manage")),
) -> RoleOut:
    return service.update_role(db, actor, role_id, body)


@router.delete("/{role_id}", status_code=204, dependencies=[Depends(require("roles.manage"))])
def delete_role(role_id: int, db: Session = Depends(get_db)) -> None:
    service.delete_role(db, role_id)
