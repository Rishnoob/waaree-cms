"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { CHAPTERS } from "../chapters";


/** Fixed chapter indicator (desktop): shows where you are and jumps to any chapter. */
export function ChapterRail() {
  const [active, setActive] = useState("story");

  useEffect(() => {
    const els = CHAPTERS.map((c) => document.getElementById(c.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          setActive((e.target as HTMLElement).id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const index = Math.max(0, CHAPTERS.findIndex((c) => c.id === active));
  return (
    // only the dots take clicks: the labels (hidden until you hover a dot) must never cover the page
    // underneath, e.g. a carousel's arrows near the right edge
    <nav aria-label="Chapters" className="pointer-events-none fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 xl:block">
      {/* where we are in the story */}
      <p className="mb-4 text-right text-[0.625rem] font-medium tracking-[0.2em] text-muted tabular-nums">
        <span className="text-foreground">{String(index + 1).padStart(2, "0")}</span> / {CHAPTERS.length}
      </p>
      <ol className="relative flex flex-col gap-3">
        <span aria-hidden className="absolute top-1 right-[2.5px] bottom-1 w-px bg-foreground/10" />
        <span
          aria-hidden
          className="absolute top-1 right-[2.5px] w-px origin-top bg-(image:--brand-gradient) transition-[height] duration-700"
          style={{ height: `calc((100% - 0.5rem) * ${index / (CHAPTERS.length - 1)})` }}
        />
        {CHAPTERS.map((c) => {
          const on = c.id === active;
          return (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                aria-current={on ? "true" : undefined}
                className="group pointer-events-none flex items-center justify-end gap-3 rounded-full focus-visible:shadow-glow focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "text-xs whitespace-nowrap transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100",
                    on ? "rounded-full bg-white/80 px-2 py-0.5 font-medium text-foreground opacity-100 shadow-sm backdrop-blur" : "text-foreground/70 opacity-0",
                  )}
                >
                  {c.label}
                </span>
                <span
                  className={cn(
                    "pointer-events-auto block h-1.5 rounded-full transition-all duration-500 before:absolute before:-inset-2 before:content-['']",
                    on ? "relative w-6 bg-(image:--brand-gradient) shadow-[0_0_10px_rgb(13_176_43/0.6)]" : "relative w-1.5 bg-foreground/25",
                  )}
                />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
