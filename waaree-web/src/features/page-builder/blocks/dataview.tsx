"use client";

import { ArrowDown, ArrowUp, Calendar, ChevronLeft, ChevronRight, Database, ExternalLink, GalleryHorizontal, Hash, Image as ImageIcon, MousePointerClick, Plus, Search, Tag, Text, Type, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field as FormField } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { type Collection, type Field as DataField, type FieldType, type Item, RowDrawer, rowState, ShowValue, useCollection, useCollections, useItems, usePublicCollection, useStructure } from "@/features/collections";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { bar, Choice, listJson, parseList, Txt } from "../kit";
import type { BlockDef, Edit, Props } from "../types";

/* ── The card design: an ordered list of parts, each bound to a field of the data ──
 * Designing comes first: a part can exist before its data does (field "" + the name it will get).
 * “Make data for this” then creates a collection whose fields are exactly the card’s parts, and
 * adding a part later adds the field. Removing a part only takes it off the card; data is kept. */
type Kind = "picture" | "title" | "text" | "date" | "tag" | "number" | "button";
type Part = { as: Kind; field: string; name?: string; label?: string }; // label: a button's text

const KINDS: { as: Kind; label: string; icon: typeof Type; fits: FieldType[]; newType: FieldType; name: string }[] = [
  { as: "picture", label: "Picture", icon: ImageIcon, fits: ["image"], newType: "image", name: "Picture" },
  { as: "title", label: "Title", icon: Type, fits: ["text"], newType: "text", name: "Title" },
  { as: "text", label: "Description", icon: Text, fits: ["richtext", "text"], newType: "richtext", name: "Description" },
  { as: "date", label: "Date", icon: Calendar, fits: ["date"], newType: "date", name: "Date" },
  { as: "tag", label: "Tag", icon: Tag, fits: ["choice", "text", "boolean"], newType: "text", name: "Category" },
  { as: "number", label: "Number", icon: Hash, fits: ["number"], newType: "number", name: "Number" },
  { as: "button", label: "Button", icon: MousePointerClick, fits: ["link", "file"], newType: "link", name: "Link" },
];
const kindOf = (as: Kind) => KINDS.find((k) => k.as === as)!;
const asFor = (t: string, first: boolean): Kind => (t === "image" ? "picture" : t === "text" ? (first ? "title" : "text") : t === "richtext" ? "text" : t === "date" ? "date" : t === "number" ? "number" : t === "link" || t === "file" ? "button" : "tag");

/** The card’s parts; older blocks stored a plain list of fields, read here as parts. */
function partsOf(props: Props, fields: DataField[]): Part[] {
  const parts = parseList<Part>(props.slots);
  if (parts.length) return parts;
  const keys = parseList<string>(props.fields);
  const chosen = keys.length ? keys.map((k) => fields.find((f) => f.key === k)).filter(Boolean) : fields.slice(0, 4);
  let titled = false;
  return (chosen as DataField[]).map((f) => {
    const as = asFor(f.type, !titled && f.type === "text");
    if (as === "title") titled = true;
    return { as, field: f.key };
  });
}

