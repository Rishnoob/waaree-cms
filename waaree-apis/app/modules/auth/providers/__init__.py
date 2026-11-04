from app.core.config import get_settings

from .base import AuthProvider
from .local import LocalProvider

_PROVIDERS: dict[str, AuthProvider] = {"local": LocalProvider()}


def get_provider() -> AuthProvider:
    return _PROVIDERS[get_settings().auth_provider]
