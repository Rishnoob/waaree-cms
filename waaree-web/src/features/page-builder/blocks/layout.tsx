"use client";

import { ArrowRight, Columns3, LayoutGrid, LayoutTemplate, Megaphone, Minus, MoveVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

import { bar, Choice, ListEditor, listJson, parseList, strong, Txt } from "../kit";
import { RichField, RichSlot } from "../rich";
import type { BlockDef, Edit } from "../types";

const PANEL_RICH = "rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground";

/* ── A button, as the website draws it ─────────────────────────────────────── */
export type Btn = { label: string; link: string; kind?: string };

export function SiteButton({ b, onLabel }: { b: Btn; onLabel?: (v: string) => void }) {
  const label = onLabel ? <Txt value={b.label} onChange={onLabel} placeholder="Button text" /> : b.label;
  if (b.kind === "link")
    return onLabel ? (
      <span className="inline-flex items-center gap-1.5 font-medium text-primary-strong">
        {label} <ArrowRight aria-hidden className="size-4" />
      </span>
    ) : (
      <a href={b.link || "#"} className="group inline-flex items-center gap-1.5 font-medium text-primary-strong hover:underline">
        {label} <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
      </a>
    );
  const variant = b.kind === "secondary" ? "secondary" : "primary";
  return onLabel ? (
    <Button asChild variant={variant} arrow={variant === "primary"}>
      <span>{label}</span>
    </Button>
  ) : (
    <Button asChild variant={variant} arrow={variant === "primary"}>
      <a href={b.link || "#"}>{label}</a>
    </Button>
  );
}

export const banner: BlockDef = {
  type: "banner",
  label: "Big banner",
  hint: "Headline, a line and a button",
  icon: LayoutTemplate,
  group: "Layout",
  defaults: () => ({ title: "Your headline", subtitle: "One line that says why it matters.", button: "Get in touch", link: "/#contact" }),
  defaultStyle: { bg: "tint" },
  Render: ({ props, edit, style }) => (
    <section className={cn("relative overflow-hidden", (!style.bg || style.bg === "none") && "rounded-lg bg-(image:--brand-tint) px-6 py-14 @xl:px-12")}>
      <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-24 size-80 rounded-full border border-current opacity-10" />
      <Txt as="h2" value={props.title ?? ""} onChange={edit && ((title) => edit({ title }))} placeholder="Headline" className="relative max-w-2xl text-3xl leading-tight font-light tracking-tight text-foreground @xl:text-5xl" />
      {(edit || props.subtitle) && <RichSlot value={props.subtitle} onChange={edit && ((subtitle) => edit({ subtitle }))} placeholder="A supporting line (optional)" className="relative mt-4 max-w-xl text-lg text-body" />}
      {props.button && (
        <div className="relative mt-8">
          <SiteButton b={{ label: props.button, link: props.link ?? "", kind: "primary" }} onLabel={edit && ((button) => edit({ button }))} />
        </div>
      )}
    </section>
  ),
  Options: ({ props, onChange }) => (
    <div className="flex flex-col gap-4">
      <Field label="Headline">
        <Input value={props.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} />
      </Field>
      <Field label="Supporting line">
        <RichField html={props.subtitle ?? ""} onChange={(subtitle) => onChange({ subtitle })} headings={false} className={PANEL_RICH} />
      </Field>
      <Field label="Button text" hint="Leave empty for no button">
        <Input value={props.button ?? ""} onChange={(e) => onChange({ button: e.target.value })} placeholder="e.g. Get in touch" />
      </Field>
      <Field label="Button goes to" hint="A page on this site like /careers, or a full web address">
        <Input value={props.link ?? ""} onChange={(e) => onChange({ link: e.target.value })} placeholder="/#contact" />
      </Field>
    </div>
  ),
  Sketch: () => (
    <div className="flex h-full flex-col justify-center gap-1.5 rounded-sm bg-(image:--brand-tint) px-[12%]">
      <span className={cn(strong, "h-1.5 w-3/4")} />
      <span className={cn(bar, "h-1 w-1/2")} />
      <span className="mt-1 h-1.5 w-1/4 rounded-full bg-brand-green/70" />
    </div>
  ),
};

/* ── Columns and cards share one item shape ────────────────────────────────── */
type Item = { image?: string; title?: string; text?: string; link?: string; linkLabel?: string };
const ITEM_FIELDS = [
  { key: "image", label: "Picture", kind: "image" as const },
  { key: "title", label: "Title" },
  { key: "text", label: "Text", kind: "rich" as const },
  { key: "linkLabel", label: "Link text (optional)", placeholder: "Learn more" },
  { key: "link", label: "Link goes to", placeholder: "/careers or https://…" },
];
const setItem = (props: Record<string, string>, edit: Edit | undefined, i: number, k: keyof Item) =>
  edit && ((v: string) => edit({ items: listJson(parseList<Item>(props.items).map((x, j) => (j === i ? { ...x, [k]: v } : x))) }));

const GRID: Record<number, string> = { 1: "", 2: "@xl:grid-cols-2", 3: "@xl:grid-cols-2 @4xl:grid-cols-3", 4: "@xl:grid-cols-2 @4xl:grid-cols-4" };

export const columns: BlockDef = {
  type: "columns",
  label: "Columns",
  hint: "Two to four side-by-side columns",
  icon: Columns3,
  group: "Layout",
  defaults: () => ({ items: listJson([{ title: "First point", text: "Say something useful here." }, { title: "Second point", text: "And here." }, { title: "Third point", text: "And here too." }]) }),
  Render: ({ props, edit }) => {
    const items = parseList<Item>(props.items);
    return (
      <div className={cn("grid gap-8", GRID[Math.min(items.length, 4)])}>
        {items.map((it, i) => (
          <div key={i}>
            {/* eslint-disable-next-line @next/next/no-img-element -- media library files */}
            {it.image && <img src={it.image} alt="" className="mb-5 aspect-[3/2] w-full rounded-lg object-cover" />}
            <Txt as="h3" value={it.title ?? ""} onChange={setItem(props, edit, i, "title")} placeholder="Title" className="text-xl font-medium text-foreground" />
            <RichSlot value={it.text} onChange={setItem(props, edit, i, "text")} placeholder="Text" className="mt-2 leading-relaxed text-body" />
            {it.link && (
              <a href={it.link} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-strong hover:underline">
                {it.linkLabel || "Learn more"} <ArrowRight aria-hidden className="size-4" />
              </a>
            )}
          </div>
        ))}
      </div>
    );
  },
  Options: ({ props, onChange }) => <ListEditor value={props.items ?? "[]"} onChange={(items) => onChange({ items })} fields={ITEM_FIELDS} make={() => ({ title: "New column", text: "" })} itemName="Column" max={4} />,
  Sketch: () => (
    <div className="grid h-full grid-cols-3 items-center gap-[6%] px-[8%]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex flex-col gap-1">
          <span className={cn(strong, "h-1.5 w-3/4")} />
          <span className={cn(bar, "h-1 w-full")} />
          <span className={cn(bar, "h-1 w-4/5")} />
        </span>
      ))}
    </div>
  ),
};

