"use client";

import { Check, ChevronDown, CornerDownRight, Plus, X } from "lucide-react";
import { useState } from "react";

import { toast } from "@/components/ui/toast";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { placeName, useMenu, useMenuActions, type Where } from "../menu";

/**
 * Every place a page can go, for lists and filters: each sub-menu of Waaree’s sections
 * (“Company › Group Business”), your own menu items, or More (where every other page shows).
 */
export function usePlaceOptions() {
  const menu = useMenu();
  const items = menu.data?.items ?? [];
  const groups = items.filter((i) => !i.section && !i.parent_id && !i.page_id);
  const columns = menu.data?.columns ?? {};
  return [
    ...(menu.data?.sections ?? []).flatMap((s) => (columns[s] ?? []).map((c) => ({ value: `section:${s}/${c}`, label: `${s} › ${c}`, kind: "menu" as const }))),
    ...groups.map((g) => ({ value: `item:${g.id}`, label: g.label, kind: "menu" as const })),
    { value: "none", label: "More", kind: "none" as const },
  ];
}

const chip = (on: boolean, dashed = false) =>
  cn(
    "flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-all focus-visible:shadow-glow focus-visible:outline-none disabled:opacity-50",
    on ? "border-brand-green bg-white font-medium text-primary-strong shadow-soft" : "border-transparent text-body hover:bg-white hover:text-foreground",
    dashed && "border-dashed",
    dashed && !on && "border-border-strong",
  );

/**
 * “Where does this page show in the menu?”, drawn as a small copy of the website menu.
 * Pick the menu item; if it has sub-menus (Company has “Company” and “Group Business”), a second
 * row asks which one. Need a new one? “New menu item” creates it here and puts the page in it.
 * A page placed nowhere else shows in “More” at the end of the menu. Keyboard: radio groups.
 */
export function WherePicker({ value, onChange, disabled = false }: { value: Where; onChange: (w: Where) => void; disabled?: boolean }) {
  const menu = useMenu();
  const sections = menu.data?.sections ?? [];
  const columns = menu.data?.columns ?? {};
  const groups = (menu.data?.items ?? []).filter((i) => !i.section && !i.parent_id && !i.page_id);

  const top = value.startsWith("section:") ? `section:${value.slice(8).split("/")[0]}` : value; // the chosen menu item
  const section = top.startsWith("section:") ? top.slice(8) : null;
  const subs = section ? (columns[section] ?? []) : [];
  const canMenu = useCan("menu.manage");
  const { add } = useMenuActions();
  const [naming, setNaming] = useState<string | null>(null); // the new menu item's name, while typing it
  const create = async () => {
    try {
      const item = await add.mutateAsync({ label: naming!.trim(), href: null, page_id: null, visible: true, section: null, column: null, parent_id: null });
      setNaming(null);
      onChange(`item:${item.id}`);
      toast.success(`“${item.label}” added to the menu`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <div role="radiogroup" aria-label="Where it shows in the menu" className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-surface-muted p-1.5">
        {sections.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={top === `section:${s}`} disabled={disabled} onClick={() => onChange(`section:${s}/${columns[s]?.[0] ?? ""}`.replace(/\/$/, ""))} className={chip(top === `section:${s}`)}>
            {s}
            <ChevronDown aria-hidden className="size-3.5 opacity-50" />
          </button>
        ))}
        {groups.map((g) => (
          <button key={g.id} type="button" role="radio" aria-checked={top === `item:${g.id}`} disabled={disabled} onClick={() => onChange(`item:${g.id}`)} className={chip(top === `item:${g.id}`)}>
            {g.label}
            <ChevronDown aria-hidden className="size-3.5 opacity-50" />
          </button>
        ))}
        {top === "top" && (
          <button type="button" role="radio" aria-checked disabled={disabled} className={chip(true)}>
            On its own
          </button>
        )}
        <button type="button" role="radio" aria-checked={top === "none"} disabled={disabled} onClick={() => onChange("none")} className={chip(top === "none")}>
          More
          <ChevronDown aria-hidden className="size-3.5 opacity-50" />
        </button>
        {canMenu &&
          (naming === null ? (
            <button type="button" disabled={disabled} onClick={() => setNaming("")} className={chip(false, true)}>
              <Plus aria-hidden className="size-3.5" /> New menu item
            </button>
          ) : (
            <span className="flex items-center gap-1 rounded-md border border-brand-green bg-white py-0.5 pr-0.5 pl-2.5 shadow-soft">
              <input
                autoFocus
                aria-label="Name of the new menu item"
                placeholder="e.g. Sustainability"
                value={naming}
                maxLength={60}
                onChange={(e) => setNaming(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && naming.trim()) {
                    e.preventDefault();
                    void create();
                  }
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setNaming(null);
                  }
                }}
                className="w-40 bg-transparent text-sm text-foreground outline-none placeholder:text-placeholder"
              />
              <button type="button" aria-label="Create menu item" disabled={!naming.trim() || add.isPending} onClick={() => void create()} className="flex size-7 items-center justify-center rounded-sm bg-primary text-white disabled:opacity-40">
                <Check aria-hidden className="size-4" />
              </button>
              <button type="button" aria-label="Cancel" onClick={() => setNaming(null)} className="flex size-7 items-center justify-center rounded-sm text-muted hover:bg-foreground/5">
                <X aria-hidden className="size-4" />
              </button>
            </span>
          ))}
      </div>

      {subs.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-1">
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <CornerDownRight aria-hidden className="size-4" /> Which part of {section}?
          </span>
          <div role="radiogroup" aria-label={`Which part of ${section}?`} className="flex flex-wrap gap-1.5">
            {subs.map((c) => {
              const v = `section:${section}/${c}`;
              return (
                <button key={c} type="button" role="radio" aria-checked={value === v} disabled={disabled} onClick={() => onChange(v)} className={cn(chip(value === v), value !== v && "border-border bg-white")}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-2 text-sm text-muted">
        {value === "none"
          ? "It shows in “More”, at the end of the website menu."
          : value === "top"
            ? "It has its own place in the main menu (set up earlier). Pick a menu item to move it."
            : `It shows in the website menu under ${placeName(value, groups)}.`}
      </p>
    </div>
  );
}
