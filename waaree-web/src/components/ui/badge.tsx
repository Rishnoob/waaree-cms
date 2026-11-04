import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        neutral: "bg-surface-muted text-body ring-border",
        success: "bg-primary/10 text-primary-strong ring-primary/15",
        info: "bg-info/10 text-info ring-info/15",
        warning: "bg-warning/10 text-warning ring-warning/15",
        danger: "bg-danger/10 text-danger ring-danger/15",
        /** Gradient badge for special moments ("New", "AI"). */
        brand: "bg-(image:--brand-gradient) text-white ring-transparent",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

/** Status / label pill: "Draft", "Pending approval", "Published", "New"... */
export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
