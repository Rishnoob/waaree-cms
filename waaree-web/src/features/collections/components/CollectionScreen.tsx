"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Database, Download, Eye, EyeOff, FileSpreadsheet, History, LoaderCircle, Pencil, Plus, RotateCcw, Search, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field as FormField } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { readTable, TABLE_FILES } from "@/features/page-builder";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { convert, FIELD_TYPES, ShowValue, typeIcon, typeLabel } from "../fields";
import { type Collection, type Field, type FieldType, type Item, useCollection, useItems, useRows, useStructure, useUsage } from "../hooks";
import { RowDrawer, rowState } from "./RowDrawer";

/** One collection: its rows (a spreadsheet-like list), its fields, its settings, and Trash. */
export function CollectionScreen({ collectionKey }: { collectionKey: string }) {
  const c = useCollection(collectionKey);
  const [tab, setTab] = useState<"rows" | "fields" | "settings" | "trash">("rows");
  if (c.isLoading) return <div className="h-64 animate-pulse rounded-xl bg-surface-muted" />;
  if (!c.data) return <p className="text-foreground">This collection doesn’t exist.</p>;
  const col = c.data;
  return (
    <div>
      <Link href="/cms/data" className="inline-flex items-center gap-1.5 text-sm text-body hover:text-foreground">
        <ArrowLeft aria-hidden className="size-4" /> All data
      </Link>
      <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl leading-tight font-light tracking-tight text-foreground">
            {col.name}
            {col.archived && <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-sm text-body">Archived</span>}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-body">
            {col.description && <span>{col.description}</span>}
            {col.approval_required && (
              <span className="flex items-center gap-1">
                <ShieldCheck aria-hidden className="size-4 text-primary" /> Rows need approval
              </span>
            )}
          </p>
        </div>
      </header>

      <div className="mt-6 mb-5 flex gap-1 border-b border-border" role="tablist" aria-label="Collection">
        {(
          [
            ["rows", `Rows · ${(col.counts.published ?? 0) + (col.counts.draft ?? 0) + (col.counts.in_review ?? 0)}`],
            ["fields", `Fields · ${col.fields.filter((f) => !f.hidden).length}`],
            ["settings", "Settings"],
            ["trash", `Trash · ${col.counts.trash ?? 0}`],
          ] as const
        ).map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors", tab === k ? "border-brand-green font-medium text-foreground" : "border-transparent text-body hover:text-foreground")}>
            {label}
          </button>
        ))}
      </div>

      {tab === "rows" && <Rows c={col} />}
      {tab === "fields" && <Fields c={col} />}
      {tab === "settings" && <Settings c={col} />}
      {tab === "trash" && <TrashList c={col} />}
    </div>
  );
}

