from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.core.errors import AppError
from app.modules.auth import repository as repo
from app.modules.auth import service
from app.modules.auth.deps import CurrentUser, get_current_user
from app.modules.auth.schemas import LoginIn, SessionOut, SessionUser

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "waaree_refresh"
_COOKIE_PATH = "/auth"  # the browser sends it only to /auth/* endpoints


def _set_refresh_cookie(response: Response, raw: str) -> None:
    s = get_settings()
    response.set_cookie(
        REFRESH_COOKIE,
        raw,
        max_age=s.refresh_token_days * 86400,
        httponly=True,
        secure=s.cookie_secure,
        samesite=s.cookie_samesite,
        path=_COOKIE_PATH,
    )


def _client(request: Request) -> tuple[str | None, str | None]:
    return (request.client.host if request.client else None), request.headers.get("user-agent")


@router.post("/login", response_model=SessionOut, summary="Log in with email and password")
def login(body: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)) -> SessionOut:
    session, raw = service.login(db, body.email, body.password, *_client(request))
    _set_refresh_cookie(response, raw)
    return session


@router.post("/refresh", response_model=SessionOut, summary="Get a new access token using the refresh cookie")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)) -> SessionOut:
    session, raw = service.refresh(db, request.cookies.get(REFRESH_COOKIE), *_client(request))
    _set_refresh_cookie(response, raw)
    return session


@router.post("/logout", status_code=204, summary="Log out this device")
def logout(request: Request, response: Response, db: Session = Depends(get_db)) -> None:
    service.logout(db, request.cookies.get(REFRESH_COOKIE))
    response.delete_cookie(REFRESH_COOKIE, path=_COOKIE_PATH)


@router.get("/me", response_model=SessionUser, summary="Who am I, and what can I do?")
def me(current: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)) -> SessionUser:
    user = repo.get_user(db, current.id)
    if user is None:  # deleted between the auth check and now
        raise AppError(401, "not_authenticated", "Please log in")
    return service.to_session_user(db, user)
