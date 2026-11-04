"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

import { chapterNumber } from "../chapters";
import { AHEAD } from "../data/projects";
import { Glow } from "./Chapter";

/** The road ahead, as Waaree states it (IAR26 pp. 8–9, 32–33, 42–43, 60–61). */
const MILESTONES: { when: string; items: [string, string][] }[] = [
  { when: "FY27", items: [...AHEAD.fy27.map(([v, l]) => [v, l] as [string, string]), ["4.8 GW", "In the United States"]] },
  { when: "FY28", items: [["10 GW", "Ingots and wafers, Nagpur"]] },
  { when: "FY29", items: [["20 GWh", "Battery cells, packs, containers"], ["2,500 TPD", "Solar glass"]] },
  { when: "2030", items: [["Net zero", "Own operations (Scope 1 & 2)"], ["100%", "Renewable power for its plants"]] },
  { when: "< 5 yrs", items: [[`₹${AHEAD.revenueTargetCr.toLocaleString("en-IN")} Cr`, "Revenue target"]] },
  { when: "2040", items: [["Net zero", "Across the value chain (Scope 3)"]] },
];

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * What’s next (Act IV): the plan, dated, kept minimal. The chapter pins and you travel along one
 * glowing road; each stop is a year and its numbers, lit as it reaches the centre. Then the market
 * Waaree is building for, to scale. (What arrives in FY27, project by project, is in Waaree now.)
 */