/* ── Rows ─────────────────────────────────────────────────────────────────── */
function Rows({ c }: { c: Collection }) {
  const items = useItems(c.key);
  const rows = useRows(c.key);
  const canEdit = useCan("data.edit");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Item | "new" | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const fields = c.fields.filter((f) => !f.hidden);
  const shown = fields.slice(0, 6);
  const term = q.trim().toLowerCase();
  const list = (items.data ?? []).filter((i) => !term || Object.values(i.data).some((v) => String(v).toLowerCase().includes(term)));

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Status", ...fields.map((f) => f.label)].map(esc).join(","), ...(items.data ?? []).map((i) => [rowState(i, c).label, ...fields.map((f) => i.data[f.key])].map(esc).join(","))];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([`﻿${lines.join("\n")}`], { type: "text/csv" }));
    a.download = `${c.key}.csv`;
    a.click();
  };
  const importFile = async (f: File) => {
    setImporting(true);
    try {
      const t = await readTable(f);
      const [head = [], ...data] = t.rows;
      const match = head.map((h) => fields.find((x) => x.label.toLowerCase() === h.trim().toLowerCase() || x.key === h.trim().toLowerCase()));
      if (!match.some(Boolean)) throw new Error(`None of the columns in ${f.name} match this collection’s fields (${fields.map((x) => x.label).join(", ")}).`);
      const out = data.map((r) => Object.fromEntries(match.flatMap((fld, i) => (fld ? [[fld.key, convert(fld.type as FieldType, r[i] ?? "")]] : []))));
      await rows.importRows.mutateAsync(out);
      const skipped = head.filter((_, i) => !match[i]);
      toast.success(`Added ${out.length} rows as drafts${skipped.length ? `. Columns not used: ${skipped.join(", ")}` : ""}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:w-72">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search rows" aria-label="Search rows" className="pl-9" />
        </label>
        <span className="flex-1" />
        <Button variant="ghost" onClick={exportCsv} disabled={!items.data?.length}>
          <Download aria-hidden /> Export
        </Button>
        {canEdit && !c.archived && (
          <>
            <input ref={file} type="file" hidden accept={TABLE_FILES} aria-label="Excel or CSV rows to add" onChange={(e) => (e.target.files?.[0] && void importFile(e.target.files[0]), (e.target.value = ""))} />
            <Button variant="secondary" onClick={() => file.current?.click()} loading={importing}>
              <FileSpreadsheet aria-hidden /> Add from Excel
            </Button>
            <Button onClick={() => setOpen("new")}>
              <Plus aria-hidden /> Add a row
            </Button>
          </>
        )}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead className="bg-surface-muted text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Status</th>
              {shown.map((f) => (
                <th key={f.id} className="px-4 py-2.5 font-medium">
                  {f.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.isLoading && (
              <tr>
                <td colSpan={shown.length + 1} className="px-4 py-10 text-center text-muted">
                  <LoaderCircle aria-hidden className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            )}
            {!items.isLoading && list.length === 0 && (
              <tr>
                <td colSpan={shown.length + 1} className="px-4 py-12 text-center text-muted">
                  {term ? "No rows match." : "No rows yet. Add one, or add many from an Excel sheet."}
                </td>
              </tr>
            )}
            {list.map((i) => {
              const s = rowState(i, c);
              return (
                <tr key={i.id} tabIndex={0} onClick={() => setOpen(i)} onKeyDown={(e) => e.key === "Enter" && setOpen(i)} className="cursor-pointer border-t border-border transition-colors hover:bg-[#f6faf8] focus-visible:bg-[#f6faf8] focus-visible:outline-none">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-2 text-body">
                      <span aria-hidden className={cn("size-2 rounded-full", s.dot)} /> {s.label}
                    </span>
                  </td>
                  {shown.map((f) => (
                    <td key={f.id} className="max-w-64 truncate px-4 py-3 text-foreground">
                      <ShowValue field={f} value={i.data[f.key]} compact />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {fields.length > shown.length && <p className="mt-2 text-xs text-muted">Showing the first {shown.length} fields. Open a row to see all of them.</p>}

      {open && <RowDrawer c={c} item={open === "new" ? null : open} onClose={() => setOpen(null)} />}
    </div>
  );
}

/* ── Fields (never deleted: hidden, data kept) ───────────────────────────── */
function Fields({ c }: { c: Collection }) {
  const can = useCan("data.structure");
  const s = useStructure(c.key);
  const [editing, setEditing] = useState<Field | "new" | null>(null);
  const move = (i: number, d: -1 | 1) => {
    const ids = c.fields.map((f) => f.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
    s.order.mutate(ids);
  };
  const toggle = async (f: Field) => {
    try {
      await s.editField.mutateAsync({ id: f.id, body: { label: f.label, required: f.required, options: f.options, hidden: !f.hidden } });
      toast.success(f.hidden ? `“${f.label}” is back` : `“${f.label}” hidden. Its data is kept; show it again any time.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-body">Fields are the columns of every row. Removing one only hides it: the data stays and it can be shown again. Nothing here deletes data.</p>
        {can && (
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden /> Add a field
          </Button>
        )}
      </div>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
        {c.fields.map((f, i) => {
          const Icon = typeIcon(f.type);
          return (
            <li key={f.id} className={cn("flex items-center gap-3 px-4 py-3", f.hidden && "bg-surface-muted/60")}>
              <span className="flex size-8 items-center justify-center rounded-md bg-surface-muted text-muted">
                <Icon aria-hidden className="size-4" />
              </span>
              <span className={cn("min-w-0 flex-1", f.hidden && "opacity-60")}>
                <span className="block font-medium text-foreground">
                  {f.label}
                  {f.required && <span className="ml-1 text-danger">*</span>}
                </span>
                <span className="block text-xs text-muted">
                  {typeLabel(f.type)}
                  {f.type === "choice" && ` · ${((f.options.choices as string[] | undefined) ?? []).join(", ")}`}
                  {f.hidden && " · hidden (data kept)"}
                </span>
              </span>
              {can && (
                <span className="flex">
                  <IconButton label={`Move ${f.label} up`} size="sm" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp aria-hidden />
                  </IconButton>
                  <IconButton label={`Move ${f.label} down`} size="sm" disabled={i === c.fields.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown aria-hidden />
                  </IconButton>
                  <IconButton label={`Edit ${f.label}`} size="sm" onClick={() => setEditing(f)}>
                    <Pencil aria-hidden />
                  </IconButton>
                  <IconButton label={f.hidden ? `Show ${f.label}` : `Hide ${f.label}`} size="sm" onClick={() => void toggle(f)}>
                    {f.hidden ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
                  </IconButton>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {editing && <FieldDialog c={c} field={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function FieldDialog({ c, field, onClose }: { c: Collection; field: Field | null; onClose: () => void }) {
  const s = useStructure(c.key);
  const [label, setLabel] = useState(field?.label ?? "");
  const [type, setType] = useState<FieldType>((field?.type as FieldType) ?? "text");
  const [required, setRequired] = useState(field?.required ?? false);
  const [choices, setChoices] = useState(((field?.options.choices as string[] | undefined) ?? []).join(", "));
  const options = type === "choice" ? { choices: choices.split(",").map((x) => x.trim()).filter(Boolean) } : null;
  const save = async () => {
    try {
      if (field) await s.editField.mutateAsync({ id: field.id, body: { label: label.trim(), required, options, hidden: field.hidden } });
      else await s.addField.mutateAsync({ label: label.trim(), type, required, options });
      toast.success(field ? "Field updated" : "Field added");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={field ? `Edit “${field.label}”` : "Add a field"}
      description={field ? "The type can’t change once rows exist; add a new field instead." : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={s.addField.isPending || s.editField.isPending} disabled={!label.trim() || (type === "choice" && !options?.choices.length)}>
            {field ? "Save" : "Add field"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Name">
          <Input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Revenue (₹ crore)" />
        </FormField>
        {!field && (
          <FormField label="Type">
            <Select value={type} onValueChange={(v) => setType(v as FieldType)} options={FIELD_TYPES.map((t) => ({ value: t.value, label: `${t.label} · ${t.hint}` }))} />
          </FormField>
        )}
        {type === "choice" && (
          <FormField label="Choices" hint={field ? "You can add choices; existing ones stay, so old rows remain valid." : "Separated by commas"}>
            <Input value={choices} onChange={(e) => setChoices(e.target.value)} placeholder="Q1, Q2, Q3, Q4" />
          </FormField>
        )}
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-foreground">Required before a row can go live</span>
          <Switch checked={required} onCheckedChange={setRequired} label="Required" />
        </label>
      </div>
    </Dialog>
  );
}

/* ── Settings ─────────────────────────────────────────────────────────────── */
function Settings({ c }: { c: Collection }) {
  const can = useCan("data.structure");
  const s = useStructure(c.key);
  const usage = useUsage(c.key);
  const [name, setName] = useState(c.name);
  const [description, setDescription] = useState(c.description ?? "");
  const [approval, setApproval] = useState(c.approval_required);
  const save = async () => {
    try {
      await s.edit.mutateAsync({ name: name.trim(), description: description.trim() || null, approval_required: approval });
      toast.success("Settings saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const pages = usage.data ?? [];
  return (
    <div className="grid max-w-3xl gap-6">
      <section className="rounded-xl border border-border bg-white p-5">
        <div className="grid gap-4">
          <FormField label="Name">
            <Input value={name} disabled={!can} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="What it’s for">
            <Input value={description} disabled={!can} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-medium text-foreground">Rows need approval before they go live</span>
              <span className="block text-xs text-muted">Someone with approval rights publishes what others send.</span>
            </span>
            <Switch checked={approval} disabled={!can} onCheckedChange={setApproval} label="Rows need approval" />
          </label>
          <p className="text-xs text-muted">
            Pages refer to it as <code className="rounded-sm bg-surface-muted px-1">{c.key}</code>. This never changes, so renaming is safe.
          </p>
          {can && (
            <div>
              <Button onClick={save} loading={s.edit.isPending}>
                Save settings
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-medium text-foreground">Where it’s used</h2>
        {pages.length ? (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {pages.map((p) => (
              <li key={String(p.id)}>
                <Link href={`/cms/pages/${String(p.id)}`} className="text-primary-strong hover:underline">
                  {String(p.title)}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted">No page shows this collection yet. Add a “Data view” section to a page to show it.</p>
        )}
      </section>

      {can && (
        <section className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-medium text-foreground">{c.archived ? "Bring it back" : "Archive"}</h2>
          <p className="mt-1 text-sm text-body">{c.archived ? "Archived collections keep all their rows. Bring it back to use it again." : "Archiving takes it out of use but keeps every row; you can bring it back any time. Nothing is deleted."}</p>
          {c.archived ? (
            <Button variant="secondary" className="mt-3" onClick={() => s.unarchive.mutate()}>
              <RotateCcw aria-hidden /> Bring back
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="mt-3"
              disabled={pages.length > 0}
              onClick={async () => {
                try {
                  await s.archive.mutateAsync();
                  toast.success(`“${c.name}” archived. Nothing was deleted.`);
                } catch (e) {
                  toast.error((e as Error).message);
                }
              }}
            >
              Archive collection
            </Button>
          )}
          {!c.archived && pages.length > 0 && <p className="mt-2 text-xs text-muted">It’s used on {pages.length === 1 ? "a page" : `${pages.length} pages`}; remove it from them first.</p>}
        </section>
      )}
    </div>
  );
}

/* ── Trash ────────────────────────────────────────────────────────────────── */
function TrashList({ c }: { c: Collection }) {
  const items = useItems(c.key, true);
  const rows = useRows(c.key);
  const canEdit = useCan("data.edit");
  const first = c.fields.find((f) => !f.hidden);
  return (
    <div>
      <p className="text-sm text-body">Rows moved to Trash stay here and can be brought back. They aren’t on the website.</p>
      <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
        {(items.data ?? []).length === 0 && (
          <li className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-muted">
            <Trash2 aria-hidden className="size-5" /> Trash is empty.
          </li>
        )}
        {(items.data ?? []).map((i) => (
          <li key={i.id} className="flex items-center gap-3 px-4 py-3">
            <Database aria-hidden className="size-4 text-muted" />
            <span className="min-w-0 flex-1 truncate text-foreground">{first ? <ShowValue field={first} value={i.data[first.key]} compact /> : `Row ${i.id}`}</span>
            {canEdit && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  await rows.step.mutateAsync({ id: i.id, step: "restore" });
                  toast.success("Row restored");
                }}
              >
                <RotateCcw aria-hidden /> Restore
              </Button>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <History aria-hidden className="size-3.5" /> Every row also keeps its full history; open a row to restore an earlier version.
      </p>
    </div>
  );
}
