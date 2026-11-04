"use client";

import { X } from "lucide-react";
import { Dialog as RDialog } from "radix-ui";

import { cn } from "@/lib/utils/cn";

/**
 * Modal dialog. Focus is trapped inside, Escape closes it, and focus returns to the trigger.
 *
 *   <Dialog open={open} onOpenChange={setOpen} title="Delete page?" description="This can't be undone."
 *     footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger">Delete</Button></>}>
 *     ...optional body...
 *   </Dialog>
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  size = "md",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-[rgb(10_20_16/0.25)] backdrop-blur-[2px]" />
        <RDialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 flex max-h-[88vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 animate-dialog-in flex-col gap-5 overflow-y-auto rounded-lg border border-border bg-white p-6 shadow-lg focus:outline-none sm:p-7",
            { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-3xl" }[size],
          )}
          {...(!description && { "aria-describedby": undefined })}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <RDialog.Title className="text-2xl font-light tracking-tight text-foreground">{title}</RDialog.Title>
              {description && <RDialog.Description className="text-sm text-body">{description}</RDialog.Description>}
            </div>
            <RDialog.Close
              aria-label="Close"
              className="-m-1 rounded-sm p-1.5 text-muted transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none"
            >
              <X aria-hidden className="size-5" />
            </RDialog.Close>
          </div>
          {children}
          {footer && <div className="mt-2 flex justify-end gap-2">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
