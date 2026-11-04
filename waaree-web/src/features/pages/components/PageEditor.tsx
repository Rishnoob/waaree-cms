"use client";

import { ArrowLeft, Check, ChevronDown, Clock, CloudCheck, CloudOff, ExternalLink, LoaderCircle, MessageSquareWarning, Send, Settings2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Menu } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { type Block, type Device, EditorTools, onlyText, PageCanvas, parseBlocks, serializeBlocks, useUndoable } from "@/features/page-builder";
import { Placement } from "@/features/site";
import { useCan, useSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { type CmsPage, type FlowAction, useDeletePage, usePage, useSavePage, useWorkflow } from "../hooks";
import { DOT, isScheduled, pageState } from "../status";
import { slugify } from "./NewPageDialog";

const fmt = (iso: string) => new Date(iso + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * One page, full screen, like a document: the page itself in the middle (type on it), one main button
 * at the top right whose label follows the page’s state, and a sentence saying what’s happening.
 * Changes save by themselves.
 */
export function PageEditor({ id }: { id: number }) {
  const page = usePage(id);
  if (page.isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        <LoaderCircle aria-hidden className="mr-2 size-4 animate-spin" /> Opening the page…
      </div>
    );
  if (!page.data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-foreground">This page doesn’t exist any more.</p>
        <Button asChild variant="secondary">
          <Link href="/cms">Back to all pages</Link>
        </Button>
      </div>
    );
  return <Editor key={page.data.id} p={page.data} />;
}

type Draft = { title: string; summary: string; blocks: Block[]; slug: string };

function Editor({ p }: { p: CmsPage }) {
  const router = useRouter();
  const session = useSession();
  const me = session.status === "authenticated" ? session.user : null;
  const canEdit = useCan("pages.edit");
  const canApprove = useCan("pages.approve");
  const save = useSavePage(p.id);
  const flow = useWorkflow(p.id);

  const [initial] = useState<Draft>(() => ({ title: p.title, summary: p.summary ?? "", blocks: parseBlocks(p.body), slug: p.slug }));
  const [waiting, setWaiting] = useState(false); // a save is scheduled
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [settings, setSettings] = useState(false);
  const [dialog, setDialog] = useState<null | "changes" | "later">(null);

  const editable = canEdit && ["draft", "rejected", "published"].includes(p.status);
  const state = pageState(p);
  const submitter = [...p.events].reverse().find((e) => e.action === "submitted");
  const rejection = p.status === "rejected" ? [...p.events].reverse().find((e) => e.action === "rejected") : undefined;
  const approval = [...p.events].reverse().find((e) => e.action === "approved");
  const mine = !!me && p.submitted_by === me.id;
  const reviewer = canApprove && !mine;

  const payload = (d: Draft) => ({ title: d.title.trim(), slug: d.slug, summary: d.summary.trim() || null, body: d.blocks.length ? serializeBlocks(d.blocks) : null });
  const persist = (d: Draft) => {
    if (d.title.trim().length < 2) return; // wait until it has a name
    save.mutate(payload(d), { onError: (e) => toast.error(`Couldn’t save: ${(e as Error).message}`) });
  };
  const schedule = (next: Draft) => {
    setWaiting(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setWaiting(false);
      persist(next);
    }, 700);
  };
  // every change goes through the page’s undo history; undo/redo save what they jump to
  const history = useUndoable<Draft>(initial, schedule);
  const draft = history.value;
  const change = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    history.set(next, onlyText(draft.blocks, next.blocks));
    schedule(next);
  };
  const flush = async () => {
    if (!timer.current || !waiting) return;
    clearTimeout(timer.current);
    setWaiting(false);
    await save.mutateAsync(payload(draft));
  };

  const run = async (steps: { action: FlowAction; comment?: string; at?: string }[], done: string) => {
    try {
      await flush();
      for (const s of steps) await flow.mutateAsync(s);
      toast.success(done);
      setDialog(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const saveLabel = waiting || save.isPending ? "Saving…" : save.isError ? "Not saved" : "Saved";
  const SaveIcon = waiting || save.isPending ? LoaderCircle : save.isError ? CloudOff : CloudCheck;

  // the one main action, by state and role
  const primary = (() => {
    if (["draft", "rejected"].includes(p.status) && canEdit)
      return (
        <Button onClick={() => run([{ action: "submit" }], "Sent for approval")} loading={flow.isPending} disabled={draft.title.trim().length < 2}>
          <Send aria-hidden /> Send for approval
        </Button>
      );
    if (p.status === "in_review" && reviewer)
      return (
        <SplitButton
          label="Approve and publish"
          busy={flow.isPending}
          onClick={() => run([{ action: "approve" }, { action: "publish" }], "Approved. The page is live.")}
          more={[
            { label: "Approve and publish later…", icon: Clock, onSelect: () => setDialog("later") },
            { label: "Ask for changes…", icon: MessageSquareWarning, onSelect: () => setDialog("changes") },
          ]}
        />
      );
    if (p.status === "approved" && canApprove)
      return <SplitButton label="Publish now" busy={flow.isPending} onClick={() => run([{ action: "publish" }], "Published. The page is live.")} more={[{ label: "Publish later…", icon: Clock, onSelect: () => setDialog("later") }]} />;
    if (p.status === "published" && !isScheduled(p))
      return (
        <Button asChild variant="secondary">
          <a href={`/${p.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden /> View on website
          </a>
        </Button>
      );
    return null;
  })();

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link href="/cms" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-body hover:bg-foreground/[0.04] hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none">
            <ArrowLeft aria-hidden className="size-4" /> <span className="hidden sm:inline">All pages</span>
          </Link>
          <span aria-hidden className="h-6 w-px bg-border" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.9375rem] font-medium text-foreground">{draft.title || "Untitled page"}</p>
            <p className="flex items-center gap-1.5 truncate text-xs text-muted">
              <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", DOT[state.tone])} />
              <span data-testid="page-state">{state.label}</span>
              <span aria-hidden>·</span>
              <span>waaree.com/{draft.slug}</span>
            </p>
          </div>
          {editable && (
            <span className="hidden items-center gap-1.5 text-xs text-muted md:flex" aria-live="polite">
              <SaveIcon aria-hidden className={cn("size-4", saveLabel === "Saving…" && "animate-spin", saveLabel === "Not saved" && "text-danger")} />
              {saveLabel}
            </span>
          )}
          <EditorTools history={editable ? history : undefined} device={device} onDevice={setDevice} />
          <Button variant="ghost" onClick={() => setSettings(true)}>
            <Settings2 aria-hidden /> <span className="hidden sm:inline">Page settings</span>
          </Button>
          {primary}
        </div>
        <Banner p={p} reviewer={reviewer} canApprove={canApprove} canEdit={canEdit} submitter={submitter?.actor_name} rejection={rejection} approver={approval?.actor_name} onWithdraw={() => run([{ action: "withdraw" }], "Taken back. You can edit it again.")} busy={flow.isPending} />
      </header>

      <main id="main" className="px-4 py-8 sm:px-8">
        <PageCanvas
          eyebrow={p.has_live && p.published_at ? new Date(p.published_at + "Z").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Not published yet"}
          title={draft.title}
          onTitle={(title) => change({ title })}
          intro={draft.summary}
          onIntro={(summary) => change({ summary })}
          blocks={draft.blocks}
          onBlocks={(blocks) => change({ blocks })}
          readOnly={!editable}
          device={device}
        />
      </main>

      <PageSettings
        open={settings}
        onOpenChange={setSettings}
        p={p}
        draft={draft}
        editable={editable}
        canEdit={canEdit}
        onChange={change}
        onDeleted={() => router.push("/cms")}
      />

      <Dialog
        open={dialog === "changes"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Ask for changes"
        description="Say what needs to change. The author sees your note at the top of the page."
        footer={<ChangesFooter busy={flow.isPending} onCancel={() => setDialog(null)} onSend={(comment) => run([{ action: "reject", comment }], "Sent back with your note")} />}
      />
      <LaterDialog
        open={dialog === "later"}
        onClose={() => setDialog(null)}
        busy={flow.isPending}
        onSchedule={(at) => run([...(p.status === "in_review" ? [{ action: "approve" as const }] : []), { action: "publish", at }], `Scheduled for ${fmt(at.replace("Z", ""))}`)}
      />
    </div>
  );
}

/** A sentence under the top bar saying what’s happening and what (if anything) you can do. */
function Banner({
  p,
  reviewer,
  canApprove,
  canEdit,
  submitter,
  rejection,
  approver,
  onWithdraw,
  busy,
}: {
  p: CmsPage;
  reviewer: boolean;
  canApprove: boolean;
  canEdit: boolean;
  submitter?: string;
  rejection?: CmsPage["events"][number];
  approver?: string;
  onWithdraw: () => void;
  busy: boolean;
}) {
  let tone = "";
  let body: React.ReactNode = null;
  if (p.status === "rejected" && rejection) {
    tone = "border-danger/20 bg-danger/[0.05]";
    body = (
      <>
        <strong className="font-medium text-foreground">{rejection.actor_name} asked for changes:</strong> “{rejection.comment}” Make the changes, then send it again.
      </>
    );
  } else if (p.status === "in_review") {
    tone = "border-[#f5d9a8] bg-[#fffaf0]";
    body = reviewer ? (
      <>
        <strong className="font-medium text-foreground">{submitter ?? "Someone"} sent this for approval.</strong> Read it through, then approve and publish, or ask for changes.
      </>
    ) : (
      <>
        <strong className="font-medium text-foreground">Waiting for approval.</strong> {canApprove ? "Someone else has to approve a page you sent." : "An approver will review it."} Editing is paused meanwhile.
        {canEdit && (
          <button type="button" disabled={busy} onClick={onWithdraw} className="ml-2 inline-flex items-center gap-1 font-medium text-primary-strong hover:underline">
            <Undo2 aria-hidden className="size-3.5" /> Take it back to edit
          </button>
        )}
      </>
    );
  } else if (p.status === "approved") {
    tone = "border-brand-blue/20 bg-brand-blue/[0.05]";
    body = (
      <>
        <strong className="font-medium text-foreground">Approved{approver ? ` by ${approver}` : ""}.</strong> {canApprove ? "Publish it now, or pick a time." : "An approver will publish it."}
      </>
    );
  } else if (p.status === "published" && isScheduled(p)) {
    tone = "border-brand-blue/20 bg-brand-blue/[0.05]";
    body = (
      <>
        <strong className="font-medium text-foreground">Scheduled.</strong> It goes live on {fmt(p.published_at!)}.
      </>
    );
  } else if (p.status === "draft" && p.has_live) {
    tone = "border-brand-green/20 bg-brand-green/[0.05]";
    body = (
      <>
        <strong className="font-medium text-foreground">You’re editing a live page.</strong> Visitors still see the live version until your changes are sent and approved.
      </>
    );
  }
  if (!body) return null;
  return <div className={cn("border-t px-4 py-2.5 text-sm text-body sm:px-6", tone)}>{body}</div>;
}

function SplitButton({ label, onClick, more, busy }: { label: string; onClick: () => void; more: { label: string; icon: typeof Clock; onSelect: () => void }[]; busy: boolean }) {
  return (
    <span className="flex">
      <Button onClick={onClick} loading={busy} className="rounded-r-none">
        <Check aria-hidden /> {label}
      </Button>
      <Menu
        trigger={
          <Button aria-label="More publishing options" className="rounded-l-none border-l border-white/25 px-2.5">
            <ChevronDown aria-hidden />
          </Button>
        }
        items={more}
      />
    </span>
  );
}

function ChangesFooter({ busy, onCancel, onSend }: { busy: boolean; onCancel: () => void; onSend: (comment: string) => void }) {
  const [comment, setComment] = useState("");
  return (
    <div className="flex w-full flex-col gap-4">
      <Field label="What needs to change?" required>
        <Textarea rows={4} value={comment} autoFocus onChange={(e) => setComment(e.target.value)} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSend(comment.trim())} disabled={!comment.trim()} loading={busy}>
          Send back
        </Button>
      </div>
    </div>
  );
}

function LaterDialog({ open, onClose, busy, onSchedule }: { open: boolean; onClose: () => void; busy: boolean; onSchedule: (atIso: string) => void }) {
  const [when, setWhen] = useState("");
  const valid = !!when && new Date(when) > new Date();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title="Publish later"
      description="Pick when it should go live. Until then, visitors don’t see it."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!valid} loading={busy} onClick={() => onSchedule(new Date(when).toISOString())}>
            <Clock aria-hidden /> Schedule
          </Button>
        </>
      }
    >
      <Field label="Goes live on">
        <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </Field>
    </Dialog>
  );
}

const DID: Record<string, string> = {
  created: "created the page",
  edited: "edited it",
  submitted: "sent it for approval",
  withdrawn: "took it back to edit",
  approved: "approved it",
  rejected: "asked for changes",
  published: "published it",
  scheduled: "scheduled it",
};

/** Settings that aren’t on the page itself: name, web address, menu place, history, delete. */
function PageSettings({
  open,
  onOpenChange,
  p,
  draft,
  editable,
  canEdit,
  onChange,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  p: CmsPage;
  draft: Draft;
  editable: boolean;
  canEdit: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onDeleted: () => void;
}) {
  const del = useDeletePage();
  const [confirming, setConfirming] = useState(false);
  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Page settings">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <Field label="Page name">
            <Input value={draft.title} disabled={!editable} onChange={(e) => onChange({ title: e.target.value })} />
          </Field>
          <Field label="Web address" hint={p.has_live ? "Changing it breaks links people already have." : undefined}>
            <div className="flex items-center rounded-md border border-border bg-white focus-within:border-brand-green focus-within:shadow-glow">
              <span className="pl-3 text-sm text-muted">waaree.com/</span>
              <input
                aria-label="Web address"
                disabled={!editable}
                value={draft.slug}
                onChange={(e) => onChange({ slug: slugify(e.target.value) || draft.slug })}
                className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm text-foreground outline-none disabled:opacity-60"
              />
            </div>
          </Field>
        </div>

        <section>
          <h3 className="mb-2 text-sm font-medium text-foreground">Where it shows in the menu</h3>
          <Placement pageId={p.id} disabled={!canEdit} />
          <p className="mt-1 text-xs text-muted">It appears in the menu once the page is live.</p>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-medium text-foreground">History</h3>
          <ol className="flex flex-col gap-3 border-l border-border pl-4">
            {[...p.events].reverse().map((e) => (
              <li key={e.id} className="relative text-sm">
                <span aria-hidden className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-border-strong" />
                <span className="text-foreground">
                  <span className="font-medium">{e.actor_name}</span> {DID[e.action] ?? e.action}
                </span>
                {e.comment && <span className="mt-0.5 block text-body">“{e.comment}”</span>}
                <span className="block text-xs text-muted">{fmt(e.at)}</span>
              </li>
            ))}
          </ol>
        </section>

        {canEdit && (
          <section className="border-t border-border pt-6">
            {confirming ? (
              <div className="rounded-lg border border-danger/25 bg-danger/[0.04] p-4">
                <p className="text-sm text-foreground">Delete “{p.title}”? {p.has_live ? "It comes off the website and the menu." : "This can’t be undone."}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    loading={del.isPending}
                    onClick={async () => {
                      try {
                        await del.mutateAsync(p.id);
                        toast.success("Page deleted");
                        onDeleted();
                      } catch (e) {
                        toast.error((e as Error).message);
                      }
                    }}
                  >
                    Delete page
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                    Keep it
                  </Button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="text-sm font-medium text-danger hover:underline">
                Delete this page
              </button>
            )}
          </section>
        )}
      </div>
    </Drawer>
  );
}
