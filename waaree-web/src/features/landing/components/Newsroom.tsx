import { ArrowUpRight } from "lucide-react";

import { NEWS } from "../data/home";
import { waareeUrl } from "./Chapter";

/** The latest from Waaree: three headlines in a slim strip (the story is wrapping up; the full newsroom is on waaree.com). */
export function Newsroom() {
  return (
    <section id="newsroom" aria-labelledby="news-title" className="bg-white px-6 pb-12 md:px-[7vw]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-10">
        <h2 id="news-title" className="text-xl font-light text-foreground md:text-2xl">
          The latest from Waaree
        </h2>
        <a href={waareeUrl("/press-release")} className="inline-flex items-center gap-1 text-sm font-medium text-primary-strong hover:underline">
          All news <ArrowUpRight aria-hidden className="size-3.5" />
        </a>
      </div>
      <ul className="mt-5 grid gap-2 md:grid-cols-3">
        {NEWS.slice(0, 3).map((n) => (
          <li key={n.title}>
            <a
              href={waareeUrl("/press-release")}
              className="group flex h-full flex-col gap-2 rounded-xl border border-border bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-green/40 hover:shadow-soft focus-visible:shadow-glow focus-visible:outline-none"
            >
              <span className="flex items-center justify-between text-xs text-muted tabular-nums">
                {n.date}
                <ArrowUpRight aria-hidden className="size-3.5 transition-colors group-hover:text-primary-strong" />
              </span>
              <span className="text-sm leading-snug text-foreground transition-colors group-hover:text-primary-strong">{n.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
