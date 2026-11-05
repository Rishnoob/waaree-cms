"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Building2, Leaf, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { chapterNumber } from "../chapters";
import { ESTIMATES, LEVELS } from "../data/impact";
import { impact } from "../story-state";
import { Glow } from "./Chapter";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const ImpactIsland = dynamic(() => import("../three/ImpactIsland"), { ssr: false });
const ICONS = { planet: Leaf, people: Users, prosperity: Building2 } as const;

/**
 * Impact at every level: a pinned chapter. One island turns to show the planet, the people and
 * the prosperity Waaree’s work reaches; the panel on the left follows with the numbers.
 */
export function ImpactLevels() {
  const root = useRef<HTMLElement>(null);
  const [level, setLevel] = useState(0);

  useGSAP(
    () => {
      impact.progress = 0;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let shown = 0;
      gsap.to(impact, {
        progress: 1,
        ease: "none",
        onUpdate: () => {
          const l = impact.progress < 0.36 ? 0 : impact.progress < 0.69 ? 1 : 2;
          if (l !== shown) setLevel((shown = l));
        },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.7 },
      });
    },
    { scope: root },
  );

  const L = LEVELS[level]!;
  return (
    <section ref={root} id="impact" data-chapter="impact" data-tone="light" aria-labelledby="impact-title" className="relative h-[520svh] bg-white">
      <div className="sticky top-0 h-svh overflow-hidden bg-[#eef8ff]">
        <ImpactIsland />
        {/* the sky melts into the white page above and below */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[14svh] bg-[linear-gradient(180deg,#ffffff,rgb(255_255_255/0))]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[10svh] bg-[linear-gradient(0deg,#ffffff,rgb(255_255_255/0))]" />

        <div className="pointer-events-none absolute inset-x-0 top-[11svh] z-10 px-4 md:top-0 md:bottom-0 md:flex md:max-w-[40rem] md:flex-col md:justify-center md:pl-[calc(7vw-2rem)]">
          <div className="rounded-2xl border border-white/60 bg-white/70 p-5 shadow-[0_30px_80px_-40px_rgb(5_30_60/0.45)] backdrop-blur-xl md:bg-white/60 md:p-8">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
            <span className="text-muted tabular-nums">{chapterNumber("impact")}</span>
            <span aria-hidden className="h-px w-6 bg-border-strong" />
            Impact at every level
          </p>
          <h2 id="impact-title" data-split className="mt-4 text-3xl leading-[1.08] font-light tracking-tight text-balance text-foreground sm:text-5xl">
            ≈{ESTIMATES.co2Mt.toFixed(0)} Mt less CO₂ a year. <Glow>Power for <span className="whitespace-nowrap">≈{ESTIMATES.homesMn.toFixed(0)} million</span> homes.</Glow>
          </h2>

          {/* level switcher (follows the scroll) */}
          <ol className="mt-5 flex gap-2 md:mt-7" aria-label="Levels">
            {LEVELS.map((l, i) => {
              const Icon = ICONS[l.key];
              return (
                <li
                  key={l.key}
                  aria-current={i === level ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-500",
                    i === level ? "border-transparent bg-(image:--brand-gradient) text-white shadow-[0_8px_20px_-8px_rgb(13_176_43/0.6)]" : "border-border bg-white/70 text-muted",
                  )}
                >
                  <Icon aria-hidden className="size-3.5" />
                  {l.label}
                </li>
              );
            })}
          </ol>

          <div key={level} className="mt-4 animate-rise-in md:mt-6" aria-live="polite">
            <p className="text-lg font-light text-foreground md:text-xl">{L.headline}</p>
            <p className="mt-4 bg-(image:--brand-gradient) bg-clip-text text-5xl leading-none font-light tracking-tight text-transparent tabular-nums md:text-6xl">{L.big}</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-body">{L.bigText}</p>
            <dl className="mt-6 grid max-w-md grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 max-md:hidden">
              {L.stats.map(([v, label]) => (
                <div key={label}>
                  <dt className="text-xl font-medium text-foreground tabular-nums">{v}</dt>
                  <dd className="mt-0.5 text-xs leading-snug text-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          </div>
        </div>

        <p className="pointer-events-none absolute right-6 bottom-5 z-10 max-w-sm text-right text-[0.625rem] leading-snug text-muted max-md:left-6 max-md:rounded-lg max-md:bg-white/75 max-md:px-3 max-md:py-2 max-md:backdrop-blur md:right-[7vw]">
          Reported figures: Waaree Integrated Annual Report FY2025-26 and BRSR. Estimates: {ESTIMATES.how}
        </p>
      </div>
    </section>
  );
}
