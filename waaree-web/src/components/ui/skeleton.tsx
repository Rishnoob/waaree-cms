import { cn } from "@/lib/utils/cn";

/** Grey placeholder shape shown while content loads. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-surface-muted", className)} {...props} />;
}
