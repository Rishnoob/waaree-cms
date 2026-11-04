"use client";

import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, FileUp, GripVertical, LoaderCircle, MousePointerClick, Plus, Puzzle, Search, Trash2, Upload as UploadIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { toast } from "@/components/ui/toast";
import { useUpload } from "@/features/media";
import { cn } from "@/lib/utils/cn";

import { useCustomBlocks } from "./custom";
import { ACCEPTED, blocksFromFiles } from "./imports";
import { Choice, Txt } from "./kit";
import { blockDef, BLOCKS, GROUPS } from "./registry";
import { BlockSketch, blockLabel, makeBlock, newId, parseBlocks, RenderBlock, withIds } from "./render";
import type { Block, BlockStyle } from "./types";

export type Device = "desktop" | "tablet" | "phone";
const NEW = "new:"; // drag ids for things dragged in from the gallery
const CUSTOM = "custom:";
const END = "canvas-end";

/**
 * The page editor canvas: the page exactly as visitors will see it, editable in place.
 * - Click any text and type; longer text is a rich text editor (select words for the format bar).
 * - Click a section for its toolbar and its Content/Look panel. Drag its ⠿ handle to move it.
 * - Drag a block from the gallery onto the page, or use “Add a section” between sections.
 * - Drop files on the page: Excel/CSV → table, Word → text, pictures, PDFs → downloads, videos.
 * `device` previews the page at tablet or phone width (the blocks use container queries, so this
 * is the real layout). `bare` hides the page title and intro (used for custom blocks).
 */
