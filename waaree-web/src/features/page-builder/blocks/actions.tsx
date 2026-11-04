"use client";

import { MousePointerClick } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import { ListEditor, listJson, parseList } from "../kit";
import type { BlockDef } from "../types";
import { type Btn, SiteButton } from "./layout";

const BUTTON_FIELDS = [
  { key: "label", label: "Button text", placeholder: "e.g. Download the brochure" },
  { key: "link", label: "Goes to", placeholder: "/careers or https://…" },
  { key: "kind", label: "Look", kind: "select" as const, options: [{ value: "primary", label: "Solid" }, { value: "secondary", label: "Outline" }, { value: "link", label: "Text link" }] },
];

export const buttons: BlockDef = {
  type: "buttons",
  label: "Buttons",
  hint: "One or more buttons in a row",
  icon: MousePointerClick,
  group: "Actions",
  defaults: () => ({ items: listJson([{ label: "Get in touch", link: "/#contact", kind: "primary" }, { label: "Explore products", link: "/", kind: "secondary" }]) }),
  Render: ({ props, edit, style }) => {
    const items = parseList<Btn>(props.items);
    return (
      <div className={cn("flex flex-wrap items-center gap-3", style.align === "center" && "justify-center")}>
        {items.map((b, i) => (
          <SiteButton key={i} b={b} onLabel={edit && ((label) => edit({ items: listJson(items.map((x, j) => (j === i ? { ...x, label } : x))) }))} />
        ))}
        {items.length === 0 && edit && <span className="text-sm text-muted">Add buttons on the right.</span>}
      </div>
    );
  },
  Options: ({ props, onChange }) => <ListEditor value={props.items ?? "[]"} onChange={(items) => onChange({ items })} fields={BUTTON_FIELDS} make={() => ({ label: "New button", link: "/", kind: "secondary" })} itemName="Button" max={4} />,
  Sketch: () => (
    <div className="flex h-full items-center gap-[6%] px-[10%]">
      <span className="h-2.5 w-1/3 rounded-sm bg-brand-green/70" />
      <span className="h-2.5 w-1/3 rounded-sm border border-[#9fb5ab]" />
    </div>
  ),
};

