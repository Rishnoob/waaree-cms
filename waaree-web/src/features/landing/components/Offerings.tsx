import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { PORTFOLIO, SOLUTIONS } from "../data/home";
import { waareeUrl } from "./Chapter";

type Item = { title: string; text: string; image: string; href: string };
const ITEMS: Item[] = [...PORTFOLIO.tabs.flatMap((t): readonly Item[] => t.items), ...SOLUTIONS.items];

/**
 * What Waaree offers, as one slim strip (not a chapter): the story has already shown what Waaree
 * makes and builds; this is just the way into each product on waaree.com.
 */
export function Offerings() {
  return (
    <section id="offerings" aria-labelledby="offerings-title" className="bg-white px-6 py-14 md:px-[7vw] md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="offerings-title" className="text-xl font-light text-foreground md:text-2xl">
          Everything in this story, on waaree.com
        </h2>
        <a href={waareeUrl("/")} className="inline-flex items-center gap-1 text-sm font-medium text-primary-strong hover:underline">
          Visit waaree.com <ArrowUpRight aria-hidden className="size-3.5" />
        </a>
      </div>
      <ul className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((i) => (
          <li key={i.title}>
            <a
              href={waareeUrl(i.href)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-white p-2 pr-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-green/40 hover:shadow-soft focus-visible:shadow-glow focus-visible:outline-none"
            >
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-(image:--brand-tint)">
                <Image src={i.image} alt="" fill sizes="56px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{i.title}</span>
                <span className="block text-xs text-muted max-md:line-clamp-2 md:truncate">{i.text}</span>
              </span>
              <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted transition-colors group-hover:text-primary-strong" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
