"use client";

import { Check, Minus } from "lucide-react";
import { Checkbox as RCheckbox } from "radix-ui";
import { useId } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * Checkbox with its label (clicking the text toggles it).
 *
 *   <Checkbox label="See the list of CMS users" checked={on} onCheckedChange={setOn} />
 */
export function Checkbox({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  label: string;
  description?: string;
  /** "indeterminate" shows a dash, e.g. "some permissions in this group". */
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", disabled && "opacity-60", className)}>
      <RCheckbox.Root
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-border-strong bg-surface focus-visible:shadow-glow focus-visible:outline-none transition-colors duration-(--duration) hover:border-brand-green disabled:cursor-not-allowed data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary"
      >
        <RCheckbox.Indicator className="text-primary-foreground">
          {checked === "indeterminate" ? <Minus className="size-3.5" strokeWidth={3} /> : <Check className="size-3.5" strokeWidth={3} />}
        </RCheckbox.Indicator>
      </RCheckbox.Root>
      <label htmlFor={id} className={cn("flex cursor-pointer flex-col", disabled && "cursor-not-allowed")}>
        <span className="text-sm text-foreground">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </label>
    </div>
  );
}
