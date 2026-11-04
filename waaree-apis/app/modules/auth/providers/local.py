from sqlalchemy.orm import Session

from app.core.security import hash_password, password_needs_rehash, verify_password
from app.modules.auth.models import User


class LocalProvider:
    """MVP provider: email + password checked against auth.users (Argon2 hash)."""

    name = "local"

    def authenticate(self, db: Session, user: User | None, email: str, password: str) -> bool:
        # Always run a hash check (dummy hash for unknown users) so timing doesn't reveal valid emails.
        ok = verify_password(user.password_hash if user else None, password)
        if ok and user and user.password_hash and password_needs_rehash(user.password_hash):
            user.password_hash = hash_password(password)
        return ok and user is not None
