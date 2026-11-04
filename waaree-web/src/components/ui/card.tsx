import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const cardVariants = cva("rounded-lg transition-[box-shadow,transform,border-color] duration-(--duration) ease-(--easing)", {
  variants: {
    variant: {
      /** White card with soft shadow (default). */
      default: "border border-border bg-surface shadow-soft",
      /** Waaree's green→blue tint (document / download cards). */
      tint: "border border-brand-green/10 bg-surface bg-(image:--brand-tint) shadow-soft",
      /** Flat card with a hairline border (CMS lists, settings). */
      outline: "border border-border bg-surface",
    },
    interactive: { true: "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md", false: "" },
    padding: { none: "", md: "p-5", lg: "p-7" },
  },
  defaultVariants: { variant: "default", interactive: false, padding: "md" },
});

export function Card({
  className,
  variant,
  interactive,
  padding,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return <div className={cn(cardVariants({ variant, interactive, padding }), className)} {...props} />;
}

/** Top image of a content card (radius 20px, like waaree.com blog/event cards). */
export function CardMedia({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("aspect-video overflow-hidden rounded-lg bg-surface-muted", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 className={cn("text-lg leading-snug font-semibold text-foreground", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-[0.9375rem] leading-relaxed text-body", className)} {...props} />;
}

/** Small row above the title: category label, date, location... */
export function CardMeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted [&_svg]:size-4 [&_svg]:text-brand-green", className)}
      {...props}
    />
  );
}
