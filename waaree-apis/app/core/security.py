"""Password hashing and token helpers. No DB access here."""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.core.config import get_settings

_hasher = PasswordHasher()  # Argon2id with library defaults
_ALGORITHM = "HS256"

# Verified against when an email is unknown, so response time doesn't reveal which emails exist.
_DUMMY_HASH = _hasher.hash("timing-equaliser-not-a-real-password")


def utcnow() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)  # DB stores naive UTC (DATETIME2)


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and password_hash is not None
    except VerificationError, InvalidHashError:
        return False


def password_needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)


def create_access_token(user_id: int) -> tuple[str, int]:
    """Short-lived signed token. Returns (token, seconds until expiry)."""
    settings = get_settings()
    ttl = settings.access_token_minutes * 60
    payload = {"sub": str(user_id), "type": "access", "exp": datetime.now(UTC) + timedelta(seconds=ttl)}
    return jwt.encode(payload, settings.jwt_secret.get_secret_value(), algorithm=_ALGORITHM), ttl


def decode_access_token(token: str) -> int | None:
    """User id from a valid access token, or None."""
    try:
        payload = jwt.decode(token, get_settings().jwt_secret.get_secret_value(), algorithms=[_ALGORITHM])
    except jwt.PyJWTError:
        return None
    if payload.get("type") != "access":
        return None
    try:
        return int(payload["sub"])
    except KeyError, ValueError:
        return None


def new_refresh_token() -> tuple[str, str]:
    """(raw token for the cookie, sha256 hash for the DB). Only the hash is ever stored."""
    raw = secrets.token_urlsafe(48)
    return raw, hash_token(raw)


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()
