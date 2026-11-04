"use client";

import { Toaster as Sonner, toast } from "sonner";

/** Mounted once in the app providers. Call `toast.success("Page published")` anywhere. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-md! border! border-border! bg-surface! text-foreground! shadow-lg! font-sans!",
          description: "text-body!",
          success: "[&_[data-icon]]:text-primary!",
          error: "[&_[data-icon]]:text-danger!",
        },
      }}
    />
  );
}

export { toast };