/* ── Showing one part ──────────────────────────────────────────────────────── */
function PartView({ part, field, value, inCard }: { part: Part; field?: DataField; value: unknown; inCard: boolean }) {
  const empty = value === undefined || value === null || value === "";
  switch (part.as) {
    case "picture":
      // eslint-disable-next-line @next/next/no-img-element -- media library files
      return empty ? <div className={cn("flex items-center justify-center bg-(image:--brand-tint)", inCard ? "aspect-[4/3]" : "size-12 rounded-md")}><ImageIcon aria-hidden className="size-6 text-primary/40" /></div> : <img src={String(value)} alt="" className={cn("object-cover", inCard ? "aspect-[4/3] w-full" : "size-12 rounded-md")} />;
    case "title":
      return <h3 className="text-lg leading-snug font-medium text-foreground">{empty ? <span className="text-muted">{part.name ?? "Title"}</span> : String(value)}</h3>;
    case "date":
      return <p className="text-xs tracking-wide text-muted uppercase">{empty ? "—" : field ? <ShowValue field={field} value={value} /> : String(value)}</p>;
    case "tag":
      return empty ? null : <span className="inline-flex w-fit rounded-full bg-brand-green/10 px-2.5 py-0.5 text-xs font-medium text-primary-strong">{typeof value === "boolean" ? (value ? (field?.label ?? "Yes") : "") : String(value)}</span>;
    case "number":
      return <p className="bg-(image:--brand-gradient) bg-clip-text text-3xl font-light text-transparent tabular-nums">{empty ? "—" : Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>;
    case "button":
      return empty ? null : (
        <a href={String(value)} target={String(value).startsWith("http") ? "_blank" : undefined} rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary-strong hover:underline">
          {part.label || "Read more"} <ChevronRight aria-hidden className="size-4" />
        </a>
      );
    default:
      return empty ? null : <div className="text-sm leading-relaxed text-body">{field ? <ShowValue field={field} value={value} /> : String(value)}</div>;
  }
}

type Row = Record<string, unknown> & { id: number; __live?: boolean; __state?: string };

function Card({ parts, fields, row, onOpen }: { parts: Part[]; fields: DataField[]; row: Row; onOpen?: () => void }) {
  const pic = parts[0]?.as === "picture" ? parts[0] : null;
  const rest = pic ? parts.slice(1) : parts;
  const f = (p: Part) => fields.find((x) => x.key === p.field);
  return (
    <article
      onClick={onOpen}
      className={cn("group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white transition-shadow", onOpen && "cursor-pointer hover:shadow-soft")}
    >
      {row.__state && <span className="absolute top-2 left-2 z-10 rounded-full bg-white/95 px-2 py-0.5 text-[0.6875rem] font-medium text-body shadow-soft">{row.__state}</span>}
      {pic && <PartView part={pic} field={f(pic)} value={row[pic.field]} inCard />}
      <div className="flex flex-1 flex-col gap-2 p-5">
        {rest.map((p, i) => (
          <PartView key={i} part={p} field={f(p)} value={row[p.field]} inCard />
        ))}
      </div>
    </article>
  );
}

function Carousel({ children, count }: { children: React.ReactNode; count: number }) {
  const track = useRef<HTMLDivElement>(null);
  const go = (d: -1 | 1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: d * (el.clientWidth * 0.8), behavior: "smooth" });
  };
  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={`${count} items`}>
      <div className="mb-3 flex justify-end gap-1">
        <IconButton label="Previous" variant="secondary" size="sm" onClick={() => go(-1)}>
          <ChevronLeft aria-hidden />
        </IconButton>
        <IconButton label="Next" variant="secondary" size="sm" onClick={() => go(1)}>
          <ChevronRight aria-hidden />
        </IconButton>
      </div>
      <div ref={track} className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

