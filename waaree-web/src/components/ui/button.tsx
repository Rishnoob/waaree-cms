import { cva, type VariantProps } from "class-variance-authority";
import { CircleArrowRight, LoaderCircle } from "lucide-react";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap select-none " +
    "transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration) ease-(--easing) " +
    "focus-visible:shadow-glow focus-visible:outline-none active:scale-[0.97] " +
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.18),var(--shadow-soft)] hover:-translate-y-px hover:bg-primary-strong hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),var(--shadow)]",
        secondary:
          "border border-border-strong bg-surface text-foreground shadow-soft hover:border-brand-green/60 hover:text-primary-strong",
        ghost: "text-foreground hover:bg-foreground/5",
        danger: "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        sm: "h-8 px-3.5 text-sm [&_svg]:size-4",
        md: "h-10 px-5 text-[0.9375rem] [&_svg]:size-5",
        lg: "h-12 px-6 text-base [&_svg]:size-6",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Waaree's signature circle-arrow icon before the label ("Explore More", "Download Now"). */
    arrow?: boolean;
    /** Shows a spinner and disables the button. */
    loading?: boolean;
    /** Render as the child element (e.g. a Next <Link>) while keeping button styles. */
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  arrow,
  loading,
  asChild,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading ? (
        <LoaderCircle aria-hidden className="animate-spin" />
      ) : (
        arrow && <CircleArrowRight aria-hidden strokeWidth={1.5} />
      )}
      {children}
    </button>
  );
}

export { buttonVariants };
