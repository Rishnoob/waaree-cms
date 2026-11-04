"use client";

import { BarChart3, ChevronDown, CircleHelp, FileSpreadsheet, LoaderCircle, Minus, Plus, Table2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

import { bar, Choice, ListEditor, listJson, parseList, Txt } from "../kit";
import { readTable, rowsFromPaste, TABLE_FILES } from "../imports";
import { RichSlot } from "../rich";
import type { BlockDef } from "../types";

/* ── Key numbers (stored as "value | label" lines, as before) ──────────────── */
export const parseStats = (items: string) =>
  items
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => l.split("|").map((x) => x.trim()))
    .map(([value = "", label = ""]) => ({ value, label }));
export const stringifyStats = (rows: { value: string; label: string }[]) => rows.map((r) => `${r.value} | ${r.label}`).join("\n");

export const stats: BlockDef = {
  type: "stats",
  label: "Key numbers",
  hint: "Big figures in a row",
  icon: BarChart3,
  group: "Data",
  defaults: () => ({ items: "25.8 GW | Module capacity\n5.4 GW | Cell capacity\n24+ | Countries supplied" }),
  Render: ({ props, edit }) => {
    const rows = parseStats(props.items ?? "");
    const set = (i: number, k: "value" | "label") => edit && ((v: string) => edit({ items: stringifyStats(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r))) }));
    return (
      <dl className="grid gap-x-8 gap-y-8 @xl:grid-cols-2 @4xl:grid-cols-4">
        {rows.map((r, i) => (
          <div key={i} className="flex flex-col-reverse border-t border-border pt-5">
            <Txt as="dt" value={r.label} onChange={set(i, "label")} placeholder="What it is" className="mt-2 text-sm text-body" />
            <Txt as="dd" value={r.value} onChange={set(i, "value")} placeholder="Number" className="bg-(image:--brand-gradient) bg-clip-text text-4xl font-light tracking-tight text-transparent tabular-nums @xl:text-5xl" />
          </div>
        ))}
      </dl>
    );
  },
  Options: ({ props, onChange }) => {
    const rows = parseStats(props.items ?? "");
    const save = (next: typeof rows) => onChange({ items: stringifyStats(next) });
    return (
      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input aria-label={`Number ${i + 1}`} value={r.value} onChange={(e) => save(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} className="w-24" placeholder="25.8 GW" />
            <Input aria-label={`What number ${i + 1} is`} value={r.label} onChange={(e) => save(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="What it is" />
            <IconButton label={`Remove number ${i + 1}`} size="sm" onClick={() => save(rows.filter((_, j) => j !== i))}>
              <Trash2 aria-hidden />
            </IconButton>
          </div>
        ))}
        <button type="button" disabled={rows.length >= 4} onClick={() => save([...rows, { value: "", label: "" }])} className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-3 py-2 text-sm text-primary-strong hover:bg-brand-green/5 disabled:opacity-40">
          <Plus aria-hidden className="size-4" /> Add a number
        </button>
      </div>
    );
  },
  Sketch: () => (
    <div className="grid h-full grid-cols-3 items-center gap-[6%] px-[8%]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex flex-col gap-1">
          <span className="h-2 w-4/5 rounded-full bg-brand-green/60" />
          <span className={cn(bar, "h-1 w-full")} />
        </span>
      ))}
    </div>
  ),
};

