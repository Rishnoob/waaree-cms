"""Roles and the permission catalog. Business rules live here."""

from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.modules.auth import service as auth_service
from app.modules.auth.deps import CurrentUser
from app.modules.auth.models import Permission, Role, user_roles
from app.modules.roles.schemas import PermissionGroup, PermissionItem, RoleIn, RoleOut, RoleUpdateIn


def _user_counts(db: Session) -> dict[int, int]:
    rows = db.execute(select(user_roles.c.role_id, func.count()).group_by(user_roles.c.role_id))
    return {role_id: count for role_id, count in rows.tuples()}


def _to_out(db: Session, role: Role, counts: dict[int, int]) -> RoleOut:
    keys = auth_service.all_permission_keys(db) if role.is_system else sorted(p.key for p in role.permissions)
    return RoleOut(
        id=role.id,
        name=role.name,
        description=role.description,
        is_system=role.is_system,
        permissions=keys,
        user_count=counts.get(role.id, 0),
    )


def list_roles(db: Session) -> list[RoleOut]:
    counts = _user_counts(db)
    roles = db.scalars(select(Role).order_by(Role.is_system.desc(), Role.name))
    return [_to_out(db, r, counts) for r in roles]


def permission_catalog(db: Session) -> list[PermissionGroup]:
    groups: dict[str, list[PermissionItem]] = defaultdict(list)
    for p in db.scalars(select(Permission).order_by(Permission.module, Permission.key)):
        groups[p.module].append(PermissionItem(key=p.key, description=p.description))
    return [PermissionGroup(module=m, permissions=items) for m, items in groups.items()]


def _get(db: Session, role_id: int) -> Role:
    role = db.get(Role, role_id)
    if role is None:
        raise AppError(404, "not_found", "Role not found")
    return role


def _resolve_permissions(db: Session, actor: CurrentUser, keys: list[str]) -> list[Permission]:
    by_key = auth_service.permissions_by_key(db)
    unknown = [k for k in keys if k not in by_key]
    if unknown:
        raise AppError(422, "unknown_permissions", "Some permissions don't exist", {"unknown": unknown})
    # No privilege escalation: you can only grant permissions you have yourself.
    beyond = [k for k in keys if k not in actor.permissions]
    if beyond:
        raise AppError(
            403, "forbidden", "You can't grant permissions you don't have", {"permissions": beyond}
        )
    return [by_key[k] for k in dict.fromkeys(keys)]


def _ensure_unique_name(db: Session, name: str, exclude_id: int | None = None) -> None:
    q = select(Role.id).where(func.lower(Role.name) == name.lower())
    if exclude_id is not None:
        q = q.where(Role.id != exclude_id)
    if db.scalar(q):
        raise AppError(409, "name_taken", "A role with this name already exists")


def create_role(db: Session, actor: CurrentUser, body: RoleIn) -> RoleOut:
    name = body.name.strip()
    _ensure_unique_name(db, name)
    role = Role(
        name=name,
        description=body.description,
        permissions=_resolve_permissions(db, actor, body.permissions),
        created_by=actor.id,
        updated_by=actor.id,
    )
    db.add(role)
    db.commit()
    return _to_out(db, role, _user_counts(db))


def update_role(db: Session, actor: CurrentUser, role_id: int, body: RoleUpdateIn) -> RoleOut:
    role = _get(db, role_id)
    if role.is_system:
        raise AppError(409, "system_role", "The Super Admin role can't be changed")
    if body.name is not None:
        _ensure_unique_name(db, body.name.strip(), exclude_id=role.id)
        role.name = body.name.strip()
    if body.description is not None:
        role.description = body.description
    if body.permissions is not None:
        role.permissions = _resolve_permissions(db, actor, body.permissions)
    role.updated_by = actor.id
    db.commit()
    return _to_out(db, role, _user_counts(db))


def delete_role(db: Session, role_id: int) -> None:
    role = _get(db, role_id)
    if role.is_system:
        raise AppError(409, "system_role", "The Super Admin role can't be deleted")
    if _user_counts(db).get(role.id):
        raise AppError(409, "role_in_use", "Move the users in this role to another role first")
    db.delete(role)
    db.commit()
