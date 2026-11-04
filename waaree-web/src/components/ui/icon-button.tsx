import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const iconButtonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md transition-colors duration-(--duration) " +
    "ease-(--easing) focus-visible:shadow-glow focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-strong",
        secondary: "border border-border bg-surface text-foreground shadow-soft hover:border-brand-green/60 hover:text-primary",
        ghost: "text-muted hover:bg-foreground/5 hover:text-foreground",
      },
      size: {
        sm: "size-8 [&_svg]:size-4",
        md: "size-10 [&_svg]:size-5",
        lg: "size-12 [&_svg]:size-6",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

/** Round icon-only button. `label` is required: it's what screen readers and AI testers see. */
export function IconButton({
  label,
  className,
  variant,
  size,
  ...props
}: Omit<React.ComponentProps<"button">, "aria-label"> &
  VariantProps<typeof iconButtonVariants> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
