"use client";

import { ArrowDown, ArrowUp, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input, Textarea } from "@/components/ui/input";
import { MediaPicker } from "@/features/media";
import { cn } from "@/lib/utils/cn";

import { RichField } from "./rich";

/* ── Lists stored as JSON strings ─────────────────────────────────────────── */
export function parseList<T>(json: string | undefined): T[] {
  try {
    const v = JSON.parse(json || "[]") as T[];
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export const listJson = (v: unknown[]) => JSON.stringify(v);

/* ── Plain text you can type into, in place ───────────────────────────────── */
type Tag = "h1" | "h2" | "h3" | "p" | "span" | "blockquote" | "dd" | "dt" | "figcaption" | "td" | "th" | "div";

/** Plain text. With `onChange` it becomes editable right where it sits; empty fields show their placeholder. */
export function Txt({ as: El = "span", value, onChange, className, placeholder, multiline = false }: { as?: Tag; value: string; onChange?: (v: string) => void; className?: string; placeholder?: string; multiline?: boolean }) {
  if (!onChange) return <El className={className}>{value}</El>;
  return <Editable as={El} value={value} onChange={onChange} className={className} placeholder={placeholder} multiline={multiline} />;
}

function Editable({ as, value, onChange, className, placeholder, multiline }: { as: Tag; value: string; onChange: (v: string) => void; className?: string; placeholder?: string; multiline: boolean }) {
  const ref = useRef<HTMLElement>(null);
  // keep the DOM in step with outside changes (e.g. the side panel), but never while you’re typing in it
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerText !== value) el.innerText = value;
  }, [value]);
  const El = as as "span";
  return (
    <El
      ref={ref as React.RefObject<HTMLSpanElement>}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={placeholder}
      aria-multiline={multiline || undefined}
      data-placeholder={placeholder}
      spellCheck
      onInput={(e) => onChange(e.currentTarget.innerText.replace(/\n$/, ""))}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={cn(
        className,
        "cursor-text rounded-sm outline-none transition-[background-color,box-shadow] hover:bg-brand-green/[0.07] focus:bg-white/80 focus:shadow-[0_0_0_2px_rgb(13_176_43/0.45)]",
        "empty:before:text-placeholder empty:before:content-[attr(data-placeholder)]",
        ["span", "figcaption", "dd", "dt"].includes(as) ? "inline-block min-w-8" : as === "td" || as === "th" ? "" : "block", // table cells keep their table layout
      )}
    />
  );
}

/* ── Choice chips (a radio group that looks like the rest of the CMS) ─────── */
export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1 rounded-lg bg-surface-muted p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn("rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:shadow-glow focus-visible:outline-none", value === o.value ? "bg-white font-medium text-foreground shadow-soft" : "text-body hover:text-foreground")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── A list of items (buttons, cards, questions…) edited as small cards ──── */
export type ListField = { key: string; label: string; kind?: "text" | "textarea" | "rich" | "image" | "select"; placeholder?: string; options?: { value: string; label: string }[] };

export function ListEditor({ value, onChange, fields, make, itemName, max = 12 }: { value: string; onChange: (json: string) => void; fields: ListField[]; make: () => Record<string, string>; itemName: string; max?: number }) {
  const items = parseList<Record<string, string>>(value);
  const [picking, setPicking] = useState<string | null>(null); // "index:key" of an image field being chosen
  const save = (next: Record<string, string>[]) => onChange(listJson(next));
  const set = (i: number, k: string, v: string) => save(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    save(copy);
  };
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((it, i) => (
        <div key={i} className="rounded-lg border border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted">
              {itemName} {i + 1}
            </span>
            <span className="flex">
              <IconButton label={`Move ${itemName} ${i + 1} up`} size="sm" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp aria-hidden />
              </IconButton>
              <IconButton label={`Move ${itemName} ${i + 1} down`} size="sm" disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown aria-hidden />
              </IconButton>
              <IconButton label={`Remove ${itemName} ${i + 1}`} size="sm" onClick={() => save(items.filter((_, j) => j !== i))}>
                <Trash2 aria-hidden />
              </IconButton>
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            {fields.map((f) =>
              f.kind === "image" ? (
                <div key={f.key}>
                  <div className="flex items-center gap-2">
                    <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element -- media library files */}
                      {it[f.key] ? <img src={it[f.key]} alt="" className="size-full object-cover" /> : <ImageIcon aria-hidden className="size-5 text-muted" />}
                    </span>
                    <button type="button" onClick={() => setPicking(picking === `${i}:${f.key}` ? null : `${i}:${f.key}`)} className="text-sm font-medium text-primary-strong hover:underline">
                      {it[f.key] ? "Change picture" : "Choose a picture"}
                    </button>
                    {it[f.key] && (
                      <button type="button" onClick={() => set(i, f.key, "")} className="text-sm text-muted hover:text-foreground">
                        Remove
                      </button>
                    )}
                  </div>
                  {picking === `${i}:${f.key}` && (
                    <div className="mt-2">
                      <MediaPicker
                        onPick={(url) => {
                          set(i, f.key, url);
                          setPicking(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : f.kind === "rich" ? (
                <div key={f.key}>
                  <p className="mb-1.5 text-sm font-medium text-foreground">{f.label}</p>
                  <RichField html={it[f.key] ?? ""} onChange={(v) => set(i, f.key, v)} headings={false} placeholder={f.placeholder ?? "Type here…"} className="rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground" />
                </div>
              ) : f.kind === "select" ? (
                <Choice key={f.key} label={f.label} value={it[f.key] ?? f.options![0]!.value} options={f.options!} onChange={(v) => set(i, f.key, v)} />
              ) : (
                <Field key={f.key} label={f.label}>
                  {f.kind === "textarea" ? (
                    <Textarea rows={3} value={it[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => set(i, f.key, e.target.value)} />
                  ) : (
                    <Input value={it[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => set(i, f.key, e.target.value)} />
                  )}
                </Field>
              ),
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        disabled={items.length >= max}
        onClick={() => save([...items, make()])}
        className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-3 py-2 text-sm text-primary-strong hover:bg-brand-green/5 disabled:opacity-40"
      >
        <Plus aria-hidden className="size-4" /> Add {itemName.toLowerCase()}
      </button>
    </div>
  );
}

/* ── Sketch pieces ────────────────────────────────────────────────────────── */
export const bar = "rounded-full bg-[#cfd8d4]";
export const strong = "rounded-full bg-[#9fb5ab]";
