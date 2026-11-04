/** Top of every CMS screen, in the website’s voice: eyebrow, light large title, one line, main action. */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-8">
      <div>
        {eyebrow && <p className="mb-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">{eyebrow}</p>}
        <h1 className="text-4xl leading-tight font-light tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-body">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </header>
  );
}

/** Wrapper for CMS screens: full content width (the shell provides the 7vw margins). */
export function CmsPage({ children }: { children: React.ReactNode }) {
  return <div className="w-full">{children}</div>;
}
