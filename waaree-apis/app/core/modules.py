"""Auto-discovers feature modules in app/modules/.

Each folder with a router.py exposing `router` is included. A module that fails to import is
logged and skipped, so one broken feature never takes down the whole API.
"""

import importlib
import logging
import pkgutil
from dataclasses import dataclass, field

from fastapi import APIRouter, FastAPI

log = logging.getLogger(__name__)

MODULES_PACKAGE = "app.modules"


@dataclass
class LoadReport:
    loaded: list[str] = field(default_factory=list)
    failed: dict[str, str] = field(default_factory=dict)


def module_names(package: str = MODULES_PACKAGE) -> list[str]:
    pkg = importlib.import_module(package)
    return sorted(m.name for m in pkgutil.iter_modules(pkg.__path__) if m.ispkg)


def include_module_routers(app: FastAPI, package: str = MODULES_PACKAGE) -> LoadReport:
    report = LoadReport()
    for name in module_names(package):
        try:
            mod = importlib.import_module(f"{package}.{name}.router")
            router = getattr(mod, "router", None)
            if not isinstance(router, APIRouter):
                raise TypeError("router.py must define `router = APIRouter(...)`")
            app.include_router(router)
            report.loaded.append(name)
        except Exception as exc:
            log.exception("Module '%s' failed to load and was skipped", name)
            report.failed[name] = f"{type(exc).__name__}: {exc}"
    log.info("Modules loaded: %s", ", ".join(report.loaded) or "none")
    return report


def run_startup_hooks(package: str = MODULES_PACKAGE) -> None:
    """Call `on_startup()` from each module's optional startup.py. Failures are logged, never fatal."""
    for name in module_names(package):
        try:
            mod = importlib.import_module(f"{package}.{name}.startup")
        except ModuleNotFoundError as exc:
            if exc.name == f"{package}.{name}.startup":
                continue
            log.exception("startup.py of module '%s' failed to import", name)
            continue
        except Exception:
            log.exception("startup.py of module '%s' failed to import", name)
            continue
        try:
            mod.on_startup()
        except Exception:
            log.exception("Startup hook of module '%s' failed", name)


def import_all_models(package: str = MODULES_PACKAGE) -> None:
    """Import every module's models.py so Alembic sees all tables."""
    for name in module_names(package):
        try:
            importlib.import_module(f"{package}.{name}.models")
        except ModuleNotFoundError as exc:
            if exc.name != f"{package}.{name}.models":
                raise
