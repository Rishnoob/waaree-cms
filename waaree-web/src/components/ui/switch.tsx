"use client";

import { Switch as RSwitch } from "radix-ui";

import { cn } from "@/lib/utils/cn";

import { useFieldControlProps } from "./field";

/** On/off toggle, e.g. "Show this block". Needs a label: inside <Field>, or via `label`. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const fieldProps = useFieldControlProps({ id });
  return (
    <RSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-border transition-colors",
        "duration-(--duration) disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary",
        className,
      )}
      {...fieldProps}
    >
      <RSwitch.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow-md transition-transform duration-(--duration) data-[state=checked]:translate-x-[1.375rem]" />
    </RSwitch.Root>
  );
}
