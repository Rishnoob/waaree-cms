"use client";

import { DropdownMenu } from "radix-ui";

import { cn } from "@/lib/utils/cn";

/**
 * A small menu that opens from a button ("More", "Publish later"…). Arrow keys move, Escape closes.
 *
 *   <Menu trigger={<IconButton label="More"><Ellipsis /></IconButton>}
 *     items={[{ label: "Rename", onSelect: rename }, { label: "Delete", onSelect: del, danger: true }]} />
 */
export type MenuItem = { label: string; hint?: string; icon?: React.ComponentType<{ className?: string }>; onSelect: () => void; danger?: boolean; disabled?: boolean };

export function Menu({ trigger, items, align = "end" }: { trigger: React.ReactNode; items: MenuItem[]; align?: "start" | "end" }) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          className="z-50 min-w-52 animate-pop-in rounded-lg border border-border bg-white p-1 shadow-lg focus:outline-none"
        >
          {items.map((it) => (
            <DropdownMenu.Item
              key={it.label}
              disabled={it.disabled}
              onSelect={it.onSelect}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-md px-3 py-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-foreground/[0.05]",
                it.danger ? "text-danger" : "text-foreground",
              )}
            >
              {it.icon && <it.icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", it.danger ? "text-danger" : "text-muted")} />}
              <span>
                {it.label}
                {it.hint && <span className="block text-xs text-muted">{it.hint}</span>}
              </span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
