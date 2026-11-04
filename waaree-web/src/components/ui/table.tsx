import { cn } from "@/lib/utils/cn";

/**
 * Data table: hairline rows, quiet header, hover highlight. Compose like a normal <table>:
 *
 *   <Table><THead><Tr><Th>Name</Th></Tr></THead><TBody><Tr><Td>…</Td></Tr></TBody></Table>
 */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-surface shadow-soft">
      <table className={cn("w-full border-collapse text-left text-sm", className)} {...props} />
    </div>
  );
}

export function THead(props: React.ComponentProps<"thead">) {
  return <thead className="border-b border-border bg-surface-muted/70" {...props} />;
}

export function TBody(props: React.ComponentProps<"tbody">) {
  return <tbody className="divide-y divide-border" {...props} />;
}

export function Tr({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("transition-colors duration-(--duration) hover:bg-surface-muted/60", className)} {...props} />;
}

export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn("px-4 py-3 text-[0.6875rem] font-medium tracking-wider whitespace-nowrap text-muted uppercase", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-3.5 align-middle text-body", className)} {...props} />;
}