export function WhatsNext() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const track = root.current!.querySelector<HTMLElement>(".wn-track")!;
      // travel: the track slides by exactly its overflow over the pinned stretch
      const travel = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: { trigger: ".wn-pin", start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.6, invalidateOnRefresh: true },
      });
      // each stop lights as it nears the centre and dims as it leaves
      gsap.utils.toArray<HTMLElement>(".wn-stop").forEach((el) => {
        gsap
          .timeline({ scrollTrigger: { trigger: el, containerAnimation: travel, start: "left 95%", end: "right 5%", scrub: true } })
          .fromTo(el, { opacity: 0.18 }, { opacity: 1, duration: 1, ease: "none" })
          .to(el, { opacity: 0.18, duration: 1, ease: "none" }, 1.4);
      });
      if (reduced) return;
      // the bar grows from Waaree 1.0’s sliver to the whole opportunity as it scrolls into view
      gsap.fromTo(".mk-fill", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: ".mk", start: "top 85%", end: "top 45%", scrub: true } });
    },
    { scope: root },
  );
  return (
    <section ref={root} id="whats-next" data-chapter="whats-next" data-tone="light" aria-labelledby="next-title" className="relative bg-white">
      {/* the road, pinned: you travel along it */}
      <div className="wn-pin relative h-[420svh]">
        <div className="sticky top-0 h-svh overflow-hidden bg-[radial-gradient(70%_60%_at_50%_60%,#f1f8fc_0%,#ffffff_70%)]">
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 [background-image:linear-gradient(rgb(40_169_226/0.07)_1px,transparent_1px),linear-gradient(90deg,rgb(40_169_226/0.07)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(180deg,transparent,#000)] [transform:perspective(800px)_rotateX(60deg)] [transform-origin:bottom]" />

          <div className="absolute inset-x-0 top-[13svh] px-6 md:px-[7vw]">
            <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
              <span className="text-muted tabular-nums">{chapterNumber("whats-next")}</span>
              <span aria-hidden className="h-px w-6 bg-border-strong" />
              What’s next
            </p>
            <h2 id="next-title" data-split className="mt-4 max-w-3xl text-3xl leading-[1.08] font-light tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
              Next: the whole chain, <Glow>from silicon to the socket.</Glow>
            </h2>
          </div>

          <ol className="wn-track absolute top-[44svh] left-0 flex w-max items-start pr-[40vw] pl-6 will-change-transform md:pl-[7vw]">
            {/* the road */}
            <span aria-hidden className="absolute top-[4.85rem] right-0 left-0 h-px bg-[linear-gradient(90deg,#0db02b,#28a9e2_55%,#e08a0c_90%,transparent)] shadow-[0_0_12px_rgb(40_169_226/0.6)] md:top-[6.95rem]">
              <span className="wn-pulse absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_4px_rgb(255_255_255/0.9),0_0_22px_8px_rgb(40_169_226/0.55)]" />
            </span>
            {MILESTONES.map((m, i) => (
              <li key={m.when} className="wn-stop relative w-[78vw] shrink-0 pr-10 md:w-[34vw]">
                <p className="bg-[linear-gradient(90deg,#0db02b,#28a9e2)] bg-clip-text text-6xl leading-none font-extralight tracking-tight text-transparent md:text-8xl" style={i >= 4 ? { backgroundImage: "linear-gradient(90deg,#28a9e2,#e08a0c)" } : undefined}>
                  {m.when}
                </p>
                <span aria-hidden className="mt-3 block size-2.5 rounded-full bg-white ring-2 ring-[#28a9e2] shadow-[0_0_14px_#28a9e2]" />
                <dl className="mt-7 grid max-w-md grid-cols-2 gap-x-8 gap-y-5">
                  {m.items.map(([v, l]) => (
                    <div key={l}>
                      <dd className="text-2xl leading-tight font-light text-foreground tabular-nums md:text-3xl">{v}</dd>
                      <dt className="mt-1 text-xs leading-snug text-muted">{l}</dt>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* the market, to scale (one bar) */}
      <div className="px-6 pt-4 pb-20 md:px-[7vw]">
        <div data-reveal className="grid items-center gap-10 border-t border-border pt-12 md:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">The market it is building for</p>
            <p className="mt-3 text-3xl leading-tight font-light text-foreground md:text-4xl">
              {AHEAD.market.from} <span className="text-muted">→</span> <Glow>{AHEAD.market.to}</Glow>
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-body">
              by {AHEAD.market.by}, as Waaree grows from modules to the whole chain. FY27 operating EBITDA guidance: {AHEAD.ebitdaFY27}.
            </p>
          </div>
          {/* one bar, to scale: the whole of it is the 2035 opportunity; Waaree 1.0’s market is the lit sliver */}
          <div className="mk" role="img" aria-label={`${AHEAD.market.from} is 8% of ${AHEAD.market.to}: a 12.5× larger market`}>
            <div className="relative h-12 overflow-hidden rounded-full bg-[repeating-linear-gradient(90deg,rgb(40_169_226/0.06)_0_10px,rgb(40_169_226/0.1)_10px_11px)] ring-1 ring-border">
              <div className="mk-fill absolute inset-y-0 right-0 left-[8%] origin-left overflow-hidden bg-[linear-gradient(90deg,rgb(40_169_226/0.5),rgb(40_169_226/0.15))]">
                <span aria-hidden className="wn-shimmer absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.55),transparent)]" />
              </div>
              <div className="absolute inset-y-0 left-0 w-[8%] rounded-l-full bg-[linear-gradient(90deg,#0a9a3a,#19c46a)] shadow-[0_0_18px_rgb(13_176_43/0.5)]" />
              <span className="absolute top-1/2 right-5 -translate-y-1/2 bg-(image:--brand-gradient) bg-clip-text text-2xl font-light text-transparent tabular-nums">12.5×</span>
            </div>
            <p className="mt-2 flex justify-between text-[0.625rem] text-muted">
              <span>Waaree 1.0 · modules</span>
              <span>Waaree 2.0 · silicon to socket · drawn to scale</span>
            </p>
          </div>
        </div>
        <p className="mt-8 text-[0.6875rem] text-muted">Targets as stated in Waaree’s Integrated Annual Report FY2025-26. Forward-looking, not guaranteed.</p>
      </div>
    </section>
  );
}
