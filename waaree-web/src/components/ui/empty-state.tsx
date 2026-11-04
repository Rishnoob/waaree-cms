import { cn } from "@/lib/utils/cn";

/**
 * An empty screen that teaches the next step instead of showing a blank table.
 *
 *   <EmptyState icon={<FileText />} title="No pages yet"
 *     description="Pages are what visitors see. Start from a template or a blank page."
 *     action={<Button arrow>Create your first page</Button>} />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface/60 px-6 py-16 text-center",
        className,
      )}
    >
      {icon && (
        <div
          aria-hidden
          className="mb-1 flex size-14 items-center justify-center rounded-full bg-(image:--brand-tint) text-primary [&_svg]:size-7 [&_svg]:stroke-[1.5]"
        >
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="max-w-sm text-sm text-body">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
