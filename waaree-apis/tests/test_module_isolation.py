"""A broken module must be skipped, never crash the app."""

import sys

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.modules import include_module_routers


def test_broken_module_is_skipped_and_good_one_loads(tmp_path, monkeypatch):
    pkg = tmp_path / "fake_modules"
    (pkg / "good").mkdir(parents=True)
    (pkg / "broken").mkdir()
    (pkg / "__init__.py").write_text("")
    (pkg / "good" / "__init__.py").write_text("")
    (pkg / "good" / "router.py").write_text(
        "from fastapi import APIRouter\nrouter = APIRouter(prefix='/good')\n"
        "@router.get('')\ndef ok():\n    return {'ok': True}\n"
    )
    (pkg / "broken" / "__init__.py").write_text("")
    (pkg / "broken" / "router.py").write_text("raise RuntimeError('boom')\n")
    monkeypatch.syspath_prepend(str(tmp_path))

    app = FastAPI()
    report = include_module_routers(app, package="fake_modules")

    assert report.loaded == ["good"]
    assert "broken" in report.failed
    assert TestClient(app).get("/good").json() == {"ok": True}
    for name in [m for m in sys.modules if m.startswith("fake_modules")]:
        del sys.modules[name]
