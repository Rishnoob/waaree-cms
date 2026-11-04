"""Site settings and the website menu.

- `GET /site/public`: what the website needs (menu tree of live links + public settings). No login.
- Settings: `GET/PUT /site/settings` (settings.manage).
- Menu: `GET /site/menu` (the full tree for the CMS), `POST /site/menu`, `PUT/DELETE /site/menu/{id}`,
  `PUT /site/menu/order` (menu.manage).
- Placement: `GET/PUT /site/placement/{page_id}`: where a page appears in the menu (pages.edit).
"""

from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.errors import AppError
from app.modules.auth.deps import CurrentUser, require
from app.modules.pages.models import Page
from app.modules.pages.service import live_pages
from app.modules.site.models import MenuItem, Setting

router = APIRouter(prefix="/site", tags=["site"])

# Waaree's built-in navbar sections (their mega menus live in the website code); pages and links
# can be placed inside them.
SECTIONS = ("Company", "Products", "Solutions", "Investors", "People")
# Each section's sub-menus (the columns of its mega menu), as the website shows them.
SECTION_COLUMNS: dict[str, list[str]] = {
    "Company": ["Company", "Group Business"],
    "Products": ["PV Modules", "Power & Storage"],
    "Solutions": ["By application", "Services"],
    "Investors": ["Investor Relations", "Governance"],
    "People": ["People", "Network"],
}

# Known settings: key -> (default, shown on the public site?). Unknown keys are refused.
SETTINGS: dict[str, tuple[str, bool]] = {
    "site_name": ("Waaree Energies", True),
    "contact_email": ("waaree@waaree.com", True),
    "contact_phone": ("022 6644 4444", True),
    "announcement": ("", True),  # a one-line banner across the site; empty = hidden
    "ai_search_enabled": ("false", True),  # needs an AI provider key (PLAN.md §13a)
    "stock_ticker_enabled": ("false", True),  # needs a market-data key
    "approval_required": ("true", False),  # maker-checker on (kept on in the MVP)
}


