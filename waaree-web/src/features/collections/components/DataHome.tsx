"use client";

import { Archive, Check, Database, FileSpreadsheet, LayoutTemplate, LoaderCircle, Plus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { readTable, TABLE_FILES } from "@/features/page-builder";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { convert, FIELD_TYPES, guessType, TEMPLATES, typeIcon } from "../fields";
import { type Collection, type FieldInput, type FieldType, useCollections, useStructure } from "../hooks";

const ORIGIN: Record<string, string> = { cms: "Made in the CMS", import: "Made from a file", code: "Set up by developers" };

/**
 * Data: collections of changing content (quarterly results, blog posts, job openings…). Each is
 * a list of rows with the same fields; pages show them with the “Data view” block, always current.
 */
export function DataHome() {
  const [archived, setArchived] = useState(false);
  const list = useCollections(archived);
  const canStructure = useCan("data.structure");
  const [creating, setCreating] = useState(false);
  const all = list.data ?? [];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-tight font-light tracking-tight text-foreground">Data</h1>
          <p className="mt-2 max-w-2xl text-body">Content that changes often, kept as lists: quarterly results, blog posts, job openings. Show any of it on a page with the “Data view” block; the page stays up to date by itself.</p>
        </div>
        {canStructure && (
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden /> New collection
          </Button>
        )}
      </header>

      <div className="mt-8 mb-5 inline-flex rounded-lg bg-surface-muted p-1" role="tablist" aria-label="Show">
        {(
          [
            [false, "Collections"],
            [true, "Archived"],
          ] as const
        ).map(([k, label]) => (
          <button key={label} role="tab" aria-selected={archived === k} onClick={() => setArchived(k)} className={cn("rounded-md px-4 py-1.5 text-sm transition-colors", archived === k ? "bg-white font-medium text-foreground shadow-soft" : "text-body hover:text-foreground")}>
            {label}
          </button>
        ))}
      </div>

      {list.isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-surface-muted" />
      ) : all.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border-strong px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-(image:--brand-tint) text-primary">
            {archived ? <Archive aria-hidden className="size-6" /> : <Database aria-hidden className="size-6" />}
          </span>
          <p className="mt-4 text-lg font-light text-foreground">{archived ? "Nothing archived" : "No collections yet"}</p>
          {!archived && <p className="mt-1 max-w-md text-sm text-body">Start from a ready-made one (like Quarterly results), from scratch, or from an Excel sheet you already have.</p>}
          {!archived && canStructure && (
            <Button className="mt-6" onClick={() => setCreating(true)}>
              <Plus aria-hidden /> New collection
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {all.map((c) => (
            <li key={c.id}>
              <CollectionCard c={c} />
            </li>
          ))}
        </ul>
      )}

      {creating && <NewCollection onClose={() => setCreating(false)} />}
    </div>
  );
}

function CollectionCard({ c }: { c: Collection }) {
  const fields = c.fields.filter((f) => !f.hidden);
  return (
    <Link href={`/cms/data/${c.key}`} className="group flex h-full flex-col rounded-xl border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-green/50 hover:shadow-soft focus-visible:shadow-glow focus-visible:outline-none">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-(image:--brand-tint) text-primary">
          <Database aria-hidden className="size-5" />
        </span>
        {c.approval_required && (
          <span className="flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs text-body">
            <ShieldCheck aria-hidden className="size-3.5 text-primary" /> Needs approval
          </span>
        )}
      </div>
      <p className="mt-4 text-lg font-medium text-foreground">{c.name}</p>
      {c.description && <p className="mt-0.5 line-clamp-2 text-sm text-body">{c.description}</p>}
      <p className="mt-3 flex flex-wrap gap-1">
        {fields.slice(0, 5).map((f) => {
          const Icon = typeIcon(f.type);
          return (
            <span key={f.id} className="flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs text-body">
              <Icon aria-hidden className="size-3 text-muted" /> {f.label}
            </span>
          );
        })}
        {fields.length > 5 && <span className="px-1 text-xs text-muted">+{fields.length - 5} more</span>}
      </p>
      <p className="mt-auto flex items-center gap-3 border-t border-border pt-3 text-sm text-body">
        <span>
          <strong className="font-medium text-foreground">{c.counts.published ?? 0}</strong> live
        </span>
        <span>
          <strong className="font-medium text-foreground">{(c.counts.draft ?? 0) + (c.counts.in_review ?? 0)}</strong> not yet live
        </span>
        <span className="ml-auto text-xs text-muted">{ORIGIN[c.origin] ?? c.origin}</span>
      </p>
    </Link>
  );
}

/* ── New collection: a template, from scratch, or from an Excel/CSV file ─────── */
type Draft = { name: string; description: string; approval: boolean; fields: (FieldInput & { choicesText?: string })[]; items: Record<string, unknown>[]; origin: "cms" | "import" };

