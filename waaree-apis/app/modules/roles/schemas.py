from pydantic import BaseModel, Field


class RoleOut(BaseModel):
    id: int
    name: str
    description: str | None
    is_system: bool = Field(description="Super Admin: has every permission, can't be edited or deleted")
    permissions: list[str]
    user_count: int


class PermissionItem(BaseModel):
    key: str
    description: str


class PermissionGroup(BaseModel):
    module: str
    permissions: list[PermissionItem]


class RoleIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    permissions: list[str] = []


class RoleUpdateIn(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    permissions: list[str] | None = None