# ── Shapes ───────────────────────────────────────────────────────────────────
class MenuItemIn(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    href: str | None = Field(default=None, max_length=500)
    visible: bool = True
    section: str | None = None
    column: str | None = None  # a sub-menu of `section`
    parent_id: int | None = None
    page_id: int | None = None


class MenuItemOut(BaseModel):
    id: int
    label: str
    href: str
    visible: bool
    position: int
    section: str | None
    column: str | None = None
    parent_id: int | None
    page_id: int | None
    page_title: str | None = None
    page_status: str | None = None
    live: bool = True  # false when it points at a page that isn't live yet (hidden on the site)


class MenuTree(BaseModel):
    sections: list[str]
    columns: dict[str, list[str]] = SECTION_COLUMNS
    items: list[MenuItemOut]


class MoreLink(BaseModel):
    label: str
    href: str


class PublicSite(BaseModel):
    sections: list[str]
    columns: dict[str, list[str]] = SECTION_COLUMNS
    menu: list[MenuItemOut]
    # live pages that aren't in the menu: the website lists them under "More" at the end of the menu
    more: list[MoreLink] = []
    settings: dict[str, str]


class PlacementIn(BaseModel):
    # "none" | "top" | "section:<Name>" | "section:<Name>/<Sub-menu>" | "item:<id>"
    where: str
    label: str | None = Field(default=None, max_length=60)


class PlacementOut(BaseModel):
    where: str
    label: str | None
    item_id: int | None


# ── Helpers ──────────────────────────────────────────────────────────────────
def _settings(db: Session) -> dict[str, str]:
    stored = {s.key: s.value or "" for s in db.scalars(select(Setting))}
    return {k: stored.get(k, default) for k, (default, _) in SETTINGS.items()}


def _items(db: Session, only_live: bool = False) -> list[MenuItemOut]:
    now = db.scalar(select(func.sysutcdatetime()))
    rows = db.execute(
        select(MenuItem, Page)
        .outerjoin(Page, Page.id == MenuItem.page_id)
        .order_by(MenuItem.position, MenuItem.id)
    ).all()
    out = []
    for m, p in rows:
        live = p is None or (
            p.published_at is not None and p.published_at <= now and p.live_title is not None
        )
        if only_live and (not m.visible or not live):
            continue
        out.append(
            MenuItemOut(
                id=m.id,
                # a page's link always reads as the page's title (the live one on the website)
                label=((p.live_title if only_live else None) or p.title)[:60] if p else m.label,
                href=f"/{p.slug}" if p else m.href,
                visible=m.visible,
                position=m.position,
                section=m.section,
                column=m.column,
                parent_id=m.parent_id,
                page_id=m.page_id,
                page_title=p.title if p else None,
                page_status=p.status if p else None,
                live=live,
            )
        )
    if only_live:
        ids = {i.id for i in out}
        out = [i for i in out if i.parent_id is None or i.parent_id in ids]  # parent hidden → children too
        with_kids = {i.parent_id for i in out if i.parent_id}
        out = [i for i in out if i.href or i.id in with_kids]  # an empty group isn't shown
    return out


def _check_parent(db: Session, section: str | None, parent_id: int | None, column: str | None = None) -> None:
    if section and section not in SECTIONS:
        raise AppError(422, "bad_section", f"Unknown section: {section}")
    if column and (not section or column not in SECTION_COLUMNS[section]):
        raise AppError(422, "bad_column", f"{section or 'This place'} has no sub-menu called {column}")
    if section and parent_id:
        raise AppError(422, "bad_parent", "Choose a section or a parent link, not both")
    if parent_id:
        parent = db.get(MenuItem, parent_id)
        if parent is None:
            raise AppError(404, "not_found", "Parent link not found")
        if parent.parent_id or parent.section:
            raise AppError(422, "too_deep", "Menus go two levels deep: put this under a top-level item")


def _next_position(db: Session) -> int:
    return (db.scalar(select(func.max(MenuItem.position))) or 0) + 1


# ── Public ───────────────────────────────────────────────────────────────────
@router.get("/public", response_model=PublicSite)
def public(db: Session = Depends(get_db)) -> PublicSite:
    all_settings = _settings(db)
    in_menu = set(db.scalars(select(MenuItem.page_id).where(MenuItem.page_id.is_not(None))))
    more = sorted(
        (
            MoreLink(label=(p.live_title or p.title)[:60], href=f"/{p.slug}")
            for p in live_pages(db)
            if p.id not in in_menu
        ),
        key=lambda m: m.label.lower(),
    )
    return PublicSite(
        sections=list(SECTIONS),
        more=more,
        menu=_items(db, only_live=True),
        settings={k: v for k, v in all_settings.items() if SETTINGS[k][1]},
    )


# ── Settings ─────────────────────────────────────────────────────────────────
@router.get("/settings", response_model=dict[str, str], dependencies=[Depends(require("settings.manage"))])
def get_settings_(db: Session = Depends(get_db)) -> dict[str, str]:
    return _settings(db)


@router.put("/settings", response_model=dict[str, str])
def put_settings(
    body: dict[str, str],
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("settings.manage")),
) -> dict[str, str]:
    unknown = set(body) - set(SETTINGS)
    if unknown:
        raise AppError(422, "unknown_setting", f"Unknown setting: {', '.join(sorted(unknown))}")
    for k, v in body.items():
        row = db.get(Setting, k)
        if row is None:
            db.add(Setting(key=k, value=v[:2000], created_by=actor.id, updated_by=actor.id))
        else:
            row.value, row.updated_by = v[:2000], actor.id
    db.commit()
    return _settings(db)


# ── Menu ─────────────────────────────────────────────────────────────────────
@router.get("/menu", response_model=MenuTree, dependencies=[Depends(require("pages.view"))])
def list_menu(db: Session = Depends(get_db)) -> MenuTree:
    return MenuTree(sections=list(SECTIONS), items=_items(db))


@router.post("/menu", response_model=MenuItemOut, status_code=201)
def add_menu(
    body: MenuItemIn, db: Session = Depends(get_db), actor: CurrentUser = Depends(require("menu.manage"))
) -> MenuItemOut:
    _check_parent(db, body.section, body.parent_id, body.column)
    if not body.page_id and not body.href and (body.section or body.parent_id):
        raise AppError(422, "href_required", "Give the link an address, or choose a page")
    m = MenuItem(
        label=body.label,
        href=body.href or "",
        visible=body.visible,
        section=body.section,
        column=body.column if body.section else None,
        parent_id=body.parent_id,
        page_id=body.page_id,
        position=_next_position(db),
        created_by=actor.id,
        updated_by=actor.id,
    )
    db.add(m)
    db.commit()
    return next(i for i in _items(db) if i.id == m.id)


