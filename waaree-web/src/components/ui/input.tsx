"use client";

import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import { useFieldControlProps } from "./field";

/** Shared look for every text-like control (Input, Textarea, Select trigger). */
export const controlClasses =
  "w-full rounded-md border border-border bg-white text-[0.9375rem] text-foreground " +
  "shadow-[0_1px_2px_rgb(16_24_20/0.04)] placeholder:text-placeholder " +
  "transition-[border-color,box-shadow] duration-(--duration) ease-(--easing) hover:border-border-strong " +
  "focus-visible:border-brand-green focus-visible:shadow-glow focus-visible:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger";

export function Input({
  className,
  icon,
  ...props
}: React.ComponentProps<"input"> & {
  /** Icon shown inside the input on the left (e.g. a lucide icon). */
  icon?: React.ReactNode;
}) {
  const fieldProps = useFieldControlProps(props);
  return (
    <div className="relative w-full">
      {icon && (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-green [&_svg]:size-5"
        >
          {icon}
        </span>
      )}
      <input
        className={cn(controlClasses, "h-10 px-3.5", icon && "pl-11", className)}
        {...props}
        {...fieldProps}
      />
    </div>
  );
}

/** Search box in Waaree style: green magnifier, clear button when it has text. */
export function SearchInput({
  value,
  onValueChange,
  placeholder = "Search",
  label = "Search",
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name when there's no visible label. */
  label?: string;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      <Input
        type="search"
        role="searchbox"
        aria-label={label}
        icon={<Search strokeWidth={1.75} />}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onValueChange("")}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-sm p-1 text-muted hover:bg-surface-muted hover:text-foreground"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  const fieldProps = useFieldControlProps(props);
  return (
    <textarea
      className={cn(controlClasses, "min-h-24 px-3.5 py-2.5 leading-relaxed", className)}
      {...props}
      {...fieldProps}
    />
  );
}
