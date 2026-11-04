"use client";

import { Calendar, CheckSquare, FileText, Hash, Image as ImageIcon, Link2, List, Text, Type } from "lucide-react";

import { RenderRich } from "@/features/page-builder";

import type { Field, FieldInput, FieldType } from "./hooks";

/** The field types, in plain words. */
export const FIELD_TYPES: { value: FieldType; label: string; hint: string; icon: typeof Type }[] = [
  { value: "text", label: "Short text", hint: "A name, a title, a quarter", icon: Type },
  { value: "richtext", label: "Long text", hint: "Paragraphs with formatting", icon: Text },
  { value: "number", label: "Number", hint: "Amounts, counts, percentages", icon: Hash },
  { value: "date", label: "Date", hint: "A day", icon: Calendar },
  { value: "boolean", label: "Yes / No", hint: "A tick box", icon: CheckSquare },
  { value: "choice", label: "Choice", hint: "One of a fixed list", icon: List },
  { value: "image", label: "Picture", hint: "From Files", icon: ImageIcon },
  { value: "file", label: "File", hint: "A PDF or document from Files", icon: FileText },
  { value: "link", label: "Link", hint: "A web address", icon: Link2 },
];
export const typeLabel = (t: string) => FIELD_TYPES.find((x) => x.value === t)?.label ?? t;
export const typeIcon = (t: string) => FIELD_TYPES.find((x) => x.value === t)?.icon ?? Type;

const dateFmt = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/** A value as people should read it (lists, tables and the website). */
export function ShowValue({ field, value, compact = false }: { field: Pick<Field, "type">; value: unknown; compact?: boolean }) {
  if (value === undefined || value === null || value === "") return <span className="text-muted">—</span>;
  switch (field.type) {
    case "number":
      return <span className="tabular-nums">{Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>;
    case "date":
      return <span>{dateFmt(String(value))}</span>;
    case "boolean":
      return <span>{value ? "Yes" : "No"}</span>;
    case "image":
      // eslint-disable-next-line @next/next/no-img-element -- files from the media library
      return <img src={String(value)} alt="" className={compact ? "size-9 rounded-md object-cover" : "aspect-[3/2] w-full rounded-lg object-cover"} />;
    case "file":
      return (
        <a href={String(value)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary-strong hover:underline" onClick={(e) => e.stopPropagation()}>
          <FileText aria-hidden className="size-4" /> Download
        </a>
      );
    case "link":
      return (
        <a href={String(value)} target={String(value).startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="font-medium text-primary-strong hover:underline" onClick={(e) => e.stopPropagation()}>
          {compact ? String(value).replace(/^https?:\/\//, "").slice(0, 40) : "Open"}
        </a>
      );
    case "richtext":
      return compact ? <span className="line-clamp-1">{String(value).replace(/<[^>]*>/g, " ")}</span> : <RenderRich html={String(value)} />;
    default:
      return <span>{String(value)}</span>;
  }
}

/* ── Guessing field types from an Excel/CSV column ──────────────────────────── */
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const DMY = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;
export const toIsoDate = (v: string) => {
  if (ISO.test(v)) return v;
  const m = v.match(DMY);
  return m ? `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}` : null;
};
const isNumber = (v: string) => /^-?[\d,]*\.?\d+%?$/.test(v.replace(/[₹$\s]/g, ""));

export function guessType(values: string[]): FieldType {
  const filled = values.filter((v) => v.trim());
  if (!filled.length) return "text";
  if (filled.every(isNumber)) return "number";
  if (filled.every((v) => toIsoDate(v.trim()))) return "date";
  if (filled.every((v) => /^(yes|no|true|false|y|n)$/i.test(v.trim()))) return "boolean";
  if (filled.every((v) => /^https?:\/\//i.test(v.trim()))) return "link";
  if (filled.some((v) => v.length > 160)) return "richtext";
  return "text";
}

/** Turn a cell into the value its field expects (the server checks again). */
export function convert(type: FieldType, v: string): unknown {
  const t = v.trim();
  if (!t) return null;
  if (type === "number") return Number(t.replace(/[₹$,%\s]/g, ""));
  if (type === "date") return toIsoDate(t);
  if (type === "boolean") return /^(yes|true|y)$/i.test(t);
  return t;
}

/* ── Ready-made collections ─────────────────────────────────────────────────── */
export type Template = { key: string; name: string; description: string; approval: boolean; fields: (Omit<FieldInput, "required"> & { required?: boolean })[] };

export const TEMPLATES: Template[] = [
  {
    key: "results",
    name: "Quarterly results",
    description: "One row per quarter, for the Investors pages",
    approval: true,
    fields: [
      { label: "Quarter", type: "text", required: true },
      { label: "Period end", type: "date", required: true },
      { label: "Revenue (₹ crore)", type: "number" },
      { label: "EBITDA (₹ crore)", type: "number" },
      { label: "Profit after tax (₹ crore)", type: "number" },
      { label: "Presentation", type: "file" },
    ],
  },
  {
    key: "blog",
    name: "Blog posts",
    description: "Articles with a cover picture",
    approval: false,
    fields: [
      { label: "Title", type: "text", required: true },
      { label: "Date", type: "date", required: true },
      { label: "Cover picture", type: "image" },
      { label: "Summary", type: "text" },
      { label: "Body", type: "richtext" },
      { label: "Author", type: "text" },
    ],
  },
  {
    key: "news",
    name: "News & press",
    description: "Press releases and coverage",
    approval: false,
    fields: [
      { label: "Headline", type: "text", required: true },
      { label: "Date", type: "date", required: true },
      { label: "Source", type: "text" },
      { label: "Link", type: "link" },
      { label: "Picture", type: "image" },
    ],
  },
  {
    key: "jobs",
    name: "Job openings",
    description: "Open roles for the Careers page",
    approval: false,
    fields: [
      { label: "Role", type: "text", required: true },
      { label: "Location", type: "text" },
      { label: "Department", type: "choice", options: { choices: ["Manufacturing", "Engineering", "Sales", "Corporate"] } },
      { label: "Description", type: "richtext" },
      { label: "Apply link", type: "link" },
    ],
  },
];
