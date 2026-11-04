from fastapi.testclient import TestClient

from app.main import create_app
from app.modules.health import router as health_router


def test_health_ok_when_db_reachable(monkeypatch):
    monkeypatch.setattr(health_router, "is_db_reachable", lambda: True)
    res = TestClient(create_app()).get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["database"] == "ok"


def test_health_503_when_db_down(monkeypatch):
    monkeypatch.setattr(health_router, "is_db_reachable", lambda: False)
    res = TestClient(create_app()).get("/health")
    assert res.status_code == 503
    assert res.json()["database"] == "down"


def test_security_headers_present(monkeypatch):
    monkeypatch.setattr(health_router, "is_db_reachable", lambda: True)
    res = TestClient(create_app()).get("/health")
    assert res.headers["X-Content-Type-Options"] == "nosniff"
    assert res.headers["X-Frame-Options"] == "DENY"


def test_unknown_route_uses_standard_error_format():
    res = TestClient(create_app()).get("/does-not-exist")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "not_found"
