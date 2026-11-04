"use client";

import { Ellipsis, ExternalLink, FolderInput, Pencil, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Placement, placeName, useMenu, usePlaceOptions, whereOf, type Where } from "@/features/site";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { type CmsPage, useDeletePage } from "../hooks";
import { DOT, isScheduled, pageState } from "../status";

/** Which status filter a page falls under. A live page with unsent edits still counts as live. */
export type StatusKey = "all" | "live" | "draft" | "waiting" | "changes" | "approved" | "scheduled";
export const statusOf = (p: CmsPage): Exclude<StatusKey, "all"> =>
  p.status === "in_review" ? "waiting" : p.status === "rejected" ? "changes" : p.status === "approved" ? "approved" : p.status === "published" ? (isScheduled(p) ? "scheduled" : "live") : p.has_live ? "live" : "draft";

const STATUS: { key: StatusKey; label: string; always?: boolean }[] = [
  { key: "all", label: "All", always: true },
  { key: "live", label: "Live", always: true },
  { key: "draft", label: "Drafts", always: true },
  { key: "waiting", label: "Waiting for approval", always: true },
  { key: "changes", label: "Needs changes" },
  { key: "approved", label: "Approved" },
  { key: "scheduled", label: "Scheduled" },
];

const DID: Record<string, string> = {
  created: "Created",
  edited: "Edited",
  submitted: "Sent for approval",
  withdrawn: "Taken back",
  approved: "Approved",
  rejected: "Sent back",
  published: "Published",
  scheduled: "Scheduled",
};
const when = (iso: string) => new Date(iso + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/**
 * Every page in one list, like an inbox: filter by status (with counts) or by menu item, or search.
 * Click a row to edit; “⋯” moves it in the menu, opens it on the website, or deletes it.
 */
export function PagesTable({ pages, status, onStatus }: { pages: CmsPage[]; status: StatusKey; onStatus: (s: StatusKey) => void }) {
  const menu = useMenu();
  const places = usePlaceOptions();
  const [where, setWhere] = useState<string>("any");
  const [q, setQ] = useState("");
  const [moving, setMoving] = useState<CmsPage | null>(null);

  const byPage = new Map((menu.data?.items ?? []).filter((i) => i.page_id).map((i) => [i.page_id!, i]));
  const whereOfPage = (p: CmsPage): Where => (byPage.get(p.id) ? whereOf(byPage.get(p.id)!) : "none");
  const groups = (menu.data?.items ?? []).filter((i) => !i.section && !i.parent_id && !i.page_id);
  const placeLabel = (w: Where) => placeName(w, groups);
  // a whole section ("section:Company") matches every sub-menu in it
  const inPlace = (w: Where) => where === "any" || w === where || (where.startsWith("section:") && !where.includes("/") && w.startsWith(`${where}/`));
  const menuOptions = [
    { value: "any", label: "Any menu item" },
    ...(menu.data?.sections ?? []).flatMap((s) => [
      { value: `section:${s}`, label: `In ${s} (any part)` },
      ...(menu.data?.columns?.[s] ?? []).map((c) => ({ value: `section:${s}/${c}`, label: `In ${s} › ${c}` })),
    ]),
    ...places.filter((o) => o.value.startsWith("item:")).map((o) => ({ value: o.value, label: `In ${o.label}` })),
    { value: "none", label: "In More" },
  ];

  const count = (k: StatusKey) => (k === "all" ? pages.length : pages.filter((p) => statusOf(p) === k).length);
  const term = q.trim().toLowerCase();
  const shown = pages.filter(
    (p) => (status === "all" || statusOf(p) === status) && inPlace(whereOfPage(p)) && (!term || p.title.toLowerCase().includes(term) || p.slug.includes(term)),
  );
  const filtered = status !== "all" || where !== "any" || !!term;

  return (
    <div>
      {/* filters */}
      <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Show">
        {STATUS.filter((s) => s.always || count(s.key) > 0 || status === s.key).map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={status === s.key}
            onClick={() => onStatus(s.key)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:shadow-glow focus-visible:outline-none",
              status === s.key ? "border-brand-green bg-brand-green/[0.08] font-medium text-primary-strong" : "border-border text-body hover:border-border-strong hover:text-foreground",
            )}
          >
            {s.label}
            <span className={cn("text-xs tabular-nums", status === s.key ? "text-primary-strong/70" : "text-muted")}>{count(s.key)}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-72">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages" aria-label="Search pages" className="pl-9" />
        </label>
        <Select
          label="Menu item"
          value={where}
          onValueChange={setWhere}
          className="w-full sm:w-60"
          options={menuOptions}
        />
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onStatus("all");
              setWhere("any");
              setQ("");
            }}
          >
            <X aria-hidden /> Clear filters
          </Button>
        )}
      </div>

      {/* the list */}
      <div className="mt-5 overflow-hidden rounded-xl border border-border bg-white">
        <div className="hidden grid-cols-[minmax(0,1fr)_12rem_10rem_12rem_2.5rem] gap-4 border-b border-border bg-surface-muted px-5 py-2.5 text-xs font-medium text-muted md:grid">
          <span>Page</span>
          <span>Status</span>
          <span>In the menu</span>
          <span>Last change</span>
          <span />
        </div>
        {shown.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">{pages.length === 0 ? "No pages yet. Create the first one with “New page”." : "No pages match these filters."}</p>
        ) : (
          <ul>
            {shown.map((p) => (
              <Row key={p.id} p={p} place={placeLabel(whereOfPage(p))} onMove={() => setMoving(p)} />
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">
        Showing {shown.length} of {pages.length} {pages.length === 1 ? "page" : "pages"}
      </p>

      <Dialog
        open={!!moving}
        onOpenChange={(o) => !o && setMoving(null)}
        title="Move in the menu"
        description={moving ? `Where should “${moving.title}” show in the website menu?` : undefined}
        footer={<Button onClick={() => setMoving(null)}>Done</Button>}
      >
        {moving && <Placement pageId={moving.id} />}
      </Dialog>
    </div>
  );
}

function Row({ p, place, onMove }: { p: CmsPage; place: string; onMove: () => void }) {
  const router = useRouter();
  const canEdit = useCan("pages.edit");
  const del = useDeletePage();
  const s = pageState(p);
  const last = p.events.at(-1);
  const live = statusOf(p) === "live";
  return (
    <li className="group relative grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-x-4 gap-y-1 border-b border-border px-5 py-3.5 transition-colors last:border-0 hover:bg-[#f6faf8] md:grid-cols-[minmax(0,1fr)_12rem_10rem_12rem_2.5rem]">
      <Link href={`/cms/pages/${p.id}`} className="min-w-0 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:shadow-glow">
        <span className="block truncate font-medium text-foreground">{p.title}</span>
        <span className="block truncate text-xs text-muted">waaree.com/{p.slug}</span>
      </Link>
      <span className="col-start-1 flex items-center gap-2 text-sm text-body md:col-start-auto">
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT[s.tone])} />
        <span className="truncate">{s.label}</span>
        <span className="text-muted md:hidden">· {place}</span>
      </span>
      <span className={cn("hidden truncate text-sm md:block", place === "More" ? "text-muted" : "text-body")}>{place}</span>
      <span className="hidden min-w-0 text-sm md:block">
        {last && (
          <>
            <span className="block truncate text-body">
              {DID[last.action] ?? last.action} by {last.actor_name}
            </span>
            <span className="block text-xs text-muted">{when(last.at)}</span>
          </>
        )}
      </span>
      <span className="relative z-10 col-start-2 row-span-2 row-start-1 justify-self-end md:col-start-auto md:row-span-1 md:row-start-auto">
        <Menu
          trigger={
            <IconButton label={`Options for ${p.title}`} size="sm">
              <Ellipsis aria-hidden />
            </IconButton>
          }
          items={[
            { label: "Edit", icon: Pencil, onSelect: () => router.push(`/cms/pages/${p.id}`) },
            ...(canEdit ? [{ label: "Move in the menu…", icon: FolderInput, onSelect: onMove }] : []),
            ...(live ? [{ label: "View on website", icon: ExternalLink, onSelect: () => window.open(`/${p.slug}`, "_blank") }] : []),
            ...(canEdit
              ? [
                  {
                    label: "Delete",
                    icon: Trash2,
                    danger: true,
                    onSelect: async () => {
                      if (!confirm(`Delete “${p.title}”?${p.has_live ? " It comes off the website." : ""}`)) return;
                      try {
                        await del.mutateAsync(p.id);
                        toast.success("Page deleted");
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    },
                  },
                ]
              : []),
          ]}
        />
      </span>
    </li>
  );
}
