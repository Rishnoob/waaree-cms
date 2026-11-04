"use client";

import { Label } from "radix-ui";
import { createContext, useContext, useId } from "react";

import { cn } from "@/lib/utils/cn";

type FieldContext = { id: string; hintId?: string; errorId?: string; invalid: boolean };
const Ctx = createContext<FieldContext | null>(null);

/** Connects a control to the Field around it (id, aria-describedby, aria-invalid). */
export function useField() {
  return useContext(Ctx);
}

/**
 * Label + control + hint/error, wired for accessibility.
 *
 *   <Field label="Page title" hint="Shown in the browser tab" error={errors.title?.message}>
 *     <Input />
 *   </Field>
 */
export function Field({
  label,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <Ctx value={{ id, hintId, errorId, invalid: Boolean(error) }}>
      <div className={cn("flex flex-col gap-1.5", className)}>
        <Label.Root htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
          {required && (
            <span aria-hidden className="ml-0.5 text-danger">
              *
            </span>
          )}
        </Label.Root>
        {children}
        {hint && !error && (
          <p id={hintId} className="text-xs text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    </Ctx>
  );
}

/** Props a control spreads to join its Field. */
export function useFieldControlProps(own: { id?: string; "aria-describedby"?: string }) {
  const field = useField();
  if (!field) return {};
  return {
    id: own.id ?? field.id,
    "aria-describedby": [own["aria-describedby"], field.hintId, field.errorId].filter(Boolean).join(" ") || undefined,
    "aria-invalid": field.invalid || undefined,
  };
}