function NewCollection({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { create } = useStructure();
  const [start, setStart] = useState<string>("results");
  const [draft, setDraft] = useState<Draft>(() => fromTemplate("results"));
  const [reading, setReading] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  function fromTemplate(key: string): Draft {
    const t = TEMPLATES.find((x) => x.key === key);
    return t
      ? { name: t.name, description: t.description, approval: t.approval, fields: t.fields.map((f) => ({ ...f, required: f.required ?? false, choicesText: (f.options?.choices as string[] | undefined)?.join(", ") })), items: [], origin: "cms" }
      : { name: "", description: "", approval: false, fields: [{ label: "Title", type: "text", required: true }], items: [], origin: "cms" };
  }
  const pick = (key: string) => {
    setStart(key);
    if (key !== "file") setDraft(fromTemplate(key));
    else file.current?.click();
  };
  const readFile = async (f: File) => {
    setReading(true);
    try {
      const t = await readTable(f);
      const [head = [], ...rows] = t.rows;
      if (!head.length || !rows.length) throw new Error("The file needs a header row and at least one row of data.");
      const labels = head.map((h, i) => h.trim() || `Column ${i + 1}`);
      const types = labels.map((_, i) => guessType(rows.map((r) => r[i] ?? "")));
      setDraft({
        name: f.name.replace(/\.(xlsx|csv)$/i, "").replace(/[-_]+/g, " "),
        description: `Made from ${f.name}`,
        approval: false,
        origin: "import",
        fields: labels.map((label, i) => ({ label, type: types[i]!, required: false })),
        items: rows.map((r) => Object.fromEntries(labels.map((l, i) => [l, r[i] ?? ""]))),
      });
      setStart("file");
      if (t.cut) toast.message("The file was large; the first 200 rows were used.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReading(false);
    }
  };

  const setField = (i: number, patch: Partial<Draft["fields"][number]>) => setDraft((d) => ({ ...d, fields: d.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)) }));
  const submit = async () => {
    try {
      const fields = draft.fields
        .filter((f) => f.label.trim())
        .map(({ choicesText, ...f }) => ({ ...f, options: f.type === "choice" ? { choices: (choicesText ?? "").split(",").map((x) => x.trim()).filter(Boolean) } : null }));
      const items = draft.items.map((row) => Object.fromEntries(fields.map((f) => [f.label, convert(f.type, String(row[f.label] ?? ""))])));
      const c = await create.mutateAsync({ name: draft.name.trim(), description: draft.description.trim() || null, approval_required: draft.approval, origin: draft.origin, fields, items });
      toast.success(items.length ? `“${c.name}” created with ${items.length} rows (as drafts)` : `“${c.name}” created`);
      router.push(`/cms/data/${c.key}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const STARTS = [
    ...TEMPLATES.map((t) => ({ key: t.key, label: t.name, hint: t.description, icon: LayoutTemplate })),
    { key: "blank", label: "From scratch", hint: "Choose your own fields", icon: Plus },
    { key: "file", label: "From Excel or CSV", hint: "Columns become fields, rows become rows", icon: FileSpreadsheet },
  ];

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="New collection"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending} disabled={!draft.name.trim() || !draft.fields.some((f) => f.label.trim())}>
            Create collection
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">1. Start from</legend>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Start from">
            {STARTS.map((s) => (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={start === s.key}
                aria-label={s.label}
                onClick={() => pick(s.key)}
                className={cn("relative flex items-start gap-2.5 rounded-lg border-2 p-3 text-left transition-all focus-visible:shadow-glow focus-visible:outline-none", start === s.key ? "border-brand-green bg-brand-green/[0.04]" : "border-border hover:border-border-strong")}
              >
                {s.key === "file" && reading ? <LoaderCircle aria-hidden className="mt-0.5 size-4 shrink-0 animate-spin text-primary" /> : <s.icon aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />}
                <span>
                  <span className="block text-sm font-medium text-foreground">{s.label}</span>
                  <span className="block text-xs text-muted">{s.hint}</span>
                </span>
                {start === s.key && <Check aria-hidden className="absolute top-2 right-2 size-4 text-primary" />}
              </button>
            ))}
          </div>
          <input
            ref={file}
            type="file"
            hidden
            accept={TABLE_FILES}
            aria-label="Excel or CSV file for the new collection"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void readFile(f);
            }}
          />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="2. Name">
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Quarterly results" />
          </Field>
          <Field label="What it’s for (optional)">
            <Input value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">3. Fields {draft.items.length > 0 && <span className="font-normal text-muted">· guessed from your file ({draft.items.length} rows); check the types</span>}</p>
          <div className="flex flex-col gap-2">
            {draft.fields.map((f, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_10rem_auto] items-center gap-2 rounded-lg border border-border p-2">
                <Input aria-label={`Field ${i + 1} name`} value={f.label} onChange={(e) => setField(i, { label: e.target.value })} readOnly={draft.origin === "import"} />
                <Select label={`Field ${i + 1} type`} value={f.type} onValueChange={(v) => setField(i, { type: v as FieldType })} options={FIELD_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
                <label className="flex items-center gap-1.5 px-1 text-sm text-body">
                  <input type="checkbox" checked={!!f.required} onChange={(e) => setField(i, { required: e.target.checked })} className="accent-[#0db02b]" /> Required
                </label>
                {f.type === "choice" && (
                  <Input aria-label={`Field ${i + 1} choices`} className="col-span-3" placeholder="Choices, separated by commas" value={f.choicesText ?? ""} onChange={(e) => setField(i, { choicesText: e.target.value })} />
                )}
              </div>
            ))}
            {draft.origin !== "import" && (
              <button type="button" onClick={() => setDraft((d) => ({ ...d, fields: [...d.fields, { label: "", type: "text", required: false }] }))} className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-3 py-2 text-sm text-primary-strong hover:bg-brand-green/5">
                <Plus aria-hidden className="size-4" /> Add a field
              </button>
            )}
          </div>
        </div>

        <label className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
          <span>
            <span className="block text-sm font-medium text-foreground">Rows need approval before they go live</span>
            <span className="block text-xs text-muted">Like pages: someone else approves. Good for results and other official figures.</span>
          </span>
          <Switch checked={draft.approval} onCheckedChange={(approval) => setDraft((d) => ({ ...d, approval }))} label="Rows need approval" />
        </label>
      </div>
    </Dialog>
  );
}
