"use client";

import { ExternalLink, Image as ImageIcon, RotateCcw, Send, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field as FormField } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { MediaPicker, useMedia } from "@/features/media";
import { RichField } from "@/features/page-builder";
import { useCan, useSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { ShowValue } from "../fields";
import { type Collection, type Field, type Item, type Step, useRows, useVersions } from "../hooks";

/** A row’s state in plain words. */
export function rowState(i: Item, c: Collection): { label: string; dot: string } {
  if (i.status === "in_review") return { label: "Waiting for approval", dot: "bg-[#f59e0b]" };
  if (i.status === "published") return { label: "Live", dot: "bg-brand-green" };
  if (i.live) return { label: c.approval_required ? "Live · changes not sent" : "Live · changes not published", dot: "bg-brand-green" };
  return { label: "Draft", dot: "bg-[#b9c1bd]" };
}

const DID: Record<string, string> = {
  created: "added the row",
  imported: "imported the row",
  edited: "edited it",
  submitted: "sent it for approval",
  published: "published it",
  rejected: "asked for changes",
  unpublished: "took it off the website",
  deleted: "moved it to Trash",
  restored: "restored it",
};

/** Add or edit a row: a form with the right input for each field, the publishing steps, and history. */
export function RowDrawer({ c, item, onClose }: { c: Collection; item: Item | null; onClose: () => void }) {
  const rows = useRows(c.key);
  const session = useSession();
  const me = session.status === "authenticated" ? session.user : null;
  const canEdit = useCan("data.edit");
  const canPublish = useCan("data.publish");
  const versions = useVersions(item?.id ?? null);
  const [data, setData] = useState<Record<string, unknown>>(() => ({ ...(item?.data ?? {}) }));
  const [current, setCurrent] = useState<Item | null>(item);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const fields = c.fields.filter((f) => !f.hidden);
  const locked = current?.status === "in_review" || current?.in_trash;
  const dirty = JSON.stringify(data) !== JSON.stringify(current?.data ?? {});
  const sentByMe = !!me && (versions.data ?? []).find((v) => v.action === "submitted")?.actor_name === me.full_name;

  const act = async (fn: () => Promise<Item>, done: string, close = false) => {
    setBusy(true);
    try {
      const next = await fn();
      setCurrent(next);
      setData({ ...next.data });
      toast.success(done);
      if (close) onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  /** Save first (creating the row if new), then a workflow step. */
  const saveThen = async (step?: Step, comment?: string): Promise<Item> => {
    let row = current;
    if (!row) row = await rows.add.mutateAsync(data);
    else if (dirty) row = await rows.save.mutateAsync({ id: row.id, data });
    return step ? rows.step.mutateAsync({ id: row.id, step, comment }) : row;
  };
  const state = current ? rowState(current, c) : { label: "New row", dot: "bg-[#b9c1bd]" };

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()} title={current ? "Row" : "Add a row"} description={`${c.name} · ${state.label}`}>
      <div className="flex flex-col gap-6">
        {current?.status === "in_review" && <p className="rounded-lg border border-[#f5d9a8] bg-[#fffaf0] px-3 py-2 text-sm text-body">Waiting for approval. Editing is paused until it’s reviewed.</p>}
        {current?.in_trash && <p className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-body">In Trash: not on the website. Restore it to edit.</p>}

        <fieldset disabled={!canEdit || !!locked || busy} className="flex flex-col gap-4 disabled:opacity-70">
          {fields.map((f) => (
            <Input1 key={f.id} f={f} value={data[f.key]} onChange={(v) => setData((d) => ({ ...d, [f.key]: v }))} />
          ))}
        </fieldset>

        {/* actions */}
        {(canEdit || canPublish) && !current?.in_trash && (
          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {canEdit && current?.status !== "in_review" && (
              <>
                {c.approval_required ? (
                  <Button loading={busy} onClick={() => act(() => saveThen("submit"), "Sent for approval")}>
                    <Send aria-hidden /> Save and send for approval
                  </Button>
                ) : (
                  <Button loading={busy} onClick={() => act(() => saveThen("publish"), "Published: it’s on the website", true)}>
                    Save and publish
                  </Button>
                )}
                <Button variant="secondary" disabled={busy || (!!current && !dirty)} onClick={() => act(() => saveThen(), current ? "Saved as a draft" : "Row added as a draft", !current)}>
                  Save as draft
                </Button>
              </>
            )}
            {current?.status === "in_review" && canPublish && !sentByMe && (
              <>
                <Button loading={busy} onClick={() => act(() => rows.step.mutateAsync({ id: current.id, step: "publish" }), "Approved and published", true)}>
                  Approve and publish
                </Button>
                <Button variant="secondary" onClick={() => setNote("")}>
                  Send back…
                </Button>
              </>
            )}
            {current?.status === "in_review" && sentByMe && <p className="text-sm text-muted">Someone else with approval rights will review it.</p>}
            {canEdit && current && (
              <span className="ml-auto flex gap-1">
                {current.live && (
                  <Button variant="ghost" size="sm" onClick={() => act(() => rows.step.mutateAsync({ id: current.id, step: "unpublish" }), "Taken off the website (kept as a draft)")}>
                    Take off website
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => act(() => rows.step.mutateAsync({ id: current.id, step: "trash" }), "Moved to Trash. Restore it from the Trash tab.", true)}>
                  <Trash2 aria-hidden /> Move to Trash
                </Button>
              </span>
            )}
          </div>
        )}
        {current?.in_trash && canEdit && (
          <Button variant="secondary" onClick={() => act(() => rows.step.mutateAsync({ id: current.id, step: "restore" }), "Row restored")}>
            <RotateCcw aria-hidden /> Restore from Trash
          </Button>
        )}

        {note !== null && current && (
          <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
            <FormField label="What needs to change?">
              <Textarea rows={3} value={note} autoFocus onChange={(e) => setNote(e.target.value)} />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNote(null)}>
                Cancel
              </Button>
              <Button size="sm" disabled={!note.trim()} onClick={() => act(() => rows.step.mutateAsync({ id: current.id, step: "reject", comment: note }), "Sent back with your note", true)}>
                Send back
              </Button>
            </div>
          </div>
        )}

        {/* history */}
        {current && (
          <section>
            <h3 className="mb-3 text-sm font-medium text-foreground">History</h3>
            <ol className="flex flex-col gap-3 border-l border-border pl-4">
              {(versions.data ?? []).map((v, idx) => (
                <li key={v.id} className="relative text-sm">
                  <span aria-hidden className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-border-strong" />
                  <span className="text-foreground">
                    <span className="font-medium">{v.actor_name}</span> {DID[v.action] ?? v.action}
                  </span>
                  {v.comment && <span className="block text-body">“{v.comment}”</span>}
                  <span className="block text-xs text-muted">{new Date(v.at + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  {idx > 0 && canEdit && !locked && (
                    <button
                      type="button"
                      onClick={() => act(() => rows.restoreVersion.mutateAsync({ id: current.id, version: v.id }), "That version is back, as a draft")}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary-strong hover:underline"
                    >
                      <RotateCcw aria-hidden className="size-3" /> Restore this version
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </Drawer>
  );
}

/** The right input for one field. */
function Input1({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: unknown) => void }) {
  const [picking, setPicking] = useState(false);
  const media = useMedia();
  const label = `${f.label}${f.required ? " *" : ""}`;
  const v = value ?? "";
  switch (f.type) {
    case "richtext":
      return (
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">{label}</p>
          <RichField html={String(v)} onChange={onChange} placeholder="Type here…" className="min-h-24 rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground" />
        </div>
      );
    case "number":
      return (
        <FormField label={label}>
          <Input type="number" step="any" value={String(v)} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />
        </FormField>
      );
    case "date":
      return (
        <FormField label={label}>
          <Input type="date" value={String(v)} onChange={(e) => onChange(e.target.value || null)} />
        </FormField>
      );
    case "boolean":
      return (
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <Switch checked={!!value} onCheckedChange={onChange} label={f.label} />
        </label>
      );
    case "choice":
      return (
        <FormField label={label}>
          <Select value={value ? String(value) : undefined} placeholder="Choose…" onValueChange={onChange} options={((f.options.choices as string[] | undefined) ?? []).map((x) => ({ value: x, label: x }))} />
        </FormField>
      );
    case "image":
      return (
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">{label}</p>
          <div className="flex items-center gap-3">
            <span className="flex size-14 items-center justify-center overflow-hidden rounded-md bg-surface-muted">{value ? <ShowValue field={f} value={value} compact /> : <ImageIcon aria-hidden className="size-5 text-muted" />}</span>
            <button type="button" onClick={() => setPicking((p) => !p)} className="text-sm font-medium text-primary-strong hover:underline">
              {value ? "Change picture" : "Choose a picture"}
            </button>
            {!!value && (
              <button type="button" onClick={() => onChange(null)} className="text-sm text-muted hover:text-foreground">
                Remove
              </button>
            )}
          </div>
          {picking && (
            <div className="mt-2">
              <MediaPicker
                onPick={(url) => {
                  onChange(url);
                  setPicking(false);
                }}
              />
            </div>
          )}
        </div>
      );
    case "file": {
      const files = (media.data ?? []).filter((m) => !m.content_type.startsWith("image/"));
      return (
        <FormField label={label} hint="A PDF or document from Files">
          <Select value={value ? String(value) : undefined} placeholder={files.length ? "Choose a file…" : "Upload files in Files first"} onValueChange={onChange} options={files.map((m) => ({ value: m.url, label: m.original_name }))} />
        </FormField>
      );
    }
    case "link":
      return (
        <FormField label={label} hint="A page on this site like /careers, or a full web address">
          <div className="flex gap-2">
            <Input value={String(v)} onChange={(e) => onChange(e.target.value || null)} placeholder="https://…" />
            {!!value && (
              <a href={String(value)} target="_blank" rel="noreferrer" aria-label="Open link" className={cn("flex size-10 shrink-0 items-center justify-center rounded-md border border-border text-muted hover:text-foreground")}>
                <ExternalLink aria-hidden className="size-4" />
              </a>
            )}
          </div>
        </FormField>
      );
    default:
      return (
        <FormField label={label}>
          <Input value={String(v)} onChange={(e) => onChange(e.target.value)} />
        </FormField>
      );
  }
}

