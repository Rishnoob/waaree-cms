import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.errors import register_error_handlers
from app.core.permissions import Permission, collect_permissions
from app.modules.auth import deps
from app.modules.auth.deps import CurrentUser, require


def test_permission_key_format_enforced():
    with pytest.raises(ValueError):
        Permission("NoDot", "bad")
    assert Permission("pages.edit", "ok").module == "pages"


def test_catalog_collects_module_permissions():
    keys = {p.key for p in collect_permissions()}
    assert {"users.view", "users.manage", "roles.view", "roles.manage"} <= keys


def _app_with_user(perms: set[str]) -> TestClient:
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/thing", dependencies=[Depends(require("things.view"))])
    def thing():
        return {"ok": True}

    app.dependency_overrides[deps.get_current_user] = lambda: CurrentUser(
        id=1, email="a@b.c", full_name="A", permissions=frozenset(perms), is_super_admin=False
    )
    return TestClient(app)


def test_require_allows_with_permission():
    assert _app_with_user({"things.view"}).get("/thing").status_code == 200


def test_require_blocks_without_permission():
    res = _app_with_user(set()).get("/thing")
    assert res.status_code == 403
    assert res.json()["error"]["details"] == {"missing": ["things.view"]}
