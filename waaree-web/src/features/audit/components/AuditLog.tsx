"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, unwrap } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

const ACTIONS = ["created", "edited", "submitted", "approved", "rejected", "published"] as const;
const TONE: Record<string, string> = {
  approved: "bg-info/10 text-info",
  rejected: "bg-danger/10 text-danger",
  published: "bg-primary/10 text-primary-strong",
  submitted: "bg-warning/10 text-warning",
};

const fmt = (iso: string) => new Date(iso + "Z").toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** Read-only audit log: who did what, when; filter, search and export to CSV. */
export function AuditLog() {
  const [action, setAction] = useState<string>("");
  const [q, setQ] = useState("");
  const query = useDeferredValue(q);
  const log = useQuery({
    queryKey: ["audit", action, query],
    queryFn: async () => unwrap(await api.GET("/audit", { params: { query: { action: action || undefined, q: query || undefined } } })),
  });
  const rows = log.data ?? [];

  const exportCsv = () => {
    const esc = (v: string | number | null) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const lines = [["When (UTC)", "Who", "Action", "Page", "URL", "Comment"].map(esc).join(",")];
    for (const r of rows) lines.push([r.at, r.actor_name, r.action, r.target_title, `/${r.target_slug}`, r.comment].map(esc).join(","));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `waaree-audit-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-tight font-light tracking-tight text-foreground">Activity</h1>
          <p className="mt-2 max-w-xl text-body">Everything that happened to the website’s pages: who did it, and when. Nobody can change this record.</p>
        </div>
        <Button variant="secondary" onClick={exportCsv} disabled={!rows.length}>
          <Download aria-hidden /> Export CSV
        </Button>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted" />
          <Input aria-label="Search the log" placeholder="Search person, page or comment" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by action">
          {["", ...ACTIONS].map((a) => (
            <button
              key={a || "all"}
              type="button"
              aria-pressed={action === a}
              onClick={() => setAction(a)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm capitalize transition-colors focus-visible:shadow-glow focus-visible:outline-none",
                action === a ? "border-foreground/15 bg-foreground/[0.04] font-medium text-foreground" : "border-border text-body hover:text-foreground",
              )}
            >
              {a || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-[#f7fbf9] text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-medium">When</th>
              <th className="px-5 py-3 font-medium">Who</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Page</th>
              <th className="px-5 py-3 font-medium">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {log.isLoading ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted">
                  Nothing matches.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-[#f7fbf9]">
                  <td className="px-5 py-3 whitespace-nowrap text-muted tabular-nums">{fmt(r.at)}</td>
                  <td className="px-5 py-3 text-foreground">{r.actor_name}</td>
                  <td className="px-5 py-3">
                    <span className={cn("rounded-sm px-2 py-0.5 text-xs font-medium capitalize", TONE[r.action] ?? "bg-surface-muted text-body")}>{r.action}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/cms/pages/${r.target_id}`} className="text-foreground hover:text-primary-strong hover:underline">
                      {r.target_title}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 text-body">{r.comment ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Showing the latest {rows.length} entries.</p>
    </div>
  );
}
