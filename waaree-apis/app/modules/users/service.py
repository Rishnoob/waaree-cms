"""Managing CMS users. Business rules live here."""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.core.security import hash_password, utcnow
from app.modules.auth import service as auth_service
from app.modules.auth.deps import CurrentUser
from app.modules.auth.models import Role, User, user_roles
from app.modules.auth.schemas import RoleRef
from app.modules.auth.service import is_super_admin
from app.modules.users.schemas import UserCreateIn, UserOut, UserUpdateIn


def to_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        is_locked=bool(user.locked_until and user.locked_until > utcnow()),
        roles=[RoleRef(id=r.id, name=r.name) for r in user.roles],
        last_login_at=user.last_login_at,
        created_at=user.created_at,
    )


def list_users(db: Session) -> list[UserOut]:
    return [to_out(u) for u in db.scalars(select(User).order_by(User.full_name))]


def _get(db: Session, user_id: int) -> User:
    user = auth_service.get_user(db, user_id)
    if user is None:
        raise AppError(404, "not_found", "User not found")
    return user


def _load_roles(db: Session, actor: CurrentUser, role_ids: list[int]) -> list[Role]:
    roles = list(db.scalars(select(Role).where(Role.id.in_(role_ids)))) if role_ids else []
    if len(roles) != len(set(role_ids)):
        raise AppError(422, "invalid_roles", "One or more roles don't exist")
    # No privilege escalation: you can only hand out what you already have.
    if not actor.is_super_admin:
        for role in roles:
            if role.is_system or any(p.key not in actor.permissions for p in role.permissions):
                raise AppError(403, "forbidden", f"You can't assign the role '{role.name}'")
    return roles


def _guard_target(actor: CurrentUser, target: User) -> None:
    if is_super_admin(target) and not actor.is_super_admin:
        raise AppError(403, "forbidden", "Only a Super Admin can change a Super Admin")


def _ensure_a_super_admin_remains(db: Session) -> None:
    db.flush()
    count = db.scalar(
        select(func.count())
        .select_from(User)
        .join(user_roles, user_roles.c.user_id == User.id)
        .join(Role, Role.id == user_roles.c.role_id)
        .where(Role.is_system.is_(True), User.is_active.is_(True))
    )
    if not count:
        db.rollback()
        raise AppError(409, "last_super_admin", "There must always be at least one active Super Admin")


def create_user(db: Session, actor: CurrentUser, body: UserCreateIn) -> UserOut:
    email = body.email.lower()
    if auth_service.get_user_by_email(db, email):
        raise AppError(409, "email_taken", "A user with this email already exists")
    user = User(
        email=email,
        full_name=body.full_name.strip(),
        password_hash=hash_password(body.password),
        roles=_load_roles(db, actor, body.role_ids),
        created_by=actor.id,
        updated_by=actor.id,
    )
    db.add(user)
    db.commit()
    return to_out(user)


def update_user(db: Session, actor: CurrentUser, user_id: int, body: UserUpdateIn) -> UserOut:
    user = _get(db, user_id)
    _guard_target(actor, user)
    if body.full_name is not None:
        user.full_name = body.full_name.strip()
    if body.is_active is not None:
        if user.id == actor.id and not body.is_active:
            raise AppError(409, "cannot_deactivate_self", "You can't deactivate your own account")
        user.is_active = body.is_active
        if not body.is_active:
            auth_service.revoke_all_sessions(db, user.id)
    if body.role_ids is not None:
        user.roles = _load_roles(db, actor, body.role_ids)
    user.updated_by = actor.id
    _ensure_a_super_admin_remains(db)
    db.commit()
    return to_out(user)


def reset_password(db: Session, actor: CurrentUser, user_id: int, password: str) -> None:
    user = _get(db, user_id)
    _guard_target(actor, user)
    user.password_hash = hash_password(password)
    user.failed_login_count = 0
    user.locked_until = None
    user.updated_by = actor.id
    auth_service.revoke_all_sessions(db, user.id)  # old password's sessions end
    db.commit()
