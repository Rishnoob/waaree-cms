"""Login provider interface. Authentication (who you are) is swappable; roles and permissions stay ours.

To add Waaree's login later: create providers/<name>.py implementing AuthProvider, register it in
providers/__init__.py, and set AUTH_PROVIDER=<name>. Nothing else in the app changes.
"""

from typing import Protocol

from sqlalchemy.orm import Session

from app.modules.auth.models import User


class AuthProvider(Protocol):
    name: str

    def authenticate(self, db: Session, user: User | None, email: str, password: str) -> bool:
        """True if these credentials prove the person is `user`. `user` is None for unknown emails."""
        ...
