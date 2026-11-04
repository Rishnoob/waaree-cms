"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { FACILITIES } from "../data/facilities";
import { factories } from "../story-state";
import { ChapterHeader, Glow } from "./Chapter";
import { KindIcon } from "./facility-ui";
import { HANDOFF_SECTION, HANDOFF_STAGE, HANDOFF_STYLE, showWhenPinned } from "./handoff";
import { HoloMap } from "./HoloMap";

const GROUPS = [
  { title: "Manufacturing in India", filter: (f: (typeof FACILITIES)[number]) => f.country === "India" && f.kind === "manufacturing" },
  { title: "Rising next", filter: (f: (typeof FACILITIES)[number]) => f.kind === "development" },
  { title: "Offices", filter: (f: (typeof FACILITIES)[number]) => f.country === "India" && f.kind === "office" },
];

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Factories. A pinned, full-screen stage: it opens on one solar-panel tile (the panel “How it’s
 * made” ends on, at the hand-off frame) and pulls back to India made of panels, with every Waaree
 * site as a status tower. (Every project’s progress is in “Waaree now”.)
 */
export function Factories() {
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      factories.intro = 0;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      showWhenPinned(pin.current!, stage.current!);
      gsap
        .timeline({ scrollTrigger: { trigger: ".fac-pin", start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.7 } })
        .fromTo(factories, { intro: 0 }, { intro: 1, duration: 6, ease: "none" }, 0)
        .fromTo(".fac-copy", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 1.4, ease: "power2.out" }, 4.8)
        .fromTo(".fac-cue", { opacity: 1 }, { opacity: 0, duration: 1 }, 0.6)
        .to({}, { duration: 3 }, 6.2);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="factories" data-chapter="factories" data-tone="light" aria-labelledby="factories-title" className={HANDOFF_SECTION} style={HANDOFF_STYLE}>
      <div ref={pin} className="fac-pin relative h-[260svh]">
        {/* the map, once it has pulled back (what the menu links to) */}
        <span id="factories-map" aria-hidden className="absolute top-[110svh]" />
        <div ref={stage} className={cn("sticky top-0 h-svh overflow-hidden bg-[radial-gradient(70%_70%_at_65%_55%,#f1f9f4_0%,#ffffff_70%)]", HANDOFF_STAGE)}>
          <HoloMap active={active} onActive={setActive} className="absolute inset-0" />

          <p className="fac-cue pointer-events-none absolute inset-x-0 bottom-[10svh] text-center text-sm font-medium tracking-[0.2em] text-foreground/75 uppercase">
            Now pull back. This panel is one of millions ↓
          </p>

          <div className="fac-copy pointer-events-none absolute inset-y-0 left-0 flex w-full max-w-[31rem] flex-col justify-center bg-[linear-gradient(90deg,#ffffff_55%,rgb(255_255_255/0))] px-6 pr-16 opacity-0 md:pl-[7vw]">
            <ChapterHeader
              id="factories"
              compact
              className="mb-6"
              eyebrow="Where it’s made"
              title={
                <>
                  25.8 GW a year, <Glow>made in India and the US.</Glow>
                </>
              }
              intro="Every step you just saw, on one map. Each tower is a Waaree site. Crystal: producing now. Amber hologram: being built."
            />
            <div className="pointer-events-auto flex flex-col gap-3 max-md:hidden">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <p className="mb-0.5 text-[0.625rem] tracking-[0.2em] text-muted uppercase">{g.title}</p>
                  <ul className="flex flex-col">
                    {FACILITIES.filter(g.filter).map((f) => (
                      <li key={f.slug}>
                        <Link
                          href={`/factories/${f.slug}`}
                          onPointerEnter={() => setActive(f.slug)}
                          onPointerLeave={() => setActive(null)}
                          onFocus={() => setActive(f.slug)}
                          onBlur={() => setActive(null)}
                          className={cn(
                            "group flex items-center justify-between gap-3 border-b border-border py-1.5 transition-colors duration-300 focus-visible:shadow-glow focus-visible:outline-none",
                            active === f.slug ? "text-foreground" : "text-body hover:text-foreground",
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <KindIcon f={f} className={cn("size-4 shrink-0", f.kind === "development" ? "text-[#e5940f]" : f.kind === "office" ? "text-[#1f97d4]" : "text-primary")} />
                            <span className="text-sm font-medium">{f.short}</span>
                            <span className="truncate text-xs text-muted">{f.makes}</span>
                          </span>
                          <ArrowRight aria-hidden className={cn("size-4 shrink-0 transition-all duration-300", active === f.slug ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
