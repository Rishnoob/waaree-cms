"use client";

import { ArrowRight, FilePlus2, List, PanelsTopLeft } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { Where } from "@/features/site";
import { useCan, useSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { usePages } from "../hooks";
import { MenuOutline } from "./MenuOutline";
import { NewPageDialog } from "./NewPageDialog";
import { PagesTable, type StatusKey } from "./PagesTable";

/**
 * The CMS home. Two views of the same pages:
 * - **All pages**: one list with filters (status, menu item) and search. This is where you work.
 * - **Website menu**: the menu as an outline, to see and change where pages appear.
 * A one-line notice says when something is waiting on you, and shows those pages in one click.
 */
export function PagesScreen() {
  const pages = usePages();
  const canEdit = useCan("pages.edit");
  const canApprove = useCan("pages.approve");
  const session = useSession();
  const me = session.status === "authenticated" ? session.user : null;
  const [view, setView] = useState<"list" | "menu">("list");
  const [status, setStatus] = useState<StatusKey>("all");
  const [creating, setCreating] = useState<Where | null>(() => (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("new") ? "none" : null));

  const all = pages.data ?? [];
  const toReview = canApprove ? all.filter((p) => p.status === "in_review" && p.submitted_by !== me?.id).length : 0;
  const toPublish = canApprove ? all.filter((p) => p.status === "approved").length : 0;
  const toFix = all.filter((p) => p.status === "rejected" && (p.created_by === me?.id || p.submitted_by === me?.id)).length;
  const notices = [
    toReview && { text: `${toReview} ${toReview === 1 ? "page is" : "pages are"} waiting for your approval`, key: "waiting" as const },
    toPublish && { text: `${toPublish} approved ${toPublish === 1 ? "page is" : "pages are"} ready to publish`, key: "approved" as const },
    toFix && { text: `${toFix} of your pages ${toFix === 1 ? "needs" : "need"} changes`, key: "changes" as const },
  ].filter(Boolean) as { text: string; key: StatusKey }[];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-tight font-light tracking-tight text-foreground">Pages</h1>
          <p className="mt-2 text-body">Create, edit and publish the website’s pages.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setCreating("none")}>
            <FilePlus2 aria-hidden /> New page
          </Button>
        )}
      </header>

      {notices.length > 0 && (
        <div role="status" aria-label="Needs you" className="mt-6 flex flex-col divide-y divide-[#f3e3c3] overflow-hidden rounded-lg border border-[#f5d9a8] bg-[#fffaf0]">
          {notices.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => {
                setView("list");
                setStatus(n.key);
              }}
              className="group flex items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-[#fff3dc] focus-visible:shadow-glow focus-visible:outline-none"
            >
              <span aria-hidden className="size-2 rounded-full bg-[#f59e0b]" />
              <span className="flex-1">{n.text}</span>
              <span className="flex items-center gap-1 font-medium text-primary-strong">
                Show them <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 mb-5 inline-flex rounded-lg bg-surface-muted p-1" role="tablist" aria-label="View">
        {(
          [
            ["list", "All pages", List],
            ["menu", "Website menu", PanelsTopLeft],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            role="tab"
            aria-selected={view === k}
            onClick={() => setView(k)}
            className={cn(
              "flex items-center gap-2 rounded-md px-4 py-1.5 text-sm transition-colors focus-visible:shadow-glow focus-visible:outline-none",
              view === k ? "bg-white font-medium text-foreground shadow-soft" : "text-body hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" /> {label}
          </button>
        ))}
      </div>

      {pages.isLoading ? (
        <div className="h-72 animate-pulse rounded-xl bg-surface-muted" />
      ) : view === "list" ? (
        <PagesTable pages={all} status={status} onStatus={setStatus} />
      ) : (
        <MenuOutline pages={all} onAddPage={setCreating} />
      )}

      {creating !== null && <NewPageDialog open onOpenChange={(o) => !o && setCreating(null)} where={creating} />}
    </div>
  );
}
