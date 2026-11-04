"use client";

import { Monitor, Redo2, Smartphone, Tablet, Undo2 } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils/cn";

import type { Device } from "../canvas";

const DEVICES: { value: Device; label: string; icon: typeof Monitor }[] = [
  { value: "desktop", label: "Desktop", icon: Monitor },
  { value: "tablet", label: "Tablet", icon: Tablet },
  { value: "phone", label: "Phone", icon: Smartphone },
];

/** Undo / redo and the preview size, for the editor’s top bar. */
export function EditorTools({ history, device, onDevice }: { history?: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean }; device: Device; onDevice: (d: Device) => void }) {
  return (
    <div className="hidden items-center gap-1 lg:flex">
      {history && (
        <>
          <IconButton label="Undo (Ctrl Z)" size="sm" disabled={!history.canUndo} onClick={history.undo}>
            <Undo2 aria-hidden />
          </IconButton>
          <IconButton label="Redo (Ctrl Shift Z)" size="sm" disabled={!history.canRedo} onClick={history.redo}>
            <Redo2 aria-hidden />
          </IconButton>
          <span aria-hidden className="mx-1 h-5 w-px bg-border" />
        </>
      )}
      <div role="radiogroup" aria-label="Preview size" className="flex rounded-lg bg-surface-muted p-0.5">
        {DEVICES.map((d) => (
          <button
            key={d.value}
            type="button"
            role="radio"
            aria-checked={device === d.value}
            aria-label={`Preview on ${d.label.toLowerCase()}`}
            title={d.label}
            onClick={() => onDevice(d.value)}
            className={cn("flex size-8 items-center justify-center rounded-md transition-colors focus-visible:shadow-glow focus-visible:outline-none", device === d.value ? "bg-white text-foreground shadow-soft" : "text-muted hover:text-foreground")}
          >
            <d.icon aria-hidden className="size-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