/* ── Table: type into every cell; add or remove rows and columns ───────────── */
export const table: BlockDef = {
  type: "table",
  label: "Table",
  hint: "Rows and columns, like specs or prices",
  icon: Table2,
  group: "Data",
  defaults: () => ({
    rows: listJson([
      ["Module", "Power", "Efficiency"],
      ["", "", ""],
      ["", "", ""],
    ]),
    header: "yes",
    caption: "",
  }),
  Render: ({ props, edit }) => {
    const rows = parseList<string[]>(props.rows);
    const head = props.header !== "no";
    const set = (r: number, c: number) => edit && ((v: string) => edit({ rows: listJson(rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row))) }));
    return (
      <figure>
        <div
          className="overflow-x-auto rounded-lg border border-border"
          onPaste={
            edit &&
            ((e) => {
              // cells copied from Excel or Google Sheets fill the table from the cell you’re in
              const pasted = rowsFromPaste(e.clipboardData.getData("text/plain"));
              const at = (e.target as HTMLElement).closest("td,th") as HTMLTableCellElement | null;
              if (!pasted || !at) return;
              e.preventDefault();
              (document.activeElement as HTMLElement | null)?.blur(); // let the cell you were in show its new value too
              const r0 = (at.parentElement as HTMLTableRowElement).rowIndex;
              const c0 = at.cellIndex;
              const width = Math.max(rows[0]?.length ?? 0, c0 + Math.max(...pasted.map((r) => r.length)));
              const next = Array.from({ length: Math.max(rows.length, r0 + pasted.length) }, (_, r) => Array.from({ length: width }, (_, c) => pasted[r - r0]?.[c - c0] ?? rows[r]?.[c] ?? ""));
              edit({ rows: listJson(next) });
            })
          }
        >
          <table className="w-full border-collapse text-left text-sm">
            <tbody>
              {rows.map((row, r) => {
                const isHead = head && r === 0;
                return (
                  <tr key={r} className={cn(isHead ? "bg-surface-muted" : "border-t border-border even:bg-surface-muted/40")}>
                    {row.map((cell, c) =>
                      isHead ? (
                        <Txt key={c} as="th" value={cell} onChange={set(r, c)} placeholder="Heading" className="px-4 py-3 font-medium text-foreground" />
                      ) : (
                        <Txt key={c} as="td" value={cell} onChange={set(r, c)} placeholder="—" className="px-4 py-3 text-body" />
                      ),
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {(edit || props.caption) && <Txt as="figcaption" value={props.caption ?? ""} onChange={edit && ((caption) => edit({ caption }))} placeholder="Caption (optional)" className="mt-3 text-sm text-muted" />}
      </figure>
    );
  },
  Options: ({ props, onChange }) => {
    const rows = parseList<string[]>(props.rows);
    const cols = rows[0]?.length ?? 0;
    const save = (next: string[][]) => onChange({ rows: listJson(next) });
    const step = (label: string, add: () => void, remove: () => void, n: number, min: number, max: number) => (
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <span className="text-sm text-foreground">
          {label}: <strong className="font-medium">{n}</strong>
        </span>
        <span className="flex gap-1">
          <IconButton label={`Remove a ${label.toLowerCase().replace(/s$/, "")}`} size="sm" variant="secondary" disabled={n <= min} onClick={remove}>
            <Minus aria-hidden />
          </IconButton>
          <IconButton label={`Add a ${label.toLowerCase().replace(/s$/, "")}`} size="sm" variant="secondary" disabled={n >= max} onClick={add}>
            <Plus aria-hidden />
          </IconButton>
        </span>
      </div>
    );
    return (
      <div className="flex flex-col gap-3">
        <ImportTable onRows={(next) => save(next)} />
        <p className="rounded-md bg-surface-muted px-3 py-2 text-xs text-body">Type straight into the cells on the page, or copy cells in Excel and paste them into a cell here.</p>
        {step("Rows", () => save([...rows, Array(cols).fill("")]), () => save(rows.slice(0, -1)), rows.length, 1, 40)}
        {step("Columns", () => save(rows.map((r) => [...r, ""])), () => save(rows.map((r) => r.slice(0, -1))), cols, 1, 8)}
        <Choice label="First row is a heading" value={props.header === "no" ? "no" : "yes"} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} onChange={(header) => onChange({ header })} />
        <Field label="Caption">
          <Input value={props.caption ?? ""} onChange={(e) => onChange({ caption: e.target.value })} />
        </Field>
      </div>
    );
  },
  Sketch: () => (
    <div className="flex h-full flex-col justify-center px-[8%]">
      <div className="grid grid-cols-3 overflow-hidden rounded-sm border border-[#d5dfdb]">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={cn("h-2.5 border-[#d5dfdb]", i < 3 ? "bg-[#e4ece8]" : "bg-white", i % 3 !== 2 && "border-r", i < 6 && "border-b")} />
        ))}
      </div>
    </div>
  ),
};

