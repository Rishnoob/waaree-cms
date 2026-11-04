"use client";

import { Download, FileText, Film, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { UploadZone, useMedia } from "@/features/media";
import { cn } from "@/lib/utils/cn";

/**
 * Documents block: annual reports, presentations, policies, videos. Files come from the media
 * library; each has a title, a year and an optional “New” badge. A page with this block is a
 * content shelf (e.g. Investors → Annual reports), so there’s no separate content screen to learn.
 */
export type DocItem = { title: string; url: string; kind: "pdf" | "video" | "file"; year: string; isNew: boolean };

export const parseDocs = (json: string): DocItem[] => {
  try {
    const v = JSON.parse(json) as DocItem[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const kindOf = (contentType: string): DocItem["kind"] => (contentType === "application/pdf" ? "pdf" : contentType.startsWith("video/") ? "video" : "file");

export function RenderDocuments({ title, items }: { title: string; items: string }) {
  const docs = parseDocs(items);
  const years = [...new Set(docs.map((d) => d.year).filter(Boolean))].sort().reverse();
  const [year, setYear] = useState<string>("");
  const shown = docs.filter((d) => !year || d.year === year);
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        {title && <h2 className="text-2xl font-light tracking-tight text-foreground @xl:text-3xl">{title}</h2>}
        {years.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by year">
            {["", ...years].map((y) => (
              <button
                key={y || "all"}
                type="button"
                aria-pressed={year === y}
                onClick={() => setYear(y)}
                className={cn("rounded-md border px-3 py-1 text-sm", year === y ? "border-foreground/15 bg-foreground/[0.04] font-medium text-foreground" : "border-border text-body")}
              >
                {y || "All years"}
              </button>
            ))}
          </div>
        )}
      </div>
      {shown.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No documents yet.</p>
      ) : (
        <ul className="mt-6 grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
          {shown.map((d, i) => {
            const Icon = d.kind === "video" ? Film : FileText;
            return (
              <li key={i}>
                <a href={d.url} target="_blank" rel="noreferrer" className="group flex h-full items-start gap-4 rounded-lg border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-green/40 hover:shadow-soft">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-(image:--brand-tint) text-primary">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary-strong">{d.title}</span>
                      {d.isNew && <span className="rounded-sm bg-(image:--brand-gradient) px-1.5 py-0.5 text-[0.625rem] font-semibold text-white">NEW</span>}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted uppercase">
                      {d.kind === "pdf" ? "PDF" : d.kind === "video" ? "Video" : "File"}
                      {d.year && ` · ${d.year}`}
                    </span>
                  </span>
                  <Download aria-hidden className="mt-1 size-4 shrink-0 text-muted group-hover:text-primary" />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** Editing: rows (title, year, New, remove) and “add from the media library”. */
export function DocumentsSettings({ title, items, onChange }: { title: string; items: string; onChange: (props: Record<string, string>) => void }) {
  const docs = parseDocs(items);
  const media = useMedia();
  const files = (media.data ?? []).filter((f) => !f.content_type.startsWith("image/"));
  const [picking, setPicking] = useState(false);
  const save = (next: DocItem[]) => onChange({ items: JSON.stringify(next) });
  const update = (i: number, patch: Partial<DocItem>) => save(docs.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const add = (f: { url: string; original_name: string; content_type: string }) => {
    save([...docs, { title: f.original_name.replace(/\.[a-z0-9]+$/i, ""), url: f.url, kind: kindOf(f.content_type), year: String(new Date().getFullYear()), isNew: true }]);
    setPicking(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Section title</span>
        <Input value={title} onChange={(e) => onChange({ title: e.target.value })} />
      </label>
      <ul className="flex flex-col gap-2">
        {docs.map((d, i) => (
          <li key={i} className="rounded-md border border-border p-2.5">
            <Input aria-label="Document title" value={d.title} onChange={(e) => update(i, { title: e.target.value })} />
            <div className="mt-2 flex items-center gap-2">
              <Input aria-label="Year" value={d.year} onChange={(e) => update(i, { year: e.target.value })} className="w-24" />
              <label className="flex items-center gap-1.5 text-sm text-body">
                <input type="checkbox" checked={d.isNew} onChange={(e) => update(i, { isNew: e.target.checked })} className="accent-[#0db02b]" /> New
              </label>
              <span className="flex-1" />
              <IconButton label={`Remove ${d.title}`} size="sm" onClick={() => save(docs.filter((_, j) => j !== i))}>
                <Trash2 aria-hidden />
              </IconButton>
            </div>
          </li>
        ))}
      </ul>
      {picking ? (
        <div className="flex flex-col gap-2 rounded-md border border-border p-2.5">
          <UploadZone onUploaded={(f) => !f.content_type.startsWith("image/") && add(f)} />
          {files.map((f) => (
            <button key={f.id} type="button" onClick={() => add(f)} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-brand-green/5">
              {f.content_type.startsWith("video/") ? <Film aria-hidden className="size-4 text-primary" /> : <FileText aria-hidden className="size-4 text-primary" />}
              <span className="truncate">{f.original_name}</span>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" onClick={() => setPicking(true)} className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-3 py-2 text-sm text-primary-strong hover:bg-brand-green/5">
          <Plus aria-hidden className="size-4" /> Add a document or video
        </button>
      )}
    </div>
  );
}
