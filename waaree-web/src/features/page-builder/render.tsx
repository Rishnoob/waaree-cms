"use client";

import { cn } from "@/lib/utils/cn";

import { blockDef } from "./registry";
import type { Block, BlockStyle, Edit } from "./types";

/* ── Reading and writing a page body ─────────────────────────────────────── */
/** Read a page body: block JSON, or legacy plain text as one paragraph. */
export function parseBlocks(body: string | null | undefined): Block[] {
  if (!body) return [];
  try {
    const data = JSON.parse(body) as { blocks?: Block[] };
    if (Array.isArray(data.blocks)) return data.blocks;
  } catch {
    /* plain text */
  }
  return [{ id: 1, type: "text", visible: true, props: { text: body } }];
}

export const serializeBlocks = (blocks: Block[]) => JSON.stringify({ blocks });

export const newId = (blocks: Block[]) => blocks.reduce((m, b) => Math.max(m, b.id), 0) + 1;

export function makeBlock(type: string, id: number): Block {
  const def = blockDef(type);
  return { id, type, visible: true, props: def?.defaults() ?? {}, ...(def?.defaultStyle && { style: { ...def.defaultStyle } }) };
}

/** True when only text changed (same sections, same order, same look): an edit, not a rearrangement. */
export const onlyText = (a: Block[], b: Block[]) => a.length === b.length && a.every((x, i) => x.id === b[i]!.id && x.type === b[i]!.type && x.visible === b[i]!.visible && JSON.stringify(x.style ?? {}) === JSON.stringify(b[i]!.style ?? {}));

/** Give copied blocks fresh ids after the page’s own (used when inserting a custom block). */
export const withIds = (blocks: Block[], from: number) => blocks.map((b, i) => ({ ...b, id: from + i }));

export const blockLabel = (type: string) => blockDef(type)?.label ?? "Unknown section";

/* ── The “Look” of a section: background, width, alignment, space ─────────── */
const BG: Record<NonNullable<BlockStyle["bg"]>, string> = {
  none: "",
  soft: "bg-surface-muted",
  tint: "bg-(image:--brand-tint)",
  dark: "bg-[#10201a]",
  brand: "bg-(image:--brand-gradient)",
};
// On dark or brand backgrounds, text and lines turn light (the blocks use colour tokens, so this re-themes them).
const ON_DARK = { "--foreground": "#ffffff", "--body": "rgb(255 255 255 / 0.84)", "--muted": "rgb(255 255 255 / 0.68)", "--border": "rgb(255 255 255 / 0.2)", "--border-strong": "rgb(255 255 255 / 0.35)", "--surface-muted": "rgb(255 255 255 / 0.08)" } as React.CSSProperties;
const ON_BRAND = { ...ON_DARK, "--primary": "#ffffff", "--primary-strong": "#ffffff", "--primary-foreground": "#0a6b1c" } as React.CSSProperties;

export function StyleFrame({ style = {}, children }: { style?: BlockStyle; children: React.ReactNode }) {
  const bg = style.bg ?? "none";
  return (
    <div
      style={bg === "dark" ? ON_DARK : bg === "brand" ? ON_BRAND : undefined}
      className={cn(
        BG[bg],
        bg !== "none" && "rounded-xl px-6 py-10 @xl:px-10 @xl:py-12",
        style.width === "narrow" && "mx-auto max-w-3xl",
        style.align === "center" && "text-center [&_figcaption]:mx-auto [&_h2]:mx-auto [&_h3]:mx-auto [&_p]:mx-auto",
        style.space === "compact" && "-my-4",
        style.space === "roomy" && "py-10",
        style.space === "roomy" && bg !== "none" && "@xl:py-20",
      )}
    >
      {children}
    </div>
  );
}

/** One section, in its frame. With `edit`, its text can be typed in place. */
export function RenderBlock({ block, edit }: { block: Block; edit?: Edit }) {
  const def = blockDef(block.type);
  if (!def) return edit ? <p className="rounded-lg border border-dashed border-border-strong p-6 text-sm text-muted">This section type isn’t available any more. You can remove it.</p> : null;
  return (
    <StyleFrame style={block.style}>
      <def.Render props={block.props} edit={edit} style={block.style ?? {}} />
    </StyleFrame>
  );
}

/** The public page’s sections (hidden ones skipped). */
export function RenderBlocks({ blocks }: { blocks: Block[] }) {
  const shown = blocks.filter((b) => b.visible);
  if (shown.length === 0) return null;
  return (
    // a size container: blocks lay out by the width they have (so the editor's phone preview is true)
    <div className="@container flex flex-col gap-10">
      {shown.map((b) => (
        <RenderBlock key={b.id} block={b} />
      ))}
    </div>
  );
}

/* ── Small drawings, for galleries and template previews ───────────────────── */
export function BlockSketch({ type, className }: { type: string; className?: string }) {
  const def = blockDef(type);
  return <div className={cn("overflow-hidden", className)}>{def ? <def.Sketch /> : null}</div>;
}

/** A miniature of a whole page (title + its sections), for choosing a template. */
export function PageSketch({ blocks }: { blocks: Block[] }) {
  const tall: Record<string, string> = { banner: "h-12", image: "h-10", video: "h-10", cta: "h-8", cards: "h-9", stats: "h-7", documents: "h-7", table: "h-8", columns: "h-7", text: "h-6", quote: "h-6", faq: "h-8", buttons: "h-4", heading: "h-4", divider: "h-2", spacer: "h-3" };
  return (
    <div className="flex h-28 flex-col gap-1.5 overflow-hidden rounded-md border border-border bg-white p-2.5">
      <span className="h-1 w-1/5 shrink-0 rounded-full bg-brand-green/50" />
      <span className="h-2 w-3/5 shrink-0 rounded-full bg-[#9fb5ab]" />
      {blocks.length === 0 ? (
        <span className="mt-2 flex flex-1 items-center justify-center rounded-sm border border-dashed border-border-strong text-[0.625rem] text-muted">Empty</span>
      ) : (
        blocks.slice(0, 5).map((b) => <BlockSketch key={b.id} type={b.type} className={cn("shrink-0", tall[b.type] ?? "h-6")} />)
      )}
    </div>
  );
}
