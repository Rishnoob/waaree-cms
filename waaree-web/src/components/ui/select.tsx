"use client";

import { Check, ChevronDown } from "lucide-react";
import { Select as RSelect } from "radix-ui";

import { cn } from "@/lib/utils/cn";

import { useFieldControlProps } from "./field";
import { controlClasses } from "./input";

export type SelectOption = { value: string; label: string; disabled?: boolean };

/**
 * Dropdown in Waaree style (green border + green chevron).
 *
 *   <Select options={[{ value: "2025", label: "2025" }]} value={year} onValueChange={setYear} placeholder="All Year" />
 */
export function Select({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  label,
  disabled,
  className,
  id,
}: {
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Accessible name when the select isn't inside a <Field>. */
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const fieldProps = useFieldControlProps({ id });
  return (
    <RSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RSelect.Trigger
        aria-label={label}
        className={cn(
          controlClasses,
          "group flex h-10 items-center justify-between gap-2 px-3.5 text-left data-placeholder:text-placeholder",
          className,
        )}
        {...fieldProps}
      >
        <span className="min-w-0 flex-1 truncate">
          <RSelect.Value placeholder={placeholder} />
        </span>
        <RSelect.Icon asChild>
          <ChevronDown
            aria-hidden
            className="size-4 text-muted transition-transform duration-(--duration) group-data-[state=open]:rotate-180"
          />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-(--radix-select-content-available-height) min-w-(--radix-select-trigger-width) animate-fade-in overflow-hidden rounded-lg border border-border bg-white/95 shadow-[0_18px_40px_-18px_rgb(16_40_30/0.35)] backdrop-blur-xl"
        >
          <RSelect.Viewport className="p-1">
            {options.map((o) => (
              <RSelect.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className="relative flex cursor-pointer items-center rounded-md py-2 pr-8 pl-3 text-[0.9375rem] text-foreground outline-none select-none data-disabled:opacity-50 data-highlighted:bg-brand-green/10 data-highlighted:text-primary-strong"
              >
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
                <RSelect.ItemIndicator className="absolute right-2.5">
                  <Check aria-hidden className="size-4 text-primary" />
                </RSelect.ItemIndicator>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
