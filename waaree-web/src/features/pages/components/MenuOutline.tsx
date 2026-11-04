"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronDown, Ellipsis, Eye, EyeOff, GripVertical, Link2, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { BAR_SLOTS, NAV } from "@/features/landing";
import { type MenuLink, toParent, useMenu, useMenuActions, whereOf, type Where } from "@/features/site";
import { api } from "@/lib/api/client";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import type { CmsPage } from "../hooks";
import { DOT, pageState } from "../status";

/** A place things can be dropped into: a sub-menu of a Waaree section, your own menu item, or the main menu. */
type Target = {
  key: Where;
  title: string;
  builtIn?: readonly (readonly [string, string])[];
};
type Block = {
  key: string;
  title: string;
  caption: string;
  item?: MenuLink;
  targets: Target[];
  sub: boolean;
};
type Row = { key: string; page?: CmsPage; link?: MenuLink };
const ROW = "application/x-waaree-row";

/**
 * The website menu as one outline, in the order the navbar shows it. Waaree’s menu items show their
 * sub-menus (Company → “Company”, “Group Business”) with Waaree’s own links in grey, so you see exactly
 * where a page will sit. Drag a page to move it; add pages or links right where they should go.
 */
export function MenuOutline({ pages, onAddPage }: { pages: CmsPage[]; onAddPage: (where: Where) => void }) {
  const menu = useMenu();
  const canEdit = useCan("pages.edit");
  const canMenu = useCan("menu.manage");
  const actions = useMenuActions();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<null | { kind: "group" } | { kind: "rename"; item: MenuLink } | { kind: "link"; where: Where } | { kind: "remove"; item: MenuLink }>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const items = menu.data?.items ?? [];
  const columns = menu.data?.columns ?? {};
  const ownGroups = items.filter((i) => !i.section && !i.parent_id && !i.page_id && !i.href);
  // the website gives the first of your top-level items a slot on the menu bar; the rest go under More
  const tops = items.filter((i) => !i.section && !i.parent_id && i.visible);
  const placeOnSite = (g: MenuLink) => {
    const slot = BAR_SLOTS[tops.findIndex((t) => t.id === g.id)];
    if (!g.visible) return "Added by you · hidden";
    return slot ? `Added by you · on the menu bar on ${slot.from}, otherwise under More` : "Added by you · under More on the website";
  };
  const shift = (g: MenuLink, d: -1 | 1) => {
    const all = items.filter((i) => !i.section && !i.parent_id);
    const j = all.findIndex((t) => t.id === g.id) + d;
    if (j < 0 || j >= all.length) return;
    const ids = items.map((i) => i.id);
    const a = ids.indexOf(g.id);
    const b = ids.indexOf(all[j]!.id);
    [ids[a], ids[b]] = [ids[b]!, ids[a]!];
    actions.order.mutate(ids);
  };
  const blocks: Block[] = [
    ...(menu.data?.sections ?? []).map((s) => {
      const nav = NAV.find((n) => n.label === s);
      const subs: Target[] = (columns[s] ?? []).map((c) => ({
        key: `section:${s}/${c}`,
        title: c,
        builtIn: nav?.columns.find((col) => col.title === c)?.links,
      }));
      // links placed in the section before sub-menus existed
      if (items.some((i) => whereOf(i) === `section:${s}`)) subs.push({ key: `section:${s}`, title: "More" });
      return {
        key: `section:${s}`,
        title: s,
        caption: "Waaree menu",
        targets: subs,
        sub: true,
      };
    }),
    ...ownGroups.map((g) => ({
      key: `item:${g.id}`,
      title: g.label,
      caption: placeOnSite(g),
      item: g,
      targets: [{ key: `item:${g.id}`, title: g.label }],
      sub: false,
    })),
    // pages set up on their own in the main menu earlier (no longer offered; shown while any exist)
    ...(items.some((i) => whereOf(i) === "top" && (i.page_id || i.href))
      ? [
          {
            key: "top",
            title: "On their own in the main menu",
            caption: "Set up earlier. Drag them into a menu item",
            targets: [{ key: "top", title: "Main menu" }],
            sub: false,
          },
        ]
      : []),
    {
      key: "none",
      title: "More",
      caption: "Every page not placed in a menu item above shows here, at the end of the website menu",
      targets: [{ key: "none", title: "More" }],
      sub: false,
    },
  ];
  const targetName = (t: Target) => (t.key.startsWith("section:") ? `${t.key.slice(8).split("/")[0]} › ${t.title}` : t.title);
  const rowsOf = (t: Target): Row[] =>
    t.key === "none"
      ? pages.filter((p) => !items.some((i) => i.page_id === p.id)).map((p) => ({ key: `p${p.id}`, page: p }))
      : items
          .filter((i) => whereOf(i) === t.key && (t.key !== "top" || i.page_id || i.href))
          .map((i) => ({
            key: `m${i.id}`,
            link: i,
            page: i.page_id ? pages.find((p) => p.id === i.page_id) : undefined,
          }));

  const drop = async (key: string, t: Target, beforeKey?: string) => {
    setDragging(null);
    setOver(null);
    const rows = blocks.flatMap((b) => b.targets).flatMap(rowsOf);
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    try {
      let itemId = row.link?.id ?? null;
      if (row.page) {
        const res = await api.PUT("/site/placement/{page_id}", {
          params: { path: { page_id: row.page.id } },
          body: { where: t.key, label: null },
        });
        itemId = res.data?.item_id ?? null;
      } else if (row.link) {
        if (t.key === "none") throw new Error("Only pages can go in More. Remove the link instead.");
        await actions.edit.mutateAsync({
          id: row.link.id,
          body: {
            ...row.link,
            href: row.link.href || null,
            ...toParent(t.key),
          },
        });
      }
      // dropped on a row: also put it just before that row (reordering the menu is for admins)
      const target = beforeKey ? rows.find((r) => r.key === beforeKey)?.link?.id : undefined;
      if (canMenu && itemId && target && target !== itemId) {
        const ids = items.map((i) => i.id).filter((id) => id !== itemId);
        ids.splice(ids.indexOf(target), 0, itemId);
        await actions.order.mutateAsync(ids);
      }
      toast.success(t.key === "none" ? "Moved to More" : `Moved to ${targetName(t)}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      await Promise.all(["menu", "site-public", "placement"].map((k) => qc.invalidateQueries({ queryKey: [k] })));
    }
  };

  const dropZone = (t: Target) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(ROW)) return;
      e.preventDefault();
      setOver(t.key);
    },
    onDragLeave: (e: React.DragEvent<HTMLElement>) => !e.currentTarget.contains(e.relatedTarget as Node) && setOver(null),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      void drop(e.dataTransfer.getData(ROW), t);
    },
  });

  const addButtons = (t: Target) =>
    t.key === "top" ? null : (
      <>
        {canEdit && (
          <button
            type="button"
            onClick={() => onAddPage(t.key)}
            aria-label={`Add a page to ${targetName(t)}`}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary-strong hover:bg-brand-green/[0.07] focus-visible:shadow-glow focus-visible:outline-none"
          >
            <Plus aria-hidden className="size-4" /> Add a page
          </button>
        )}
        {canMenu && t.key !== "none" && (
          <button
            type="button"
            onClick={() => setDialog({ kind: "link", where: t.key })}
            aria-label={`Add a link to ${targetName(t)}`}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-body hover:bg-foreground/[0.04] hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none"
          >
            <Link2 aria-hidden className="size-4" /> Add a link
          </button>
        )}
      </>
    );

  const list = (t: Target, indent: string, own?: MenuLink) => {
    const rows = rowsOf(t);
    return (
      <ul>
        {t.builtIn && t.builtIn.length > 0 && (
          <li className={cn("flex items-start gap-3 py-1.5 pr-5 text-sm text-muted", indent)} title="Waaree’s existing links. They stay as they are.">
            <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            <span>{t.builtIn.map(([label]) => label).join(" · ")}</span>
          </li>
        )}
        {rows.map((r) => (
          <li
            key={r.key}
            draggable={canEdit && (!!r.page || canMenu)}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData(ROW, r.key);
              setTimeout(() => setDragging(r.key)); // changing the page during dragstart cancels the drag in Chrome
            }}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void drop(e.dataTransfer.getData(ROW), t, r.key);
            }}
            className={cn("group/row", dragging === r.key && "opacity-40")}
          >
            {r.page ? <PageLine page={r.page} hidden={r.link ? !r.link.visible : false} indent={indent} /> : r.link ? <LinkLine link={r.link} canManage={canMenu} indent={indent} /> : null}
          </li>
        ))}
        {rows.length === 0 && !t.builtIn?.length && (
          <li className={cn("flex flex-wrap items-center gap-x-3 py-1.5 pr-5 text-sm text-muted", indent)}>
            {t.key === "none" ? "Every page is in a menu item." : own ? "Empty. It doesn’t show on the website until a live page is inside." : "Nothing here yet."}
            {own && canMenu && (
              <button type="button" onClick={() => setDialog({ kind: "remove", item: own })} className="flex items-center gap-1 font-medium text-danger hover:underline">
                <Trash2 aria-hidden className="size-3.5" /> Remove this menu item
              </button>
            )}
          </li>
        )}
      </ul>
    );
  };

  if (menu.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface-muted" />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-body">
          The website menu, in order. Grey links are Waaree’s own. Your pages show on the website once they’re live; any page not placed in a menu item shows under More. The menu bar has room for {BAR_SLOTS.length} of
          your own menu items on wide screens; the rest also go under More. Drag a page to move it.
        </p>
        {canMenu && (
          <Button variant="secondary" onClick={() => setDialog({ kind: "group" })}>
            <Plus aria-hidden /> New menu item
          </Button>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
        {blocks.map((b) => (
          <section key={b.key} aria-label={b.title} className="border-b border-border last:border-0" {...(!b.sub && dropZone(b.targets[0]!))}>
            <header className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 transition-colors", !b.sub && over === b.targets[0]!.key && "bg-brand-green/[0.06]")}>
              <ChevronDown aria-hidden className="size-4 text-muted" />
              <h2 className={cn("font-medium text-foreground", b.item && !b.item.visible && "opacity-50")}>{b.title}</h2>
              <span className="text-xs text-muted">{b.caption}</span>
              <span className="flex-1" />
              {!b.sub && addButtons(b.targets[0]!)}
              {canMenu && b.item && (
                <Menu
                  trigger={
                    <IconButton label={`Options for ${b.title}`} size="sm">
                      <Ellipsis aria-hidden />
                    </IconButton>
                  }
                  items={[
                    {
                      label: "Rename",
                      icon: Pencil,
                      onSelect: () => setDialog({ kind: "rename", item: b.item! }),
                    },
                    { label: "Move up", hint: "Earlier items get a place on the menu bar", icon: ArrowUp, onSelect: () => shift(b.item!, -1) },
                    { label: "Move down", icon: ArrowDown, onSelect: () => shift(b.item!, 1) },
                    b.item.visible
                      ? {
                          label: "Hide from the website",
                          icon: EyeOff,
                          onSelect: () =>
                            actions.edit.mutate({
                              id: b.item!.id,
                              body: { ...b.item!, visible: false },
                            }),
                        }
                      : {
                          label: "Show on the website",
                          icon: Eye,
                          onSelect: () =>
                            actions.edit.mutate({
                              id: b.item!.id,
                              body: { ...b.item!, visible: true },
                            }),
                        },
                    {
                      label: "Remove menu item…",
                      hint: "Its pages move to More",
                      icon: Trash2,
                      danger: true,
                      onSelect: () => setDialog({ kind: "remove", item: b.item! }),
                    },
                  ]}
                />
              )}
            </header>

            {b.sub ? (
              <div className="pb-2">
                {b.targets.map((t) => (
                  <div
                    key={t.key}
                    role="group"
                    aria-label={targetName(t)}
                    {...dropZone(t)}
                    className={cn("mx-3 mb-1 rounded-lg py-1 transition-colors", over === t.key && "bg-brand-green/[0.06] shadow-[inset_3px_0_0_#0db02b]")}
                  >
                    <div className="flex flex-wrap items-center gap-x-2 pr-2 pl-9">
                      <h3 className="text-[0.6875rem] font-medium tracking-[0.16em] text-muted uppercase">{t.title}</h3>
                      <span className="flex-1" />
                      {addButtons(t)}
                    </div>
                    {list(t, "pl-9")}
                  </div>
                ))}
              </div>
            ) : (
              <div className={cn("pb-2 transition-colors", over === b.targets[0]!.key && "bg-brand-green/[0.06]")}>{list(b.targets[0]!, "pl-12", b.item)}</div>
            )}
          </section>
        ))}
      </div>

      {dialog?.kind === "group" && (
        <NameDialog
          title="New menu item"
          description="A new dropdown in the website menu. It shows once a live page is inside it."
          placeholder="e.g. Sustainability"
          cta="Create"
          onClose={() => setDialog(null)}
          onSave={(label) =>
            actions.add.mutateAsync({
              label,
              href: null,
              page_id: null,
              visible: true,
              section: null,
              column: null,
              parent_id: null,
            })
          }
        />
      )}
      {dialog?.kind === "rename" && (
        <NameDialog
          title="Rename menu item"
          initial={dialog.item.label}
          cta="Save"
          onClose={() => setDialog(null)}
          onSave={(label) =>
            actions.edit.mutateAsync({
              id: dialog.item.id,
              body: { ...dialog.item, label },
            })
          }
        />
      )}
      {dialog?.kind === "link" && <LinkDialog where={dialog.where} onClose={() => setDialog(null)} />}
      {dialog?.kind === "remove" && (
        <RemoveDialog
          item={dialog.item}
          rows={rowsOf({
            key: `item:${dialog.item.id}`,
            title: dialog.item.label,
          })}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function PageLine({ page, hidden, indent }: { page: CmsPage; hidden: boolean; indent: string }) {
  const s = pageState(page);
  return (
    <Link href={`/cms/pages/${page.id}`} className={cn("relative flex items-center gap-3 py-2 pr-5 transition-colors hover:bg-[#f6faf8] focus-visible:shadow-glow focus-visible:outline-none", indent)}>
      <GripVertical aria-hidden className="absolute left-3 size-4 cursor-grab text-border-strong opacity-0 group-hover/row:opacity-100" />
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT[s.tone])} />
      <span className={cn("min-w-0 flex-1 truncate text-[0.9375rem] text-foreground", hidden && "opacity-50")}>{page.title}</span>
      <span className="hidden text-sm text-muted sm:inline">
        {s.label}
        {hidden && " · hidden"}
      </span>
    </Link>
  );
}

function LinkLine({ link, canManage, indent }: { link: MenuLink; canManage: boolean; indent: string }) {
  const { edit, remove } = useMenuActions();
  return (
    <div className={cn("flex items-center gap-3 py-1.5 pr-5", indent)}>
      <Link2 aria-hidden className="size-4 shrink-0 text-muted" />
      <span className={cn("min-w-0 flex-1 truncate text-[0.9375rem] text-foreground", !link.visible && "opacity-50")}>{link.label}</span>
      <span className="hidden truncate text-sm text-muted sm:inline">Link to {link.href}</span>
      {canManage && (
        <Menu
          trigger={
            <IconButton label={`Options for ${link.label}`} size="sm">
              <Ellipsis aria-hidden />
            </IconButton>
          }
          items={[
            link.visible
              ? {
                  label: "Hide from the website",
                  icon: EyeOff,
                  onSelect: () =>
                    edit.mutate({
                      id: link.id,
                      body: { ...link, visible: false },
                    }),
                }
              : {
                  label: "Show on the website",
                  icon: Eye,
                  onSelect: () =>
                    edit.mutate({
                      id: link.id,
                      body: { ...link, visible: true },
                    }),
                },
            {
              label: "Remove link",
              icon: Trash2,
              danger: true,
              onSelect: () => remove.mutate(link.id),
            },
          ]}
        />
      )}
    </div>
  );
}

function NameDialog({
  title,
  description,
  placeholder,
  initial = "",
  cta,
  onClose,
  onSave,
}: {
  title: string;
  description?: string;
  placeholder?: string;
  initial?: string;
  cta: string;
  onClose: () => void;
  onSave: (label: string) => Promise<unknown>;
}) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await onSave(value.trim());
      toast.success("Menu updated");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={busy} disabled={!value.trim()}>
            {cta}
          </Button>
        </>
      }
    >
      <Field label="Name in the menu">
        <Input autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && value.trim() && void save()} placeholder={placeholder} />
      </Field>
    </Dialog>
  );
}

function LinkDialog({ where, onClose }: { where: Where; onClose: () => void }) {
  const { add } = useMenuActions();
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const submit = async () => {
    try {
      await add.mutateAsync({
        label: label.trim(),
        href: href.trim(),
        page_id: null,
        visible: true,
        ...toParent(where),
      });
      toast.success("Link added to the menu");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Add a link"
      description="For something that isn’t a page here, like a careers portal or a PDF."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={add.isPending} disabled={!label.trim() || !href.trim()}>
            Add link
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name in the menu">
          <Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Careers portal" />
        </Field>
        <Field label="Goes to" hint="A full web address, or a page on this site like /about-us">
          <Input value={href} onChange={(e) => setHref(e.target.value)} placeholder="https://" />
        </Field>
      </div>
    </Dialog>
  );
}

/** Remove one of your menu items. Says exactly what happens to what’s inside: pages go to More (still live), links go. */
function RemoveDialog({ item, rows, onClose }: { item: MenuLink; rows: Row[]; onClose: () => void }) {
  const { remove } = useMenuActions();
  const pages = rows.filter((r) => r.page).map((r) => r.page!.title);
  const links = rows.filter((r) => !r.page && r.link).map((r) => r.link!.label);
  const submit = async () => {
    try {
      await remove.mutateAsync(item.id);
      toast.success(`“${item.label}” removed from the menu`);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Remove “${item.label}”?`}
      description="It comes off the website menu."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button variant="danger" onClick={submit} loading={remove.isPending}>
            Remove menu item
          </Button>
        </>
      }
    >
      {pages.length === 0 && links.length === 0 ? (
        <p className="text-sm text-body">It’s empty, so nothing else changes.</p>
      ) : (
        <div className="flex flex-col gap-3 text-sm text-body">
          {pages.length > 0 && (
            <p>
              <strong className="font-medium text-foreground">
                {pages.length} {pages.length === 1 ? "page moves" : "pages move"} to More
              </strong>{" "}
              and {pages.length === 1 ? "stays" : "stay"} on the website: {pages.join(", ")}. You can move {pages.length === 1 ? "it" : "them"} anywhere later.
            </p>
          )}
          {links.length > 0 && (
            <p>
              <strong className="font-medium text-foreground">
                {links.length} {links.length === 1 ? "link is" : "links are"} removed:
              </strong>{" "}
              {links.join(", ")}.
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