/* ── FAQ: questions that open to show the answer ───────────────────────────── */
type QA = { q: string; a: string };
export const faq: BlockDef = {
  type: "faq",
  label: "FAQ",
  hint: "Questions that open to show the answer",
  icon: CircleHelp,
  group: "Data",
  defaults: () => ({ items: listJson([{ q: "How long do the panels last?", a: "" }, { q: "Do you install outside India?", a: "" }]) }),
  Render: ({ props, edit }) => {
    const items = parseList<QA>(props.items);
    const set = (i: number, k: keyof QA) => edit && ((v: string) => edit({ items: listJson(items.map((x, j) => (j === i ? { ...x, [k]: v } : x))) }));
    if (edit)
      // while editing, every answer stays open (clicking a question to type mustn’t fold it)
      return (
        <div className="max-w-3xl divide-y divide-border border-y border-border">
          {items.map((it, i) => (
            <div key={i} className="py-1">
              <Txt as="p" value={it.q} onChange={set(i, "q")} placeholder="Question" className="py-4 text-lg text-foreground" />
              <RichSlot value={it.a} onChange={set(i, "a")} placeholder="Answer" className="pb-5 leading-relaxed text-body" />
            </div>
          ))}
        </div>
      );
    return (
      <div className="max-w-3xl divide-y divide-border border-y border-border">
        {items.map((it, i) => (
          <details key={i} className="group py-1">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg text-foreground [&::-webkit-details-marker]:hidden">
              <Txt value={it.q} onChange={set(i, "q")} placeholder="Question" />
              <ChevronDown aria-hidden className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <RichSlot value={it.a} onChange={set(i, "a")} placeholder="Answer" className="pb-5 leading-relaxed text-body" />
          </details>
        ))}
      </div>
    );
  },
  Options: ({ props, onChange }) => (
    <ListEditor
      value={props.items ?? "[]"}
      onChange={(items) => onChange({ items })}
      fields={[
        { key: "q", label: "Question" },
        { key: "a", label: "Answer", kind: "rich" },
      ]}
      make={() => ({ q: "New question", a: "" })}
      itemName="Question"
      max={30}
    />
  ),
  Sketch: () => (
    <div className="flex h-full flex-col justify-center gap-1.5 px-[8%]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex items-center justify-between border-b border-[#d5dfdb] pb-1">
          <span className={cn(bar, "h-1 w-2/3")} />
          <span className="size-1.5 rotate-45 border-r border-b border-[#9fb5ab]" />
        </span>
      ))}
    </div>
  ),
};

/** “Import from Excel or CSV”: replaces the table with the file’s first sheet. */
function ImportTable({ onRows }: { onRows: (rows: string[][]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={TABLE_FILES}
        hidden
        aria-label="Excel or CSV file"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try {
            const t = await readTable(f);
            if (!t.rows.length) throw new Error(`“${f.name}” is empty.`);
            onRows(t.rows);
            toast.success(`Table filled from ${f.name}${t.sheet ? ` (sheet “${t.sheet}”)` : ""}${t.cut ? ". It was large, so only the first part was used." : ""}`);
          } catch (err) {
            toast.error((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="flex items-center gap-3 rounded-lg border border-dashed border-brand-green/50 bg-brand-green/[0.04] px-3 py-3 text-left transition-colors hover:bg-brand-green/[0.08] focus-visible:shadow-glow focus-visible:outline-none"
      >
        {busy ? <LoaderCircle aria-hidden className="size-5 animate-spin text-primary" /> : <FileSpreadsheet aria-hidden className="size-5 text-primary" />}
        <span>
          <span className="block text-sm font-medium text-foreground">Import from Excel or CSV</span>
          <span className="block text-xs text-muted">Fills the table from the file’s first sheet</span>
        </span>
      </button>
    </>
  );
}