@router.put("/menu/order", response_model=MenuTree, dependencies=[Depends(require("menu.manage"))])
def reorder_menu(ids: list[int], db: Session = Depends(get_db)) -> MenuTree:
    for pos, mid in enumerate(ids):
        m = db.get(MenuItem, mid)
        if m:
            m.position = pos
    db.commit()
    return MenuTree(sections=list(SECTIONS), items=_items(db))


@router.put("/menu/{item_id}", response_model=MenuItemOut)
def edit_menu(
    item_id: int,
    body: MenuItemIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("menu.manage")),
) -> MenuItemOut:
    m = db.get(MenuItem, item_id)
    if m is None:
        raise AppError(404, "not_found", "Menu link not found")
    if body.parent_id == item_id:
        raise AppError(422, "bad_parent", "A link can't sit under itself")
    _check_parent(db, body.section, body.parent_id, body.column)
    m.label, m.visible, m.section, m.parent_id = body.label, body.visible, body.section, body.parent_id
    m.column = body.column if body.section else None
    if not m.page_id:
        m.href = body.href or m.href
    m.updated_by = actor.id
    db.commit()
    return next(i for i in _items(db) if i.id == m.id)


@router.delete("/menu/{item_id}", status_code=204, dependencies=[Depends(require("menu.manage"))])
def delete_menu(item_id: int, db: Session = Depends(get_db)) -> None:
    m = db.get(MenuItem, item_id)
    if m:
        # What was inside goes with it: its pages then show under "More" on the website (they stay
        # live, never orphaned), and its plain links are removed.
        for child in db.scalars(select(MenuItem).where(MenuItem.parent_id == m.id)):
            db.delete(child)
        db.flush()  # children first: they point at it
        db.delete(m)
        db.commit()


# ── Placement: where a page appears ──────────────────────────────────────────
def _where(m: MenuItem | None) -> str:
    if m is None:
        return "none"
    if m.section:
        return f"section:{m.section}/{m.column}" if m.column else f"section:{m.section}"
    if m.parent_id:
        return f"item:{m.parent_id}"
    return "top"


@router.get(
    "/placement/{page_id}", response_model=PlacementOut, dependencies=[Depends(require("pages.view"))]
)
def get_placement(page_id: int, db: Session = Depends(get_db)) -> PlacementOut:
    m = db.scalar(select(MenuItem).where(MenuItem.page_id == page_id))
    return PlacementOut(where=_where(m), label=m.label if m else None, item_id=m.id if m else None)


@router.put("/placement/{page_id}", response_model=PlacementOut)
def set_placement(
    page_id: int,
    body: PlacementIn,
    db: Session = Depends(get_db),
    actor: CurrentUser = Depends(require("pages.edit")),
) -> PlacementOut:
    page = db.get(Page, page_id)
    if page is None:
        raise AppError(404, "not_found", "Page not found")
    m = db.scalar(select(MenuItem).where(MenuItem.page_id == page_id))
    if body.where == "none":
        if m:
            db.delete(m)
            db.commit()
        return PlacementOut(where="none", label=None, item_id=None)

    kind: Literal["top", "section", "item"]
    section: str | None = None
    column: str | None = None
    parent_id: int | None = None
    if body.where == "top":
        kind = "top"
    elif body.where.startswith("section:"):
        kind, section = "section", body.where.split(":", 1)[1]
        if "/" in section:  # "Company/Group Business": a sub-menu of the section
            section, column = section.split("/", 1)
    elif body.where.startswith("item:"):
        kind, parent_id = "item", int(body.where.split(":", 1)[1])
    else:
        raise AppError(422, "bad_where", "Unknown place in the menu")
    _check_parent(db, section, parent_id, column)
    if m and m.id == parent_id:
        raise AppError(422, "bad_parent", "A page can't sit under its own link")

    label = (body.label or page.title)[:60]
    if m is None:
        m = MenuItem(page_id=page_id, href="", position=_next_position(db), created_by=actor.id)
        db.add(m)
    m.label, m.section, m.parent_id, m.updated_by = label, section, parent_id, actor.id
    m.column = column
    db.commit()
    return PlacementOut(where=_where(m) if kind else "none", label=m.label, item_id=m.id)
