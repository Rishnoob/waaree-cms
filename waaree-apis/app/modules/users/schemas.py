from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.modules.auth.schemas import RoleRef

# Long passphrases beat complexity rules (NIST SP 800-63B).
Password = Field(min_length=12, max_length=128, description="At least 12 characters")


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    is_locked: bool
    roles: list[RoleRef]
    last_login_at: datetime | None
    created_at: datetime


class UserCreateIn(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=200)
    password: str = Password
    role_ids: list[int] = []


class UserUpdateIn(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    is_active: bool | None = None
    role_ids: list[int] | None = None


class PasswordResetIn(BaseModel):
    password: str = Password
