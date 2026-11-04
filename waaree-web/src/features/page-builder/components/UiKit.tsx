"use client";

import { Blocks, Plus, Puzzle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { useCustomBlockActions, useCustomBlocks } from "../custom";
import { BLOCKS, GROUPS } from "../registry";
import { makeBlock, PageSketch, parseBlocks, RenderBlock, StyleFrame } from "../render";
import type { BlockStyle } from "../types";

/** Sample content for the previews (real Waaree photos; figures as published on waaree.com). */
const SAMPLE: Record<string, Record<string, string>> = {
  text: { html: "Waaree makes <b>solar modules and cells</b> in India and supplies them to <a href=\"/\">24+ countries</a>.<ul><li>Bold, italic and links</li><li>Bulleted lists</li></ul>" },
  quote: { text: "To make sustainable energy accessible and affordable across emerging markets.", by: "Waaree’s vision" },
  image: { src: "/waaree/about/facility-aerial.webp", caption: "A Waaree manufacturing facility", shape: "wide" },
  cards: {
    items: JSON.stringify([
      { image: "/waaree/about/module-line.webp", title: "Solar modules", text: "Made on automated lines.", link: "/" },
      { image: "/waaree/about/rooftop-crew.webp", title: "Rooftop solar", text: "Installed for homes and businesses.", link: "/" },
      { image: "/waaree/about/facility-aerial.webp", title: "Manufacturing", text: "Facilities across India.", link: "/" },
    ]),
  },
  table: { rows: JSON.stringify([["Capacity", "Figure"], ["Solar modules", "25.8 GW"], ["Solar cells", "5.4 GW"]]), header: "yes", caption: "As published on waaree.com" },
  faq: { items: JSON.stringify([{ q: "Where are Waaree’s products sold?", a: "In 24+ countries." }, { q: "Can I add more questions?", a: "Yes, as many as you need." }]) },
};

// blocks that show data: previewed as their card design, since no data is chosen here
const NEEDS_DATA = new Set(["dataview", "carousel"]);

const LOOKS: { bg: NonNullable<BlockStyle["bg"]>; label: string }[] = [
  { bg: "none", label: "None" },
  { bg: "soft", label: "Soft" },
  { bg: "tint", label: "Green tint" },
  { bg: "dark", label: "Dark" },
  { bg: "brand", label: "Brand" },
];

/**
 * The UI Kit: every building block a page can use, shown live as it looks on the website, and
 * your own custom blocks (reusable sections built from these). Custom blocks appear in the page
 * editor’s “Add a section” list; inserting one copies it into the page.
 */
export function UiKit() {
  const custom = useCustomBlocks();
  const canManage = useCan("blocks.manage");
  const [tab, setTab] = useState<"blocks" | "mine">("blocks");
  const [creating, setCreating] = useState(false);
  const mine = custom.data ?? [];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-tight font-light tracking-tight text-foreground">UI Kit</h1>
          <p className="mt-2 max-w-2xl text-body">Every building block for pages, as it looks on the website, and your own custom blocks to reuse anywhere.</p>
        </div>
        {canManage && (
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden /> New custom block
          </Button>
        )}
      </header>

      <div className="mt-8 mb-6 inline-flex rounded-lg bg-surface-muted p-1" role="tablist" aria-label="View">
        {(
          [
            ["blocks", `Building blocks · ${BLOCKS.length}`, Blocks],
            ["mine", `Your blocks · ${mine.length}`, Puzzle],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("flex items-center gap-2 rounded-md px-4 py-1.5 text-sm transition-colors focus-visible:shadow-glow focus-visible:outline-none", tab === k ? "bg-white font-medium text-foreground shadow-soft" : "text-body hover:text-foreground")}
          >
            <Icon aria-hidden className="size-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "blocks" ? (
        <div className="flex flex-col gap-12">
          <section aria-label="Looks">
            <h2 className="text-xl font-light text-foreground">Looks</h2>
            <p className="mt-1 text-sm text-body">Every block can take a background, a width, an alignment and more or less space, in its “Look” tab.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {LOOKS.map((l) => (
                <div key={l.bg} className="rounded-xl border border-border bg-white p-2">
                  <StyleFrame style={{ bg: l.bg }}>
                    <div className={cn(l.bg === "none" && "px-4 py-10")}>
                      <p className="text-xl font-light text-foreground">Sample heading</p>
                      <p className="mt-1 text-sm text-body">Text adapts to the background.</p>
                    </div>
                  </StyleFrame>
                  <p className="px-2 pt-2 text-sm text-foreground">{l.label}</p>
                </div>
              ))}
            </div>
          </section>

          {GROUPS.map((g) => (
            <section key={g} aria-label={g}>
              <h2 className="text-xl font-light text-foreground">{g}</h2>
              <div className="mt-4 flex flex-col gap-4">
                {BLOCKS.filter((d) => d.group === g).map((d) => (
                  <article key={d.type} aria-label={d.label} className="grid overflow-hidden rounded-xl border border-border bg-white lg:grid-cols-[16rem_minmax(0,1fr)]">
                    <div className="border-b border-border bg-surface-muted/50 p-5 lg:border-r lg:border-b-0">
                      <span className="flex size-9 items-center justify-center rounded-md bg-(image:--brand-tint) text-primary">
                        <d.icon aria-hidden className="size-4" />
                      </span>
                      <h3 className="mt-3 font-medium text-foreground">{d.label}</h3>
                      <p className="mt-1 text-sm text-body">{d.hint}</p>
                    </div>
                    <div className="@container pointer-events-none min-w-0 p-6 sm:p-8" aria-hidden>
                      <RenderBlock block={{ ...makeBlock(d.type, 1), ...(SAMPLE[d.type] && { props: SAMPLE[d.type]! }) }} edit={NEEDS_DATA.has(d.type) ? () => undefined : undefined} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : mine.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border-strong px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-(image:--brand-tint) text-primary">
            <Puzzle aria-hidden className="size-6" />
          </span>
          <p className="mt-4 text-lg font-light text-foreground">No custom blocks yet</p>
          <p className="mt-1 max-w-md text-sm text-body">Build a section once (say, a “Talk to our sales team” band with a button) and add it to any page in one click.</p>
          {canManage && (
            <Button className="mt-6" onClick={() => setCreating(true)}>
              <Plus aria-hidden /> New custom block
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mine.map((c) => (
            <li key={c.id}>
              <Link href={`/cms/ui-kit/${c.id}`} className="group block rounded-xl border border-border bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-brand-green/50 hover:shadow-soft focus-visible:shadow-glow focus-visible:outline-none">
                <PageSketch blocks={parseBlocks(c.body)} />
                <p className="mt-3 px-1 font-medium text-foreground">{c.name}</p>
                <p className="px-1 pb-1 text-sm text-muted">{c.description || `${parseBlocks(c.body).length} sections`}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {creating && <NewBlockDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function NewBlockDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { create } = useCustomBlockActions();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const submit = async () => {
    try {
      const b = await create.mutateAsync({ name: name.trim(), description: description.trim() || null, body: null });
      router.push(`/cms/ui-kit/${b.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="New custom block"
      description="Give it a name; then build it from the standard blocks. It appears in every page’s “Add a section” list."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending} disabled={!name.trim()}>
            Create and build it
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && void submit()} placeholder="e.g. Talk to our sales team" />
        </Field>
        <Field label="What it’s for (optional)">
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Band with a contact button, for product pages" />
        </Field>
      </div>
    </Dialog>
  );
}