export function PageCanvas({
  title = "",
  onTitle,
  intro = "",
  onIntro,
  blocks,
  onBlocks,
  readOnly = false,
  eyebrow = "",
  bare = false,
  device = "desktop",
}: {
  title?: string;
  onTitle?: (v: string) => void;
  intro?: string;
  onIntro?: (v: string) => void;
  blocks: Block[];
  onBlocks: (b: Block[]) => void;
  readOnly?: boolean;
  eyebrow?: string;
  bare?: boolean;
  device?: Device;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [dragging, setDragging] = useState<{ label: string; type: string } | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null); // where a gallery block or file will land
  const [fileOver, setFileOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const pointerY = useRef(0);
  const reveal = useRef<number | null>(null); // a section just added from the panel: scroll to it once it's drawn

  useEffect(() => {
    if (reveal.current === null) return;
    const el = card.current?.querySelector<HTMLElement>(`[data-block-id="${reveal.current}"]`);
    reveal.current = null;
    if (!el) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "center" });
    // a brief green glow on the section itself, so the eye finds it
    el.querySelector<HTMLElement>(":scope > [role=group]")?.animate([{ boxShadow: "0 0 0 6px rgb(13 176 43 / 0.3)" }, { boxShadow: "0 0 0 0 rgb(13 176 43 / 0)" }], { duration: 1200, easing: "ease-out" });
  });
  const upload = useUpload();
  const custom = useCustomBlocks();
  const current = blocks.find((b) => b.id === selected) ?? null;

  const patch = (id: number, fn: (b: Block) => Block) => onBlocks(blocks.map((b) => (b.id === id ? fn(b) : b)));
  const move = (id: number, d: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id);
    if (i + d < 0 || i + d >= blocks.length) return;
    onBlocks(arrayMove(blocks, i, i + d));
  };
  /** Add sections at a spot. From the panel (or a file) the page scrolls to them; a drag lands under the pointer, so it doesn't. */
  const insert = (added: Block[], at = insertAt ?? blocks.length, scroll = true) => {
    onBlocks([...blocks.slice(0, at), ...added, ...blocks.slice(at)]);
    setInsertAt(null);
    setSelected(added[0]?.id ?? null);
    if (scroll && added[0]) reveal.current = added[0].id;
  };
  const select = (id: number | null) => {
    setSelected(id);
    setInsertAt(null);
  };
  const fromGallery = (id: string): Block[] => {
    if (id.startsWith(NEW)) return [makeBlock(id.slice(NEW.length), newId(blocks))];
    const c = (custom.data ?? []).find((x) => `${CUSTOM}${x.id}` === id);
    return c ? withIds(parseBlocks(c.body), newId(blocks)) : [];
  };

  /* files → sections */
  const addFiles = async (files: File[], at: number) => {
    if (!files.length) return;
    setImporting(true);
    try {
      const { blocks: made, notes } = await blocksFromFiles(files, async (file) => upload.mutateAsync({ file }));
      if (made.length) {
        insert(withIds(made.map((b) => ({ ...b, id: 0 })), newId(blocks)), at);
        toast.success(`Added ${made.length} ${made.length === 1 ? "section" : "sections"} from ${files.length === 1 ? files[0]!.name : `${files.length} files`}`);
      }
      notes.forEach((n) => toast.message(n));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  };
  const indexAtY = (y: number) => {
    const els = Array.from(card.current?.querySelectorAll<HTMLElement>("[data-block-index]") ?? []);
    const hit = els.find((el) => {
      const r = el.getBoundingClientRect();
      return y < r.top + r.height / 2;
    });
    return hit ? Number(hit.dataset.blockIndex) : blocks.length;
  };

  /* drag and drop */
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const isExternal = (id: unknown) => String(id).startsWith(NEW) || String(id).startsWith(CUSTOM);
  const collision: CollisionDetection = (args) => (isExternal(args.active.id) ? pointerWithin(args) : closestCenter(args));
  const landing = (e: DragOverEvent | DragEndEvent) => {
    if (!e.over) return null;
    if (e.over.id === END) return blocks.length;
    const i = blocks.findIndex((b) => b.id === e.over!.id);
    if (i < 0) return null;
    // before or after the section itself (not counting the gap below it), by where the pointer is now
    // (the library's own delta also counts the gallery's scrolling, so the pointer is tracked directly)
    const r = card.current?.querySelector(`[data-block-index="${i}"] > [role=group]`)?.getBoundingClientRect() ?? e.over.rect;
    return i + (pointerY.current > r.top + r.height / 2 ? 1 : 0);
  };
  const trackPointer = (ev: PointerEvent) => {
    pointerY.current = ev.clientY;
  };
  const onDragStart = (e: DragStartEvent) => {
    const start = e.activatorEvent as PointerEvent;
    pointerY.current = "clientY" in start ? start.clientY : 0;
    window.addEventListener("pointermove", trackPointer);
    const id = String(e.active.id);
    if (id.startsWith(NEW)) setDragging({ label: blockDef(id.slice(NEW.length))?.label ?? "Section", type: id.slice(NEW.length) });
    else if (id.startsWith(CUSTOM)) setDragging({ label: (custom.data ?? []).find((c) => `${CUSTOM}${c.id}` === id)?.name ?? "Custom block", type: "" });
    else {
      const b = blocks.find((x) => x.id === e.active.id);
      setDragging({ label: b ? blockLabel(b.type) : "Section", type: b?.type ?? "" });
    }
  };
  const onDragOver = (e: DragOverEvent) => setDropAt(isExternal(e.active.id) ? landing(e) : null);
  const onDragEnd = (e: DragEndEvent) => {
    window.removeEventListener("pointermove", trackPointer);
    setDragging(null);
    setDropAt(null);
    if (isExternal(e.active.id)) {
      const at = landing(e);
      if (at !== null) insert(fromGallery(String(e.active.id)), at, false);
      return;
    }
    if (!e.over || e.active.id === e.over.id || e.over.id === END) return;
    const from = blocks.findIndex((b) => b.id === e.active.id);
    const to = blocks.findIndex((b) => b.id === e.over!.id);
    if (from >= 0 && to >= 0) onBlocks(arrayMove(blocks, from, to));
  };

  const frame = cn(
    "@container min-w-0 bg-white transition-[max-width] duration-300",
    device === "desktop" && "rounded-xl border border-border shadow-soft",
    device === "tablet" && "mx-auto w-full max-w-[820px] rounded-[1.5rem] border-[10px] border-[#1d2a25] shadow-lg",
    device === "phone" && "mx-auto w-full max-w-[400px] rounded-[2.25rem] border-[10px] border-[#1d2a25] shadow-lg",
  );

  const page = (
    <article className="px-6 py-12 @xl:px-12 @xl:py-16">
      {!bare && (
        <>
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
            Waaree
            <span aria-hidden className="h-px w-6 bg-border-strong" />
            <span className="text-muted">{eyebrow}</span>
          </p>
          <Txt as="h1" value={title} onChange={readOnly ? undefined : onTitle} placeholder="Page title" className="mt-5 max-w-4xl text-4xl leading-[1.08] font-light tracking-tight text-balance text-foreground @xl:text-5xl" />
          <Txt as="p" value={intro} onChange={readOnly ? undefined : onIntro} placeholder="Add a one-line introduction (optional). Google shows it in search results too." multiline className="mt-6 max-w-3xl text-xl leading-relaxed font-light text-body" />
        </>
      )}

      <div className={cn(!bare && "mt-12 border-t border-border pt-10")}>
        {blocks.length === 0 && !readOnly && <EmptyDrop over={dropAt === 0} onClick={() => setInsertAt(0)} />}
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className={cn("flex flex-col", readOnly && "gap-10")}>
            {blocks.map((b, i) => (
              <SortableSection
                key={b.id}
                block={b}
                index={i}
                count={blocks.length}
                selected={selected === b.id}
                readOnly={readOnly}
                lineBefore={dropAt === i}
                lineAfter={dropAt === blocks.length && i === blocks.length - 1}
                insertActive={insertAt === i + 1}
                onInsert={() => setInsertAt(i + 1)}
                onSelect={() => select(b.id)}
                onEdit={(props) => patch(b.id, (x) => ({ ...x, props: { ...x.props, ...props } }))}
                onMove={(d) => move(b.id, d)}
                onDuplicate={() => {
                  const copy = { ...structuredClone(b), id: newId(blocks) };
                  onBlocks([...blocks.slice(0, i + 1), copy, ...blocks.slice(i + 1)]);
                  setSelected(copy.id);
                }}
                onToggle={() => patch(b.id, (x) => ({ ...x, visible: !x.visible }))}
                onRemove={() => {
                  onBlocks(blocks.filter((x) => x.id !== b.id));
                  select(null);
                }}
              />
            ))}
          </div>
        </SortableContext>
        {blocks.length > 0 && !readOnly && <EndDrop />}
      </div>
    </article>
  );

  if (readOnly)
    return (
      <DndContext>
        <div className={frame} data-device={device}>
          {page}
        </div>
      </DndContext>
    );

  return (
    <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={() => {
        window.removeEventListener("pointermove", trackPointer);
        setDragging(null);
        setDropAt(null);
      }}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div
          ref={card}
          data-device={device}
          className={cn(frame, "relative")}
          onClick={(e) => e.target === e.currentTarget && select(null)}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes("Files")) return;
            e.preventDefault();
            setFileOver(true);
            setDropAt(indexAtY(e.clientY));
          }}
          onDragLeave={(e) => {
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setFileOver(false);
            setDropAt(null);
          }}
          onDrop={(e) => {
            if (!e.dataTransfer.files.length) return;
            e.preventDefault();
            const at = indexAtY(e.clientY);
            setFileOver(false);
            setDropAt(null);
            void addFiles(Array.from(e.dataTransfer.files), at);
          }}
        >
          {page}
          {(fileOver || importing) && (
            <div className="pointer-events-none absolute inset-x-4 top-4 z-30 flex items-center gap-3 rounded-lg border border-brand-green bg-white/95 px-4 py-3 shadow-lg">
              {importing ? <LoaderCircle aria-hidden className="size-5 animate-spin text-primary" /> : <FileUp aria-hidden className="size-5 text-primary" />}
              <span className="text-sm text-foreground">
                {importing ? "Making sections from your files…" : <>Drop to add here. <span className="text-muted">{ACCEPTED}</span></>}
              </span>
            </div>
          )}
        </div>

        <aside aria-label="Section options" className="rounded-xl border border-border bg-white shadow-soft lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          {insertAt !== null || (!current && blocks.length === 0) ? (
            <Panel title={blocks.length === 0 ? "Add the first section" : "Add a section"} onClose={blocks.length ? () => setInsertAt(null) : undefined}>
              <Gallery onPick={(id) => insert(fromGallery(id))} onFiles={(files) => void addFiles(files, insertAt ?? blocks.length)} busy={importing} hideCustom={bare} />
            </Panel>
          ) : current ? (
            <Panel title={blockLabel(current.type)} onClose={() => select(null)}>
              <SectionOptions key={current.id} block={current} onProps={(props) => patch(current.id, (x) => ({ ...x, props: { ...x.props, ...props } }))} onStyle={(style) => patch(current.id, (x) => ({ ...x, style: { ...x.style, ...style } }))} />
            </Panel>
          ) : (
            <Panel title={bare ? "Edit this block" : "Edit this page"}>
              <ul className="flex flex-col gap-3 text-sm text-body">
                <li className="flex gap-3">
                  <MousePointerClick aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                  Click any text and type. Select words for bold, links, lists and more.
                </li>
                <li className="flex gap-3">
                  <GripVertical aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                  Drag a block from below onto the page, or drag a section’s ⠿ handle to move it.
                </li>
                <li className="flex gap-3">
                  <FileUp aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                  Drop files on the page: Excel or CSV becomes a table, Word becomes text.
                </li>
              </ul>
              <p className="mt-6 mb-3 text-sm font-medium text-foreground">Add a section</p>
              <Gallery onPick={(id) => insert(fromGallery(id))} onFiles={(files) => void addFiles(files, blocks.length)} busy={importing} hideCustom={bare} />
            </Panel>
          )}
        </aside>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging && (
          <div className="flex w-56 items-center gap-3 rounded-lg border border-brand-green bg-white p-2.5 shadow-lg">
            {dragging.type ? <BlockSketch type={dragging.type} className="h-9 w-14 shrink-0 rounded-md bg-surface-muted" /> : <Puzzle aria-hidden className="size-5 text-primary" />}
            <span className="truncate text-sm font-medium text-foreground">{dragging.label}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Panel({ title, onClose, children }: { title: string; onClose?: () => void; children: React.ReactNode }) {
  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-light tracking-tight text-foreground">{title}</h2>
        {onClose && (
          <IconButton label="Close" size="sm" onClick={onClose}>
            <X aria-hidden />
          </IconButton>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyDrop({ over, onClick }: { over: boolean; onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: END });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-6 py-16 text-center transition-colors focus-visible:shadow-glow focus-visible:outline-none",
        isOver || over ? "border-brand-green bg-brand-green/[0.08]" : "border-brand-green/35 bg-brand-green/[0.03] hover:border-brand-green/60 hover:bg-brand-green/[0.06]",
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-primary text-white">
        <Plus aria-hidden className="size-5" />
      </span>
      <span className="text-lg font-light text-foreground">Add the first section</span>
      <span className="text-sm text-muted">Pick one, drag one here, or drop a file (Excel, Word, pictures…)</span>
    </button>
  );
}

/** A drop zone under the last section, so a block can be dragged to the very end. */
function EndDrop() {
  const { setNodeRef } = useDroppable({ id: END });
  return <div ref={setNodeRef} className="h-16" aria-hidden />;
}

/** Every block type as a picture (drag or click), grouped, with search; your custom blocks; and “from a file”. */
export function Gallery({ onPick, onFiles, busy = false, hideCustom = false }: { onPick: (id: string) => void; onFiles: (files: File[]) => void; busy?: boolean; hideCustom?: boolean }) {
  const [q, setQ] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const custom = useCustomBlocks();
  const term = q.trim().toLowerCase();
  const match = (s: string) => !term || s.toLowerCase().includes(term);
  const mine = hideCustom ? [] : (custom.data ?? []).filter((c) => match(`${c.name} ${c.description ?? ""}`));
  return (
    <div className="flex flex-col gap-5">
      <label className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a block" aria-label="Find a block" className="h-9 w-full rounded-md border border-border bg-white pr-3 pl-9 text-sm outline-none focus:border-brand-green focus:shadow-glow" />
      </label>

      <input ref={file} type="file" multiple hidden aria-label="Files to turn into sections" accept=".xlsx,.csv,.docx,image/*,application/pdf,video/*" onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => file.current?.click()}
        className="flex items-center gap-3 rounded-lg border border-dashed border-brand-green/50 bg-brand-green/[0.04] px-3 py-3 text-left transition-colors hover:bg-brand-green/[0.08] focus-visible:shadow-glow focus-visible:outline-none"
      >
        {busy ? <LoaderCircle aria-hidden className="size-5 animate-spin text-primary" /> : <UploadIcon aria-hidden className="size-5 text-primary" />}
        <span>
          <span className="block text-sm font-medium text-foreground">Make sections from a file</span>
          <span className="block text-xs text-muted">Excel or CSV → table · Word → text · pictures · PDFs</span>
        </span>
      </button>

      {mine.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-[0.6875rem] font-medium tracking-[0.16em] text-muted uppercase">
            <Puzzle aria-hidden className="size-3.5" /> Your blocks
          </h3>
          <div className="flex flex-col gap-1.5">
            {mine.map((c) => (
              <GalleryItem key={c.id} id={`${CUSTOM}${c.id}`} label={c.name} onPick={onPick}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-(image:--brand-tint) text-primary">
                  <Puzzle aria-hidden className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{c.name}</span>
                  <span className="block truncate text-xs text-muted">{c.description || `${parseBlocks(c.body).length} sections`}</span>
                </span>
              </GalleryItem>
            ))}
          </div>
        </section>
      )}
      {GROUPS.map((g) => {
        const defs = BLOCKS.filter((d) => d.group === g && match(`${d.label} ${d.hint}`));
        if (!defs.length) return null;
        return (
          <section key={g}>
            <h3 className="mb-2 text-[0.6875rem] font-medium tracking-[0.16em] text-muted uppercase">{g}</h3>
            <div className="grid grid-cols-2 gap-2">
              {defs.map((d) => (
                <GalleryItem key={d.type} id={`${NEW}${d.type}`} label={d.label} onPick={onPick} tile>
                  <BlockSketch type={d.type} className="h-12 rounded-md bg-surface-muted" />
                  <span className="px-1 pb-1">
                    <span className="block text-sm font-medium text-foreground">{d.label}</span>
                    <span className="block text-xs leading-snug text-muted">{d.hint}</span>
                  </span>
                </GalleryItem>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** A gallery entry: click to add (at the chosen spot or the end), or drag it onto the page. */
function GalleryItem({ id, label, onPick, tile = false, children }: { id: string; label: string; onPick: (id: string) => void; tile?: boolean; children: React.ReactNode }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={() => onPick(id)}
      aria-label={`Add ${label}`}
      aria-roledescription="draggable block"
      className={cn(
        "group cursor-grab touch-none rounded-lg border border-border text-left transition-all hover:border-brand-green hover:shadow-soft focus-visible:shadow-glow focus-visible:outline-none active:cursor-grabbing",
        tile ? "flex flex-col gap-2 p-2 hover:-translate-y-0.5" : "flex items-center gap-3 p-2.5",
        isDragging && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function Inserter({ active, last, onClick }: { active: boolean; last: boolean; onClick: () => void }) {
  return (
    <div className={cn("group/ins relative flex items-center justify-center", last ? "py-6" : "py-4")}>
      <span aria-hidden className={cn("absolute inset-x-0 top-1/2 h-px transition-colors", active ? "bg-brand-green" : "bg-transparent group-hover/ins:bg-brand-green/40")} />
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative flex items-center gap-1.5 rounded-full border bg-white px-3 py-1 text-xs font-medium shadow-soft transition-all focus-visible:shadow-glow focus-visible:outline-none",
          active ? "border-brand-green text-primary-strong opacity-100" : "border-border text-body hover:border-brand-green hover:text-primary-strong",
          !last && !active && "opacity-0 group-hover/ins:opacity-100 focus-visible:opacity-100",
        )}
      >
        <Plus aria-hidden className="size-3.5" /> Add a section{active && " here"}
      </button>
    </div>
  );
}

const DropLine = ({ at }: { at: "top" | "bottom" }) => (
  <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 z-20 flex items-center", at === "top" ? "-top-1" : "-bottom-1")}>
    <span className="size-2.5 rounded-full border-2 border-brand-green bg-white" />
    <span className="h-0.5 flex-1 bg-brand-green" />
  </div>
);

function SortableSection({
  block,
  index,
  count,
  selected,
  readOnly,
  lineBefore,
  lineAfter,
  insertActive,
  onInsert,
  onSelect,
  onEdit,
  onMove,
  onDuplicate,
  onToggle,
  onRemove,
}: {
  block: Block;
  index: number;
  count: number;
  selected: boolean;
  readOnly: boolean;
  lineBefore: boolean;
  lineAfter: boolean;
  insertActive: boolean;
  onInsert: () => void;
  onSelect: () => void;
  onEdit: (props: Record<string, string>) => void;
  onMove: (d: -1 | 1) => void;
  onDuplicate: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: block.id, disabled: readOnly });
  if (readOnly) return block.visible ? <RenderBlock block={block} /> : null;
  const label = blockLabel(block.type);
  return (
    <div ref={setNodeRef} data-block-index={index} data-block-id={block.id} style={{ transform: CSS.Translate.toString(transform), transition: transition }} className={cn("relative", isDragging && "z-10 opacity-40")}>
      {lineBefore && <DropLine at="top" />}
      <div
        role="group"
        aria-label={`${label} section`}
        onClick={onSelect}
        onFocus={onSelect}
        className={cn("group/section relative -mx-3 rounded-lg p-3 outline-2 outline-offset-0 transition-[outline-color]", selected ? "outline-brand-green" : "outline-transparent hover:outline-brand-green/25")}
      >
        <div
          className={cn(
            "absolute -top-4 right-3 z-10 flex items-center gap-0.5 rounded-lg border border-border bg-white p-0.5 shadow-soft transition-opacity",
            selected || !block.visible ? "opacity-100" : "pointer-events-none opacity-0 group-hover/section:pointer-events-auto group-hover/section:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Drag ${label} to move it`}
            title="Drag to move"
            className="flex size-8 cursor-grab touch-none items-center justify-center rounded-md text-muted hover:bg-foreground/5 hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none active:cursor-grabbing"
          >
            <GripVertical aria-hidden className="size-4" />
          </button>
          <span className="pr-1.5 text-xs font-medium text-foreground">{label}</span>
          {selected && (
            <>
              <IconButton label={`Move ${label} up`} size="sm" disabled={index === 0} onClick={() => onMove(-1)}>
                <ArrowUp aria-hidden />
              </IconButton>
              <IconButton label={`Move ${label} down`} size="sm" disabled={index === count - 1} onClick={() => onMove(1)}>
                <ArrowDown aria-hidden />
              </IconButton>
              <IconButton label={`Duplicate ${label}`} size="sm" onClick={onDuplicate}>
                <Copy aria-hidden />
              </IconButton>
            </>
          )}
          <IconButton label={block.visible ? `Hide ${label}` : `Show ${label}`} size="sm" onClick={onToggle}>
            {block.visible ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
          </IconButton>
          {selected && (
            <IconButton label={`Remove ${label}`} size="sm" onClick={onRemove}>
              <Trash2 aria-hidden />
            </IconButton>
          )}
        </div>
        <div className={cn(!block.visible && "opacity-35")}>
          <RenderBlock block={block} edit={onEdit} />
        </div>
        {!block.visible && <p className="mt-2 text-xs text-muted">Hidden: visitors won’t see this section.</p>}
      </div>
      <Inserter active={insertActive} last={index === count - 1} onClick={onInsert} />
      {lineAfter && <DropLine at="bottom" />}
    </div>
  );
}

/** A selected section’s panel: Content (what can’t be typed on the page) and Look. */
function SectionOptions({ block, onProps, onStyle }: { block: Block; onProps: (p: Record<string, string>) => void; onStyle: (s: BlockStyle) => void }) {
  const def = blockDef(block.type);
  const [tab, setTab] = useState<"content" | "look">(def?.Options ? "content" : "look");
  const s = block.style ?? {};
  return (
    <div>
      <div role="tablist" aria-label="Section settings" className="mb-4 grid grid-cols-2 rounded-lg bg-surface-muted p-1">
        {(
          [
            ["content", "Content"],
            ["look", "Look"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("rounded-md py-1.5 text-sm transition-colors focus-visible:shadow-glow focus-visible:outline-none", tab === k ? "bg-white font-medium text-foreground shadow-soft" : "text-body hover:text-foreground")}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "content" ? (
        def?.Options ? (
          <def.Options props={block.props} onChange={onProps} />
        ) : (
          <p className="text-sm text-body">Everything in this section can be typed straight onto the page.</p>
        )
      ) : (
        <div className="flex flex-col gap-4">
          <Choice
            label="Background"
            value={s.bg ?? "none"}
            options={[
              { value: "none", label: "None" },
              { value: "soft", label: "Soft" },
              { value: "tint", label: "Green tint" },
              { value: "dark", label: "Dark" },
              { value: "brand", label: "Brand" },
            ]}
            onChange={(bg) => onStyle({ bg })}
          />
          <Choice label="Width" value={s.width ?? "normal"} options={[{ value: "normal", label: "Full width" }, { value: "narrow", label: "Narrow" }]} onChange={(width) => onStyle({ width })} />
          <Choice label="Alignment" value={s.align ?? "left"} options={[{ value: "left", label: "Left" }, { value: "center", label: "Centre" }]} onChange={(align) => onStyle({ align })} />
          <Choice label="Space around" value={s.space ?? "normal"} options={[{ value: "compact", label: "Less" }, { value: "normal", label: "Normal" }, { value: "roomy", label: "More" }]} onChange={(space) => onStyle({ space })} />
        </div>
      )}
    </div>
  );
}
