"use client";

import { useQuery } from "@tanstack/react-query";
import { CornerDownLeft, FileText, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog as RDialog } from "radix-ui";
import { useEffect, useMemo, useState } from "react";

import { api, unwrap } from "@/lib/api/client";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import type { NavItem } from "../nav-types";

type Hit = { key: string; label: string; sub: string; href: string; icon: NavItem["icon"] };

/**
 * Smart search for the CMS (Ctrl K / ⌘ K): jump to any screen or any page by title or URL.
 * Arrow keys move, Enter opens, Esc closes.
 */
export function CommandPalette({ items, open, onOpenChange }: { items: NavItem[]; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const canPages = useCan("pages.view");
  const [q, setQ] = useState("");
  const [at, setAt] = useState(0);
  const pages = useQuery({
    queryKey: ["pages"],
    queryFn: async () => unwrap(await api.GET("/pages")),
    enabled: open && canPages,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    const screens: Hit[] = items.map((i) => ({ key: i.href, label: i.label, sub: "Screen", href: i.href, icon: i.icon }));
    const pageHits: Hit[] = (pages.data ?? []).map((p) => ({ key: `p${p.id}`, label: p.title, sub: `Page · /${p.slug} · ${p.status.replace("_", " ")}`, href: `/cms/pages/${p.id}`, icon: FileText }));
    const all = [...screens, ...pageHits];
    return term ? all.filter((h) => `${h.label} ${h.sub}`.toLowerCase().includes(term)).slice(0, 12) : all.slice(0, 10);
  }, [q, items, pages.data]);

  const go = (h: Hit | undefined) => {
    if (!h) return;
    onOpenChange(false);
    setQ("");
    router.push(h.href);
  };

  return (
    <RDialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setQ("");
      }}
    >
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-[60] animate-fade-in bg-[rgb(10_20_16/0.25)] backdrop-blur-sm" />
        <RDialog.Content
          aria-describedby={undefined}
          className="fixed top-[14vh] left-1/2 z-[60] w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 animate-dialog-in overflow-hidden rounded-xl border border-border bg-white shadow-lg focus:outline-none"
        >
          <RDialog.Title className="sr-only">Search the CMS</RDialog.Title>
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search aria-hidden className="size-4 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setAt(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setAt((a) => Math.min(a + 1, hits.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setAt((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter") {
                  go(hits[at]);
                }
              }}
              placeholder="Search pages and screens…"
              aria-label="Search pages and screens"
              className="h-14 flex-1 bg-transparent text-[0.9375rem] text-foreground outline-none placeholder:text-muted"
            />
            <kbd className="rounded-sm border border-border px-1.5 py-0.5 text-[0.6875rem] text-muted">Esc</kbd>
          </div>
          <ul role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2">
            {hits.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">No matches for “{q}”.</li>
            ) : (
              hits.map((h, i) => (
                <li key={h.key} role="option" aria-selected={i === at}>
                  <button
                    type="button"
                    onMouseEnter={() => setAt(i)}
                    onClick={() => go(h)}
                    className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left", i === at ? "bg-[#f3f8f5]" : "")}
                  >
                    <h.icon aria-hidden className={cn("size-4 shrink-0", i === at ? "text-primary" : "text-muted")} strokeWidth={1.75} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{h.label}</span>
                      <span className="block truncate text-xs text-muted">{h.sub}</span>
                    </span>
                    {i === at && <CornerDownLeft aria-hidden className="size-3.5 text-muted" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
