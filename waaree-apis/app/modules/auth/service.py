"""Login, sessions and permission resolution. Other modules may import from this file."""

import logging
from datetime import timedelta

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AppError
from app.core.permissions import collect_permissions
from app.core.security import create_access_token, hash_token, new_refresh_token, utcnow
from app.modules.auth import repository as repo
from app.modules.auth.models import Permission, User, UserSession
from app.modules.auth.providers import get_provider
from app.modules.auth.repository import (  # public lookups for other modules (users, roles, ...)
    all_permission_keys,
    get_user,
    get_user_by_email,
    permissions_by_key,
    revoke_all_sessions,
)
from app.modules.auth.schemas import RoleRef, SessionOut, SessionUser

__all__ = [
    "all_permission_keys",
    "get_user",
    "get_user_by_email",
    "is_super_admin",
    "login",
    "logout",
    "permissions_by_key",
    "refresh",
    "revoke_all_sessions",
    "sync_permissions",
    "to_session_user",
    "user_permission_keys",
]

log = logging.getLogger(__name__)


def _invalid_login() -> AppError:
    return AppError(401, "invalid_credentials", "Email or password is incorrect")


def _invalid_session() -> AppError:
    return AppError(401, "session_expired", "Your session has ended. Please log in again.")


# ── Permissions ────────────────────────────────────────────────────────────────


def is_super_admin(user: User) -> bool:
    return any(r.is_system for r in user.roles)


def user_permission_keys(db: Session, user: User) -> frozenset[str]:
    if is_super_admin(user):
        return frozenset(repo.all_permission_keys(db))
    return frozenset(p.key for r in user.roles for p in r.permissions)


def sync_permissions(db: Session) -> None:
    """Make auth.permissions match the permissions declared in code.

    New permissions are inserted and granted to their `default_roles` once. Permissions removed
    from code are deleted (their role links go with them).
    """
    declared = {p.key: p for p in collect_permissions()}
    existing = repo.permissions_by_key(db)
    roles = repo.roles_by_name(db)

    for key, decl in declared.items():
        row = existing.get(key)
        if row is None:
            row = Permission(key=key, module=decl.module, description=decl.description)
            db.add(row)
            for role_name in decl.default_roles:
                if role := roles.get(role_name):
                    role.permissions.append(row)
            log.info("Permission added: %s", key)
        elif row.description != decl.description:
            row.description = decl.description

    for key, row in existing.items():
        if key not in declared:
            db.delete(row)
            log.info("Permission removed: %s", key)
    db.commit()


# ── Login & sessions ───────────────────────────────────────────────────────────


def to_session_user(db: Session, user: User) -> SessionUser:
    return SessionUser(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        roles=[RoleRef(id=r.id, name=r.name) for r in user.roles],
        permissions=sorted(user_permission_keys(db, user)),
        is_super_admin=is_super_admin(user),
    )


def _start_session(db: Session, user: User, ip: str | None, user_agent: str | None) -> tuple[SessionOut, str]:
    raw, token_hash = new_refresh_token()
    now = utcnow()
    db.add(
        UserSession(
            user_id=user.id,
            refresh_token_hash=token_hash,
            ip=ip,
            user_agent=(user_agent or "")[:400] or None,
            created_at=now,
            expires_at=now + timedelta(days=get_settings().refresh_token_days),
        )
    )
    access, ttl = create_access_token(user.id)
    return SessionOut(access_token=access, expires_in=ttl, user=to_session_user(db, user)), raw


def login(
    db: Session, email: str, password: str, ip: str | None, user_agent: str | None
) -> tuple[SessionOut, str]:
    """Returns (session, raw refresh token for the cookie)."""
    settings = get_settings()
    user = repo.get_user_by_email(db, email)
    now = utcnow()

    if user and user.locked_until and user.locked_until > now:
        raise AppError(429, "account_locked", "Too many failed attempts. Try again in a few minutes.")

    if not get_provider().authenticate(db, user, email, password) or user is None:
        if user:
            user.failed_login_count += 1
            if user.failed_login_count >= settings.max_failed_logins:
                user.locked_until = now + timedelta(minutes=settings.lockout_minutes)
                user.failed_login_count = 0
                log.warning("User %s locked after repeated failed logins", user.id)
            db.commit()
        raise _invalid_login()

    if not user.is_active:
        raise _invalid_login()  # same message: don't reveal that the account exists

    user.failed_login_count = 0
    user.locked_until = None
    user.last_login_at = now
    session, raw = _start_session(db, user, ip, user_agent)
    db.commit()
    return session, raw


def refresh(
    db: Session, raw_token: str | None, ip: str | None, user_agent: str | None
) -> tuple[SessionOut, str]:
    """Rotate the refresh token. Reusing an old token revokes every session of that user."""
    if not raw_token:
        raise _invalid_session()
    session = repo.get_session_by_hash(db, hash_token(raw_token))
    if session is None:
        raise _invalid_session()
    if session.revoked_at is not None:
        # A rotated token came back: likely stolen. Log out everywhere.
        repo.revoke_all_sessions(db, session.user_id)
        db.commit()
        log.warning("Refresh token reuse for user %s; all sessions revoked", session.user_id)
        raise _invalid_session()
    user = repo.get_user(db, session.user_id)
    if session.expires_at <= utcnow() or user is None or not user.is_active:
        raise _invalid_session()

    session.revoked_at = utcnow()
    new_session, raw = _start_session(db, user, ip, user_agent)
    db.commit()
    return new_session, raw


def logout(db: Session, raw_token: str | None) -> None:
    if not raw_token:
        return
    session = repo.get_session_by_hash(db, hash_token(raw_token))
    if session and session.revoked_at is None:
        session.revoked_at = utcnow()
        db.commit()
