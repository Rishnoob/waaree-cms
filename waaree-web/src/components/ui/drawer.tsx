"use client";

import { X } from "lucide-react";
import { Dialog as RDialog } from "radix-ui";

/**
 * A panel that slides in from the right, for settings that belong to the screen behind it
 * (e.g. a page's settings while you look at the page). Escape or the X closes it.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-[rgb(10_20_16/0.18)]" />
        <RDialog.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md animate-drawer-in flex-col border-l border-border bg-white shadow-lg focus:outline-none"
          {...(!description && { "aria-describedby": undefined })}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <RDialog.Title className="text-xl font-light tracking-tight text-foreground">{title}</RDialog.Title>
              {description && <RDialog.Description className="mt-1 text-sm text-body">{description}</RDialog.Description>}
            </div>
            <RDialog.Close aria-label="Close" className="-m-1 rounded-sm p-1.5 text-muted hover:bg-foreground/5 hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none">
              <X aria-hidden className="size-5" />
            </RDialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
