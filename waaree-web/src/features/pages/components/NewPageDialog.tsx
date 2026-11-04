"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { PageSketch, serializeBlocks, TEMPLATES } from "@/features/page-builder";
import { type Where, WherePicker } from "@/features/site";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

import { useCreatePage } from "../hooks";

export const slugify = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * New page, in one short form: name it, pick how it starts (pictures, not words), and pick where it
 * shows in the menu. The web address is made from the name; change it only if you want to.
 */
export function NewPageDialog({ open, onOpenChange, where: initialWhere = "none" }: { open: boolean; onOpenChange: (o: boolean) => void; where?: Where }) {
  const router = useRouter();
  const create = useCreatePage();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState<string | null>(null); // null = follow the title
  const [editSlug, setEditSlug] = useState(false);
  const [template, setTemplate] = useState("landing");
  const [where, setWhere] = useState<Where>(initialWhere);
  const address = slug ?? slugify(title);

  const submit = async () => {
    try {
      const t = TEMPLATES.find((x) => x.key === template);
      const page = await create.mutateAsync({ title: title.trim(), slug: address, summary: null, body: t?.blocks.length ? serializeBlocks(t.blocks) : null });
      if (where !== "none") await api.PUT("/site/placement/{page_id}", { params: { path: { page_id: page.id } }, body: { where, label: null } });
      onOpenChange(false);
      router.push(`/cms/pages/${page.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New page"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending} disabled={title.trim().length < 2 || !address}>
            Create page
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">1. What’s the page called?</span>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && title.trim().length >= 2 && void submit()}
            placeholder="e.g. Careers at Waaree"
            className="h-12 text-lg"
          />
          <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
            Web address:
            {editSlug ? (
              <span className="flex items-center gap-1">
                waaree.com/
                <input
                  aria-label="Web address"
                  value={address}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  className="h-7 rounded-sm border border-border px-2 text-xs text-foreground focus:border-brand-green focus:outline-none"
                />
              </span>
            ) : (
              <>
                <span className="text-foreground">waaree.com/{address || "…"}</span>
                <button type="button" onClick={() => setEditSlug(true)} className="text-primary-strong hover:underline">
                  Change
                </button>
              </>
            )}
          </span>
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-foreground">2. How should it start?</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="How should it start?">
            {TEMPLATES.map((t) => {
              const on = template === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={t.label}
                  onClick={() => setTemplate(t.key)}
                  className={cn(
                    "relative rounded-lg border-2 p-1.5 text-left transition-all focus-visible:shadow-glow focus-visible:outline-none",
                    on ? "border-brand-green bg-brand-green/[0.04]" : "border-transparent hover:border-border-strong",
                  )}
                >
                  {on && (
                    <span className="absolute top-3 right-3 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-white">
                      <Check aria-hidden className="size-3" strokeWidth={3} />
                    </span>
                  )}
                  <PageSketch blocks={t.blocks} />
                  <span className="mt-2 block px-1 text-sm font-medium text-foreground">{t.label}</span>
                  <span className="block px-1 pb-1 text-xs text-muted">{t.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">3. Where should it show in the website menu?</p>
          <WherePicker value={where} onChange={setWhere} />
        </div>
      </div>
    </Dialog>
  );
}
