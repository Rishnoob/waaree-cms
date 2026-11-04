import { cn } from "@/lib/utils/cn";

import { chapterNumber } from "../chapters";

/**
 * One chapter of the landing story. Every section uses this so spacing, eyebrows and headings
 * stay consistent. `tone` tints the whole page as the chapter arrives (see LandingPage). Elements with `data-reveal`
 * animate in on scroll (wired once in LandingPage).
 */
export function Chapter({
  id,
  tone = "light",
  eyebrow,
  title,
  intro,
  className,
  headerClassName,
  children,
}: {
  id: string;
  tone?: "light" | "mist" | "sky";
  eyebrow?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      data-chapter={id}
      data-tone={tone}
      aria-labelledby={title ? `${id}-title` : undefined}
      className={cn(
        "relative overflow-hidden px-6 pt-[5.5rem] pb-14 text-body md:px-[7vw] md:pt-28 md:pb-20",
        // tinted chapters are a visible band whose edges melt into the white page
        tone === "mist" && "bg-[linear-gradient(180deg,rgb(243_248_245/0)_0,#f3f8f5_5rem,#f3f8f5_calc(100%-5rem),rgb(243_248_245/0)_100%)]",
        className,
      )}
    >
      {(eyebrow || title || intro) && (
        <ChapterHeader id={id} eyebrow={eyebrow} title={title} intro={intro} className={headerClassName} />
      )}
      {children}
    </section>
  );
}

/**
 * Eyebrow, heading and intro of a chapter. Chapters with a side-by-side first screen (Factories)
 * render it themselves inside their own layout.
 */
export function ChapterHeader({
  id,
  eyebrow,
  title,
  intro,
  compact = false,
  className,
}: {
  id: string;
  eyebrow?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const n = chapterNumber(id);
  const eyebrowEl = eyebrow && (
    <p data-reveal className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
      {n && (
        <>
          <span className="text-muted tabular-nums">{n}</span>
          <span aria-hidden className="h-px w-6 bg-border-strong" />
        </>
      )}
      {eyebrow}
    </p>
  );
  const titleEl = title && (
    <h2
      id={`${id}-title`}
      data-split
      className={cn(
        "mt-4 leading-[1.08] font-light tracking-tight text-balance text-foreground",
        compact ? "text-4xl lg:text-[2.75rem]" : "text-4xl sm:text-5xl lg:text-6xl",
      )}
    >
      {title}
    </h2>
  );

  // Compact (side-by-side chapters): stacked. Otherwise one grid for every chapter: the headline
  // on the left, one line of intro on the right, both resting on the same baseline.
  if (compact) {
    return (
      <header className={cn("relative mb-12 max-w-3xl", className)}>
        {eyebrowEl}
        {titleEl}
        {intro && <p data-reveal className="mt-4 max-w-2xl text-base leading-relaxed text-body">{intro}</p>}
      </header>
    );
  }
  return (
    <header className={cn("relative mb-10 grid gap-6 lg:mb-12 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:items-end lg:gap-16", className)}>
      <div>
        {eyebrowEl}
        {titleEl}
      </div>
      {intro && <p data-reveal className="max-w-xl text-lg leading-relaxed text-body lg:pb-2">{intro}</p>}
    </header>
  );
}

/** Waaree gradient text for the one emphasised phrase in a heading. */
export function Glow({ children }: { children: React.ReactNode }) {
  return <span className="bg-(image:--brand-gradient) bg-clip-text text-transparent">{children}</span>;
}

/** Links to pages that still live on waaree.com. */
export function waareeUrl(path: string) {
  return path.startsWith("http") ? path : `https://www.waaree.com${path}`;
}
