"""DB queries for the auth module. No business rules here."""

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.security import utcnow
from app.modules.auth.models import Permission, Role, User, UserSession


def get_user(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email.lower()))


def all_permission_keys(db: Session) -> list[str]:
    return list(db.scalars(select(Permission.key).order_by(Permission.key)))


def get_session_by_hash(db: Session, token_hash: str) -> UserSession | None:
    return db.scalar(select(UserSession).where(UserSession.refresh_token_hash == token_hash))


def revoke_all_sessions(db: Session, user_id: int) -> None:
    db.execute(
        update(UserSession)
        .where(UserSession.user_id == user_id, UserSession.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )


def permissions_by_key(db: Session) -> dict[str, Permission]:
    return {p.key: p for p in db.scalars(select(Permission))}


def roles_by_name(db: Session) -> dict[str, Role]:
    return {r.name: r for r in db.scalars(select(Role))}
