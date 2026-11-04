"use client";

import { ArrowLeft, Check, CloudCheck, CloudOff, LoaderCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useCan } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { type Device, PageCanvas } from "../canvas";
import { type CustomBlock, useCustomBlock, useCustomBlockActions } from "../custom";
import { useUndoable } from "../history";
import { onlyText, parseBlocks, serializeBlocks } from "../render";
import { EditorTools } from "./EditorTools";
import type { Block } from "../types";

/** Build a custom block, full screen, with the same canvas as pages. Changes save by themselves. */
export function CustomBlockEditor({ id }: { id: number }) {
  const q = useCustomBlock(id);
  if (q.isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        <LoaderCircle aria-hidden className="mr-2 size-4 animate-spin" /> Opening the block…
      </div>
    );
  if (!q.data)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-foreground">This custom block doesn’t exist any more.</p>
        <Button asChild variant="secondary">
          <Link href="/cms/ui-kit">Back to the UI Kit</Link>
        </Button>
      </div>
    );
  return <Editor key={q.data.id} b={q.data} />;
}

type Draft = { name: string; description: string; blocks: Block[] };

function Editor({ b }: { b: CustomBlock }) {
  const router = useRouter();
  const canManage = useCan("blocks.manage");
  const { save, remove } = useCustomBlockActions();
  const [initial] = useState<Draft>(() => ({ name: b.name, description: b.description ?? "", blocks: parseBlocks(b.body) }));
  const [waiting, setWaiting] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = (next: Draft) => {
    setWaiting(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setWaiting(false);
      if (!next.name.trim()) return;
      save.mutate({ id: b.id, body: { name: next.name.trim(), description: next.description.trim() || null, body: next.blocks.length ? serializeBlocks(next.blocks) : null } }, { onError: (e) => toast.error(`Couldn’t save: ${(e as Error).message}`) });
    }, 700);
  };
  const history = useUndoable<Draft>(initial, schedule);
  const draft = history.value;
  const change = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    history.set(next, onlyText(draft.blocks, next.blocks));
    schedule(next);
  };

  const label = waiting || save.isPending ? "Saving…" : save.isError ? "Not saved" : "Saved";
  const Icon = waiting || save.isPending ? LoaderCircle : save.isError ? CloudOff : CloudCheck;

  return (
    <div className="min-h-screen bg-[#f3f6f4]">
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link href="/cms/ui-kit" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-body hover:bg-foreground/[0.04] hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none">
            <ArrowLeft aria-hidden className="size-4" /> <span className="hidden sm:inline">UI Kit</span>
          </Link>
          <span aria-hidden className="h-6 w-px bg-border" />
          <div className="min-w-0 flex-1">
            <input
              aria-label="Block name"
              value={draft.name}
              disabled={!canManage}
              onChange={(e) => change({ name: e.target.value })}
              placeholder="Block name"
              className="w-full max-w-md truncate rounded-sm bg-transparent text-[0.9375rem] font-medium text-foreground outline-none hover:bg-brand-green/[0.06] focus:bg-white focus:shadow-[0_0_0_2px_rgb(13_176_43/0.45)]"
            />
            <input
              aria-label="What it’s for"
              value={draft.description}
              disabled={!canManage}
              onChange={(e) => change({ description: e.target.value })}
              placeholder="Custom block · what it’s for (optional)"
              className="w-full max-w-md truncate rounded-sm bg-transparent text-xs text-muted outline-none hover:bg-brand-green/[0.06] focus:bg-white"
            />
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-muted md:flex" aria-live="polite">
            <Icon aria-hidden className={cn("size-4", label === "Saving…" && "animate-spin", label === "Not saved" && "text-danger")} />
            {label}
          </span>
          <EditorTools history={canManage ? history : undefined} device={device} onDevice={setDevice} />
          {canManage && (
            <Button
              variant="ghost"
              onClick={async () => {
                if (!confirm(`Delete the custom block “${draft.name}”? Pages that already use it keep their copy.`)) return;
                await remove.mutateAsync(b.id);
                toast.success("Custom block deleted");
                router.push("/cms/ui-kit");
              }}
            >
              <Trash2 aria-hidden /> <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          <Button asChild>
            <Link href="/cms/ui-kit">
              <Check aria-hidden /> Done
            </Link>
          </Button>
        </div>
        <p className="border-t border-brand-blue/20 bg-brand-blue/[0.05] px-4 py-2.5 text-sm text-body sm:px-6">
          <strong className="font-medium text-foreground">This is a custom block.</strong> It appears in every page’s “Add a section” list. Adding it copies it into the page, so changes here don’t alter pages that already use it.
        </p>
      </header>

      <main id="main" className="px-4 py-8 sm:px-8">
        <PageCanvas bare blocks={draft.blocks} onBlocks={(blocks) => change({ blocks })} readOnly={!canManage} device={device} />
      </main>
    </div>
  );
}
