from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    # Not EmailStr: login only looks the address up. Format rules apply when a user is created.
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=200)


class RoleRef(BaseModel):
    id: int
    name: str


class SessionUser(BaseModel):
    id: int
    email: str
    full_name: str
    roles: list[RoleRef]
    permissions: list[str] = Field(description="Every permission key this user has")
    is_super_admin: bool


class SessionOut(BaseModel):
    """Returned by login and refresh. The refresh token travels only in an httpOnly cookie."""

    access_token: str
    expires_in: int = Field(description="Seconds until the access token expires")
    user: SessionUser