export const cards: BlockDef = {
  type: "cards",
  label: "Cards",
  hint: "Picture cards in a grid, each with a link",
  icon: LayoutGrid,
  group: "Layout",
  defaults: () => ({ items: listJson([{ title: "Card title", text: "A short description.", link: "/" }, { title: "Card title", text: "A short description.", link: "/" }, { title: "Card title", text: "A short description.", link: "/" }]) }),
  Render: ({ props, edit }) => {
    const items = parseList<Item>(props.items);
    return (
      <div className="grid gap-5 @xl:grid-cols-2 @4xl:grid-cols-3">
        {items.map((it, i) => {
          const body = (
            <>
              <div className="aspect-[3/2] overflow-hidden bg-(image:--brand-tint)">
                {/* eslint-disable-next-line @next/next/no-img-element -- media library files */}
                {it.image && <img src={it.image} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
              </div>
              <div className="p-5">
                <Txt as="h3" value={it.title ?? ""} onChange={setItem(props, edit, i, "title")} placeholder="Title" className="text-lg font-medium text-foreground" />
                <RichSlot value={it.text} onChange={setItem(props, edit, i, "text")} placeholder="Text" className="mt-1.5 text-sm leading-relaxed text-body" />
                {it.link && !edit && (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-strong">
                    {it.linkLabel || "Learn more"} <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </div>
            </>
          );
          const cls = "group block overflow-hidden rounded-xl border border-border bg-white transition-all hover:-translate-y-0.5 hover:shadow-soft";
          return it.link && !edit ? (
            <a key={i} href={it.link} className={cls}>
              {body}
            </a>
          ) : (
            <div key={i} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
    );
  },
  Options: ({ props, onChange }) => <ListEditor value={props.items ?? "[]"} onChange={(items) => onChange({ items })} fields={ITEM_FIELDS} make={() => ({ title: "New card", text: "" })} itemName="Card" />,
  Sketch: () => (
    <div className="grid h-full grid-cols-3 items-center gap-[5%] px-[8%]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex h-4/5 flex-col overflow-hidden rounded-sm border border-[#d5dfdb] bg-white">
          <span className="h-1/2 bg-[linear-gradient(135deg,#d7eadf,#cfe5f1)]" />
          <span className={cn(bar, "m-1 h-1 w-3/4")} />
        </span>
      ))}
    </div>
  ),
};

export const cta: BlockDef = {
  type: "cta",
  label: "Call to action",
  hint: "A bold band with one button",
  icon: Megaphone,
  group: "Layout",
  defaults: () => ({ title: "Ready to go solar?", text: "Talk to our team about the right system for you.", button: "Get in touch", link: "/#contact" }),
  defaultStyle: { bg: "brand" },
  Render: ({ props, edit, style }) => (
    <div className={cn("flex flex-col gap-6 @3xl:flex-row @3xl:items-center @3xl:justify-between", style.align === "center" && "@3xl:flex-col @3xl:items-center")}>
      <div>
        <Txt as="h2" value={props.title ?? ""} onChange={edit && ((title) => edit({ title }))} placeholder="Headline" className="text-2xl font-light tracking-tight text-foreground @xl:text-4xl" />
        {(edit || props.text) && <RichSlot value={props.text} onChange={edit && ((t) => edit({ text: t }))} placeholder="A supporting line (optional)" className="mt-2 max-w-xl text-body" />}
      </div>
      {props.button && <SiteButton b={{ label: props.button, link: props.link ?? "", kind: "primary" }} onLabel={edit && ((button) => edit({ button }))} />}
    </div>
  ),
  Options: ({ props, onChange }) => (
    <div className="flex flex-col gap-4">
      <Field label="Headline">
        <Input value={props.title ?? ""} onChange={(e) => onChange({ title: e.target.value })} />
      </Field>
      <Field label="Supporting line">
        <RichField html={props.text ?? ""} onChange={(t) => onChange({ text: t })} headings={false} className={PANEL_RICH} />
      </Field>
      <Field label="Button text" hint="Leave empty for no button">
        <Input value={props.button ?? ""} onChange={(e) => onChange({ button: e.target.value })} />
      </Field>
      <Field label="Button goes to">
        <Input value={props.link ?? ""} onChange={(e) => onChange({ link: e.target.value })} placeholder="/#contact" />
      </Field>
    </div>
  ),
  Sketch: () => (
    <div className="flex h-full items-center justify-between rounded-sm bg-(image:--brand-gradient) px-[8%]">
      <span className="h-1.5 w-1/2 rounded-full bg-white/80" />
      <span className="h-2.5 w-1/5 rounded-sm bg-white" />
    </div>
  ),
};

export const divider: BlockDef = {
  type: "divider",
  label: "Divider",
  hint: "A thin line between parts",
  icon: Minus,
  group: "Layout",
  defaults: () => ({}),
  Render: () => <hr className="border-border" />,
  Sketch: () => (
    <div className="flex h-full items-center px-[8%]">
      <span className="h-px w-full bg-[#9fb5ab]" />
    </div>
  ),
};

const SPACE: Record<string, string> = { small: "h-6", medium: "h-14", large: "h-28" };
export const spacer: BlockDef = {
  type: "spacer",
  label: "Space",
  hint: "Extra room between sections",
  icon: MoveVertical,
  group: "Layout",
  defaults: () => ({ size: "medium" }),
  Render: ({ props, edit }) => <div aria-hidden className={cn(SPACE[props.size ?? "medium"], edit && "rounded-md border border-dashed border-border-strong bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgb(0_0_0/0.025)_6px,rgb(0_0_0/0.025)_12px)]")} />,
  Options: ({ props, onChange }) => <Choice label="How much space" value={props.size ?? "medium"} options={[{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }]} onChange={(size) => onChange({ size })} />,
  Sketch: () => (
    <div className="flex h-full items-center justify-center px-[8%]">
      <span className="h-3/5 w-full rounded-sm border border-dashed border-[#9fb5ab]" />
    </div>
  ),
};

