from datetime import datetime

from pydantic import BaseModel, Field, field_validator

# Web addresses the website itself uses; a page can't take them.
RESERVED_SLUGS = {"login", "cms", "factories", "api", "sitemap", "robots"}


class PageIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=200)
    summary: str | None = Field(default=None, max_length=500)
    body: str | None = None

    @field_validator("slug")
    @classmethod
    def _not_reserved(cls, v: str) -> str:
        if v in RESERVED_SLUGS:
            raise ValueError(f"waaree.com/{v} is used by the website itself. Choose another web address.")
        return v


class ReviewIn(BaseModel):
    comment: str | None = Field(default=None, max_length=1000)


class PageEventOut(BaseModel):
    id: int
    action: str
    actor_name: str
    comment: str | None
    at: datetime

    model_config = {"from_attributes": True}


class PageOut(BaseModel):
    id: int
    title: str
    slug: str
    summary: str | None
    body: str | None
    status: str
    created_by: int | None
    submitted_by: int | None
    updated_at: datetime
    published_at: datetime | None
    has_live: bool  # a published version exists; drafts never change it until published again
    events: list[PageEventOut]

    model_config = {"from_attributes": True}


class PublicPageOut(BaseModel):
    slug: str
    title: str
    summary: str | None
    body: str | None
    published_at: datetime


class PublishIn(BaseModel):
    at: datetime | None = None  # None = now; a future time (UTC) schedules the page