/* ── The block on the page ─────────────────────────────────────────────────── */
function DataView({ props, edit }: { props: Props; edit?: Edit }) {
  const [q, setQ] = useState("");
  const [extra, setExtra] = useState(0);
  const [open, setOpen] = useState<Item | "new" | null>(null);
  const key = props.collection ?? "";
  const step = Number(props.limit || 6);
  const order = props.order === "asc" ? "asc" : "desc";
  // the website shows published rows; the editor shows drafts too (marked), so you can design first
  const live = usePublicCollection(edit ? undefined : key || undefined, { sort: props.sort || undefined, order, limit: step + extra, q });
  const col = useCollection(key, !!edit);
  const items = useItems(key, false, !!edit);

  const fields: DataField[] = edit ? (col.data?.fields ?? []).filter((f) => !f.hidden) : (live.data?.fields ?? []);
  const parts = partsOf(props, fields);
  const layout = props.layout || "table";

  let rows: Row[] = [];
  let total = 0;
  if (edit && col.data) {
    const term = q.trim().toLowerCase();
    let all: Row[] = (items.data ?? []).map((i) => ({ id: i.id, ...i.data, __live: i.live, __state: i.status === "published" ? undefined : rowState(i, col.data!).label }));
    if (term) all = all.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(term)));
    if (props.sort) all.sort((a, b) => (String(a[props.sort!] ?? "") < String(b[props.sort!] ?? "") ? -1 : 1) * (order === "asc" ? 1 : -1));
    total = all.length;
    rows = all.slice(0, step + extra);
  } else if (!edit) {
    rows = (live.data?.items ?? []) as Row[];
    total = live.data?.total ?? 0;
  }
  const openRow = edit && col.data ? (r: Row) => setOpen((items.data ?? []).find((i) => i.id === r.id) ?? null) : undefined;
  const loading = edit ? !!key && (col.isLoading || items.isLoading) : live.isLoading;

  if (!key && !edit) return null;
  if (!key)
    // designing before any data exists: show the card as it will look
    return (
      <section>
        {(edit || props.title) && <Txt as="h2" value={props.title ?? ""} onChange={edit && ((title) => edit({ title }))} placeholder="Heading (optional)" className="mb-5 text-2xl font-light tracking-tight text-foreground @xl:text-3xl" />}
        <div className={cn("grid gap-5", layout === "carousel" || layout === "cards" ? "@xl:grid-cols-2 @4xl:grid-cols-3" : "")}>
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn("opacity-60", i > 0 && "hidden @xl:block")}>
              <Card parts={parts} fields={[]} row={{ id: i }} />
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-dashed border-brand-green/40 bg-brand-green/[0.04] px-4 py-3 text-sm text-primary-strong">
          <Database aria-hidden className="size-4" /> Design the card on the right, then choose “Make data for this”.
        </p>
      </section>
    );

  return (
    <section>
      {(edit || props.title) && <Txt as="h2" value={props.title ?? ""} onChange={edit && ((title) => edit({ title }))} placeholder="Heading (optional)" className="mb-5 text-2xl font-light tracking-tight text-foreground @xl:text-3xl" />}
      {props.search === "yes" && (
        <label className="relative mb-5 block max-w-sm">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => (setQ(e.target.value), setExtra(0))} placeholder="Search" aria-label="Search" className="h-10 w-full rounded-md border border-border bg-white pr-3 pl-9 text-sm text-foreground outline-none focus:border-brand-green focus:shadow-glow" />
        </label>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-surface-muted" />
      ) : rows.length === 0 ? (
        edit ? (
          <button type="button" onClick={(e) => (e.stopPropagation(), setOpen("new"))} className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-brand-green/40 px-4 py-10 text-sm text-primary-strong hover:bg-brand-green/[0.04]">
            <Plus aria-hidden className="size-5" /> {q ? "Nothing matches." : "Add the first item"}
          </button>
        ) : (
          <p className="rounded-lg border border-border px-4 py-8 text-center text-sm text-muted">{q ? "Nothing matches your search." : "Nothing to show yet."}</p>
        )
      ) : layout === "carousel" ? (
        <Carousel count={rows.length}>
          {rows.map((r) => (
            <div key={r.id} className="w-[min(85%,20rem)] shrink-0 snap-start">
              <Card parts={parts} fields={fields} row={r} onOpen={openRow && (() => openRow(r))} />
            </div>
          ))}
        </Carousel>
      ) : layout === "cards" ? (
        <div className="grid gap-5 @xl:grid-cols-2 @4xl:grid-cols-3">
          {rows.map((r) => (
            <Card key={r.id} parts={parts} fields={fields} row={r} onOpen={openRow && (() => openRow(r))} />
          ))}
        </div>
      ) : layout === "list" ? (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((r) => (
            <li key={r.id} onClick={openRow && (() => openRow(r))} className={cn("flex flex-col gap-2 py-4 @xl:flex-row @xl:items-center @xl:gap-6", openRow && "cursor-pointer hover:bg-surface-muted/50")}>
              {parts.map((p, i) => (
                <div key={i} className={cn(p.as === "title" && "flex-1")}>
                  <PartView part={p} field={fields.find((x) => x.key === p.field)} value={r[p.field]} inCard={false} />
                </div>
              ))}
              {r.__state && <span className="text-xs text-muted">{r.__state}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-muted">
              <tr>
                {parts.map((p, i) => {
                  const fld = fields.find((x) => x.key === p.field);
                  return (
                    <th key={i} className={cn("px-4 py-3 font-medium text-foreground", fld?.type === "number" && "text-right")}>
                      {fld?.label ?? p.name}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={openRow && (() => openRow(r))} className={cn("border-t border-border even:bg-surface-muted/40", openRow && "cursor-pointer hover:bg-brand-green/[0.04]")}>
                  {parts.map((p, i) => {
                    const fld = fields.find((x) => x.key === p.field);
                    return (
                      <td key={i} className={cn("px-4 py-3 text-body", fld?.type === "number" && "text-right")}>
                        {fld ? <ShowValue field={fld} value={r[p.field]} compact /> : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length < total && (
        <div className="mt-6">
          <Button variant="secondary" onClick={() => setExtra((x) => x + step)}>
            Show more
          </Button>
        </div>
      )}
      {open && col.data && <RowDrawer c={col.data} item={open === "new" ? null : open} onClose={() => setOpen(null)} />}
    </section>
  );
}

/* ── The panel: design the card, connect or make its data, manage items ──────── */
function DataViewOptions({ props, onChange }: { props: Props; onChange: Edit }) {
  const cols = useCollections();
  const key = props.collection ?? "";
  const col = useCollection(key);
  const items = useItems(key);
  const structure = useStructure(key);
  const canAdd = useCan("data.edit");
  const fields = (col.data?.fields ?? []).filter((f) => !f.hidden);
  const parts = partsOf(props, fields);
  const [adding, setAdding] = useState<Kind | null>(null);
  const [open, setOpen] = useState<Item | "new" | null>(null);
  const [making, setMaking] = useState(false);
  const save = (next: Part[]) => onChange({ slots: listJson(next), fields: "[]" });
  const card = props.layout === "carousel" || props.layout === "cards";

  const makeData = async (name: string) => {
    try {
      const fieldsIn = parts.map((p) => ({ label: p.name || kindOf(p.as).name, type: kindOf(p.as).newType, required: p.as === "title" }));
      const c = await structure.create.mutateAsync({ name, description: "Made from a page’s card design", approval_required: false, origin: "cms", fields: fieldsIn, items: [] });
      // bind each part to the field it created (same order)
      onChange({ collection: c.key, slots: listJson(parts.map((p, i) => ({ ...p, field: c.fields[i]?.key ?? "" }))), fields: "[]" });
      setMaking(false);
      toast.success(`“${c.name}” is ready. Add items below.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const useExisting = (k: string) => {
    const c = (cols.data ?? []).find((x) => x.key === k);
    if (!c) return;
    const fs = c.fields.filter((f) => !f.hidden);
    // keep the design: bind each part to a matching field by name, then by type; else derive from the data
    const bound = parts.map((p) => ({ ...p, field: (fs.find((f) => f.label.toLowerCase() === (p.name ?? "").toLowerCase() && kindOf(p.as).fits.includes(f.type as FieldType)) ?? fs.find((f) => kindOf(p.as).fits.includes(f.type as FieldType)))?.key ?? "" }));
    const next = bound.every((p) => p.field) ? bound : partsOf({}, fs);
    onChange({ collection: k, slots: listJson(next), fields: "[]", sort: "" });
  };

  return (
    <div className="flex flex-col gap-5">
      <Choice
        label="Show as"
        value={props.layout || "table"}
        options={[
          { value: "carousel", label: "Carousel" },
          { value: "cards", label: "Cards" },
          { value: "list", label: "List" },
          { value: "table", label: "Table" },
        ]}
        onChange={(layout) => onChange({ layout })}
      />

      {/* the card design */}
      <section>
        <p className="mb-1.5 text-sm font-medium text-foreground">{card ? "Card design" : props.layout === "table" ? "Columns" : "What each item shows"}</p>
        <ol className="flex flex-col gap-1 rounded-lg border border-border p-1.5">
          {parts.map((p, i) => {
            const K = kindOf(p.as);
            const fld = fields.find((f) => f.key === p.field);
            const fits = fields.filter((f) => K.fits.includes(f.type as FieldType));
            return (
              <li key={i} className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-surface-muted">
                <K.icon aria-hidden className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-foreground">{K.label}</span>
                  {key ? (
                    fits.length > 1 ? (
                      <select aria-label={`${K.label} shows`} value={p.field} onChange={(e) => save(parts.map((x, j) => (j === i ? { ...x, field: e.target.value } : x)))} className="w-full truncate bg-transparent text-xs text-muted outline-none">
                        {fits.map((f) => (
                          <option key={f.key} value={f.key}>
                            from “{f.label}”
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="block truncate text-xs text-muted">{fld ? `from “${fld.label}”` : "not connected"}</span>
                    )
                  ) : (
                    <span className="block truncate text-xs text-muted">will be “{p.name || K.name}”</span>
                  )}
                </span>
                {p.as === "button" && <input aria-label="Button text" value={p.label ?? ""} placeholder="Read more" onChange={(e) => save(parts.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className="h-7 w-24 rounded-sm border border-border px-1.5 text-xs outline-none focus:border-brand-green" />}
                <IconButton label={`Move ${K.label} up`} size="sm" disabled={i === 0} onClick={() => save(swap(parts, i, i - 1))}>
                  <ArrowUp aria-hidden />
                </IconButton>
                <IconButton label={`Move ${K.label} down`} size="sm" disabled={i === parts.length - 1} onClick={() => save(swap(parts, i, i + 1))}>
                  <ArrowDown aria-hidden />
                </IconButton>
                <IconButton label={`Remove ${K.label} from the card`} size="sm" onClick={() => save(parts.filter((_, j) => j !== i))}>
                  <X aria-hidden />
                </IconButton>
              </li>
            );
          })}
        </ol>
        <Menu
          align="start"
          trigger={
            <button type="button" className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-3 py-2 text-sm text-primary-strong hover:bg-brand-green/5">
              <Plus aria-hidden className="size-4" /> Add to the {card ? "card" : "list"}
            </button>
          }
          items={KINDS.map((k) => ({ label: k.label, icon: k.icon, onSelect: () => setAdding(k.as) }))}
        />
        {key && <p className="mt-1.5 text-xs text-muted">Taking a part off the card keeps its data.</p>}
      </section>

      {/* where the items come from */}
      <section className="rounded-lg border border-border p-3">
        {!key ? (
          <>
            <p className="text-sm font-medium text-foreground">Where do the items come from?</p>
            <p className="mt-1 text-xs text-body">Make new data shaped like this card (its fields are the card’s parts), or use data you already have.</p>
            {canAdd && (
              <Button className="mt-3 w-full" onClick={() => setMaking(true)}>
                <Database aria-hidden /> Make data for this
              </Button>
            )}
            <div className="mt-3">
              <Select label="Use existing data" value={undefined} placeholder={cols.data?.length ? "Or use existing data…" : "No data yet"} onValueChange={useExisting} options={(cols.data ?? []).map((x) => ({ value: x.key, label: x.name }))} />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground">
                <Database aria-hidden className="size-4 shrink-0 text-primary" /> <span className="truncate">{col.data?.name ?? "…"}</span>
              </p>
              <Link href={`/cms/data/${key}`} target="_blank" className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary-strong hover:underline">
                Open in Data <ExternalLink aria-hidden className="size-3" />
              </Link>
            </div>
            <ul className="mt-2 flex max-h-56 flex-col overflow-y-auto">
              {(items.data ?? []).map((i) => {
                const title = parts.find((p) => p.as === "title") ?? parts.find((p) => p.as !== "picture");
                const s = col.data ? rowState(i, col.data) : null;
                return (
                  <li key={i.id}>
                    <button type="button" onClick={() => setOpen(i)} className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm hover:bg-surface-muted">
                      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", s?.dot)} />
                      <span className="min-w-0 flex-1 truncate text-foreground">{title ? String(i.data[title.field] ?? "Untitled") : `Item ${i.id}`}</span>
                      <span className="shrink-0 text-xs text-muted">{s?.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {canAdd && (
              <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={() => setOpen("new")}>
                <Plus aria-hidden /> Add an item
              </Button>
            )}
            <button type="button" onClick={() => onChange({ collection: "", sort: "" })} className="mt-2 text-xs text-muted hover:text-foreground">
              Use different data
            </button>
          </>
        )}
      </section>

      {key && (
        <>
          <FormField label="Sort by">
            <Select value={props.sort || "_order"} onValueChange={(v) => onChange({ sort: v === "_order" ? "" : v })} options={[{ value: "_order", label: "Newest first" }, ...fields.map((f) => ({ value: f.key, label: f.label }))]} />
          </FormField>
          {props.sort && (
            <Choice
              label="Order"
              value={props.order === "asc" ? "asc" : "desc"}
              options={[
                { value: "desc", label: "Highest / latest first" },
                { value: "asc", label: "Lowest / earliest first" },
              ]}
              onChange={(order) => onChange({ order })}
            />
          )}
          <Choice label="How many at first" value={props.limit || "6"} options={["3", "6", "12", "24"].map((n) => ({ value: n, label: n }))} onChange={(limit) => onChange({ limit })} />
          <Choice label="Search box" value={props.search === "yes" ? "yes" : "no"} options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} onChange={(search) => onChange({ search })} />
          <p className="rounded-md bg-surface-muted px-3 py-2 text-xs text-body">Visitors see live items only. Items you add here show up in the editor right away, marked until they’re published.</p>
        </>
      )}

      {adding && <AddPart kind={adding} c={col.data ?? null} parts={parts} onClose={() => setAdding(null)} onAdd={(p) => save([...parts, p])} />}
      {making && <MakeData suggested={props.layout === "carousel" ? "Carousel items" : "Items"} parts={parts} onClose={() => setMaking(false)} onMake={makeData} busy={structure.create.isPending} />}
      {open && col.data && <RowDrawer c={col.data} item={open === "new" ? null : open} onClose={() => setOpen(null)} />}
    </div>
  );
}

const swap = <T,>(a: T[], i: number, j: number) => {
  const c = [...a];
  [c[i], c[j]] = [c[j]!, c[i]!];
  return c;
};

/** Add a part to the card: use a field the data already has, or make a new field (added to the data). */
function AddPart({ kind, c, parts, onClose, onAdd }: { kind: Kind; c: Collection | null; parts: Part[]; onClose: () => void; onAdd: (p: Part) => void }) {
  const K = kindOf(kind);
  const structure = useStructure(c?.key);
  const used = new Set(parts.map((p) => p.field));
  const fits = (c?.fields ?? []).filter((f) => !f.hidden && K.fits.includes(f.type as FieldType) && !used.has(f.key));
  const [choice, setChoice] = useState<string>(fits[0]?.key ?? "_new");
  const [name, setName] = useState(K.name);
  const add = async () => {
    if (!c) {
      onAdd({ as: kind, field: "", name: name.trim() || K.name }); // data comes later
      onClose();
      return;
    }
    if (choice !== "_new") {
      onAdd({ as: kind, field: choice });
      onClose();
      return;
    }
    try {
      const next = await structure.addField.mutateAsync({ label: name.trim() || K.name, type: K.newType, required: false });
      const created = next.fields.at(-1)!;
      onAdd({ as: kind, field: created.key });
      toast.success(`Added “${created.label}” to the card and to “${c.name}”. Existing items show it empty until filled in.`);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={`Add ${K.label.toLowerCase()} to the card`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={add} loading={structure.addField.isPending}>
            Add
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {c && fits.length > 0 && (
          <div role="radiogroup" aria-label="Which field" className="flex flex-col gap-1.5">
            {fits.map((f) => (
              <label key={f.key} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm", choice === f.key ? "border-brand-green bg-brand-green/[0.04]" : "border-border")}>
                <input type="radio" name="field" checked={choice === f.key} onChange={() => setChoice(f.key)} className="accent-[#0db02b]" /> Show “{f.label}” (already in the data)
              </label>
            ))}
            <label className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm", choice === "_new" ? "border-brand-green bg-brand-green/[0.04]" : "border-border")}>
              <input type="radio" name="field" checked={choice === "_new"} onChange={() => setChoice("_new")} className="accent-[#0db02b]" /> A new field
            </label>
          </div>
        )}
        {(!c || choice === "_new") && (
          <FormField label="Name" hint={c ? `It’s added to “${c.name}”. Items you already have show it empty until you fill it in.` : "The data is made later, with “Make data for this”."}>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void add()} />
          </FormField>
        )}
      </div>
    </Dialog>
  );
}

function MakeData({ suggested, parts, onClose, onMake, busy }: { suggested: string; parts: Part[]; onClose: () => void; onMake: (name: string) => void; busy: boolean }) {
  const [name, setName] = useState(suggested);
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Make data for this"
      description="A new list in Data, with one field for each part of your card. You can add more parts (and fields) any time."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onMake(name.trim())} loading={busy} disabled={!name.trim() || !parts.length}>
            Make data
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Name">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Blog posts" />
        </FormField>
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Its fields</p>
          <ul className="flex flex-wrap gap-1.5">
            {parts.map((p, i) => {
              const K = kindOf(p.as);
              return (
                <li key={i} className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-sm text-body">
                  <K.icon aria-hidden className="size-3.5 text-primary" /> {p.name || K.name}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Dialog>
  );
}

/* ── The two gallery entries share this block ───────────────────────────────── */
const SKETCH = () => (
  <div className="flex h-full flex-col justify-center gap-1 px-[8%]">
    <span className="flex items-center gap-1">
      <Database aria-hidden className="size-2.5 text-primary/70" />
      <span className={cn(bar, "h-1 w-1/3")} />
    </span>
    {[0, 1, 2].map((i) => (
      <span key={i} className="flex gap-1">
        <span className="h-1.5 w-1/3 rounded-sm bg-brand-green/40" />
        <span className={cn(bar, "h-1.5 flex-1")} />
      </span>
    ))}
  </div>
);
const base = { collection: "", fields: "[]", sort: "", order: "desc", limit: "6", search: "no", title: "" };

export const dataview: BlockDef = {
  type: "dataview",
  label: "Data view",
  hint: "A table, cards or list from your data",
  icon: Database,
  group: "Data",
  defaults: () => ({ ...base, layout: "table", slots: "[]" }),
  Render: ({ props, edit }) => <DataView props={props} edit={edit} />,
  Options: ({ props, onChange }) => <DataViewOptions props={props} onChange={onChange} />,
  Sketch: SKETCH,
};

export const carousel: BlockDef = {
  type: "carousel",
  label: "Carousel",
  hint: "Sliding cards you design; the data follows",
  icon: GalleryHorizontal,
  group: "Data",
  defaults: () => ({ ...base, layout: "carousel", slots: listJson([{ as: "picture", field: "", name: "Picture" }, { as: "title", field: "", name: "Title" }]) }),
  Render: ({ props, edit }) => <DataView props={props} edit={edit} />,
  Options: ({ props, onChange }) => <DataViewOptions props={props} onChange={onChange} />,
  Sketch: () => (
    <div className="flex h-full items-center gap-[4%] overflow-hidden px-[6%]">
      {[0, 1, 2].map((i) => (
        <span key={i} className="flex h-4/5 w-[38%] shrink-0 flex-col overflow-hidden rounded-sm border border-[#d5dfdb] bg-white">
          <span className="h-3/5 bg-[linear-gradient(135deg,#d7eadf,#cfe5f1)]" />
          <span className={cn(bar, "m-1 h-1 w-3/4")} />
        </span>
      ))}
    </div>
  ),
};
