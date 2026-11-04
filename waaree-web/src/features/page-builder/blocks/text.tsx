"use client";

import { Heading, Quote, Text } from "lucide-react";

import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

import { bar, Choice, strong, Txt } from "../kit";
import { RichSlot } from "../rich";
import type { BlockDef } from "../types";

export const heading: BlockDef = {
  type: "heading",
  label: "Heading",
  hint: "Starts a new part of the page",
  icon: Heading,
  group: "Text",
  defaults: () => ({ text: "New heading", size: "medium" }),
  Render: ({ props, edit }) => (
    <Txt
      as="h2"
      value={props.text ?? ""}
      onChange={edit && ((text) => edit({ text }))}
      placeholder="Heading"
      className={cn("font-light tracking-tight text-foreground", props.size === "large" ? "text-3xl @xl:text-5xl" : props.size === "small" ? "text-xl @xl:text-2xl" : "text-2xl @xl:text-3xl")}
    />
  ),
  Options: ({ props, onChange }) => (
    <div className="flex flex-col gap-4">
      <Field label="Heading">
        <Input value={props.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} />
      </Field>
      <Choice label="Size" value={props.size ?? "medium"} options={[{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }]} onChange={(size) => onChange({ size })} />
    </div>
  ),
  Sketch: () => (
    <div className="flex h-full items-center px-[8%]">
      <span className={cn(strong, "h-2 w-2/3")} />
    </div>
  ),
};

/** A paragraph. Older pages stored plain `text`; formatted text is stored as `html`. */
export const text: BlockDef = {
  type: "text",
  label: "Paragraph",
  hint: "Formatted text: headings, bold, links, lists",
  icon: Text,
  group: "Text",
  defaults: () => ({ html: "" }),
  Render: ({ props, edit }) => (
    <RichSlot
      value={props.html ?? props.text}
      onChange={edit && ((html) => edit({ html, text: "" }))}
      headings
      placeholder="Start typing… Select words to format them."
      className="max-w-3xl text-lg leading-relaxed text-body"
    />
  ),
  Sketch: () => (
    <div className="flex h-full flex-col justify-center gap-1 px-[8%]">
      <span className={cn(bar, "h-1 w-full")} />
      <span className={cn(bar, "h-1 w-11/12")} />
      <span className={cn(bar, "h-1 w-4/5")} />
    </div>
  ),
};

export const quote: BlockDef = {
  type: "quote",
  label: "Quote",
  hint: "A statement and who said it",
  icon: Quote,
  group: "Text",
  defaults: () => ({ text: "", by: "" }),
  Render: ({ props, edit }) => (
    <figure className="max-w-3xl">
      <span aria-hidden className="block h-0.5 w-14 bg-(image:--brand-gradient)" />
      <blockquote className="mt-6 text-2xl leading-snug font-light text-foreground @xl:text-3xl">
        {edit ? <Txt value={props.text ?? ""} onChange={(t) => edit({ text: t })} placeholder="The quote" multiline /> : <>“{props.text}”</>}
      </blockquote>
      {(edit || props.by) && <Txt as="figcaption" value={props.by ?? ""} onChange={edit && ((by) => edit({ by }))} placeholder="Who said it" className="mt-4 text-sm text-muted" />}
    </figure>
  ),
  Options: ({ props, onChange }) => (
    <div className="flex flex-col gap-4">
      <Field label="Quote">
        <Textarea rows={3} value={props.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} />
      </Field>
      <Field label="Who said it">
        <Input value={props.by ?? ""} placeholder="Name, title" onChange={(e) => onChange({ by: e.target.value })} />
      </Field>
    </div>
  ),
  Sketch: () => (
    <div className="flex h-full flex-col justify-center gap-1 px-[8%]">
      <span className="h-0.5 w-1/6 bg-brand-green/70" />
      <span className={cn(strong, "mt-1 h-1.5 w-11/12")} />
      <span className={cn(strong, "h-1.5 w-2/3")} />
    </div>
  ),
};
