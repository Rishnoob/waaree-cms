"""Permission catalog. Each module declares its permissions in `modules/<name>/permissions.py`:

    PERMISSIONS = [
        Permission("pages.edit", "Create and edit pages", default_roles=("Admin", "Editor")),
    ]

On startup they're synced to `auth.permissions`. `default_roles` are granted only the first time a
permission appears, so admins' later changes are never overwritten. Super Admin always has everything.

To check a permission on a route: `Depends(require("pages.edit"))` from `app.modules.auth.deps`.
"""

import importlib
import logging
import re
from dataclasses import dataclass

from app.core.modules import MODULES_PACKAGE, module_names

log = logging.getLogger(__name__)

_KEY = re.compile(r"^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$")


@dataclass(frozen=True)
class Permission:
    key: str
    description: str
    default_roles: tuple[str, ...] = ()

    @property
    def module(self) -> str:
        return self.key.split(".", 1)[0]

    def __post_init__(self) -> None:
        if not _KEY.match(self.key):
            raise ValueError(f"Permission key '{self.key}' must look like 'module.action'")


def collect_permissions(package: str = MODULES_PACKAGE) -> list[Permission]:
    """All permissions declared by modules. A broken permissions.py is logged and skipped."""
    found: dict[str, Permission] = {}
    for name in module_names(package):
        try:
            mod = importlib.import_module(f"{package}.{name}.permissions")
        except ModuleNotFoundError as exc:
            if exc.name == f"{package}.{name}.permissions":
                continue
            log.exception("permissions.py of module '%s' failed to import", name)
            continue
        except Exception:
            log.exception("permissions.py of module '%s' failed to import", name)
            continue
        for perm in getattr(mod, "PERMISSIONS", []):
            if perm.key in found:
                log.error("Duplicate permission key '%s' (module '%s') ignored", perm.key, name)
                continue
            found[perm.key] = perm
    return sorted(found.values(), key=lambda p: p.key)
