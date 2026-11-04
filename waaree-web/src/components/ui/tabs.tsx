"use client";

import { Tabs as RTabs } from "radix-ui";

import { cn } from "@/lib/utils/cn";

/**
 * Segmented tabs in Waaree style ("Upcoming | Past-Events"): outlined pill, active = solid green.
 *
 *   <Tabs defaultValue="upcoming" tabs={[{ value: "upcoming", label: "Upcoming", content: <List/> }, ...]} />
 */
export function Tabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  label,
  className,
}: {
  tabs: { value: string; label: string; content?: React.ReactNode }[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Accessible name for the tab list. */
  label: string;
  className?: string;
}) {
  return (
    <RTabs.Root
      value={value}
      defaultValue={defaultValue ?? tabs[0]?.value}
      onValueChange={onValueChange}
      className={cn("flex flex-col gap-6", className)}
    >
      <RTabs.List
        aria-label={label}
        className="inline-flex self-start rounded-md border border-border bg-surface-muted p-1"
      >
        {tabs.map((t) => (
          <RTabs.Trigger
            key={t.value}
            value={t.value}
            className="rounded-sm px-5 py-2 text-[0.9375rem] text-muted transition-[background-color,color,box-shadow] duration-(--duration) ease-(--easing) hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-soft"
          >
            {t.label}
          </RTabs.Trigger>
        ))}
      </RTabs.List>
      {tabs.map(
        (t) =>
          t.content !== undefined && (
            <RTabs.Content key={t.value} value={t.value} className="outline-none">
              {t.content}
            </RTabs.Content>
          ),
      )}
    </RTabs.Root>
  );
}
