"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hand } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef } from "react";

import { cn } from "@/lib/utils/cn";

import { chapterNumber } from "../chapters";
import { FY26, FY26_SOURCE, GROWTH, ORDER_BOOK, REVENUE_TARGET, revenueAt, yearAt } from "../data/annual-report";
import { growth } from "../story-state";
import { Glow } from "./Chapter";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const RevenueSkyline = dynamic(() => import("../three/RevenueSkyline"), { ssr: false });

const crore = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")} Cr`;
const first = GROWTH[0]!;
const last = GROWTH[GROWTH.length - 1]!;
const times = (a: number, b: number) => Math.floor(b / a);

/** What each column of the skyline is (labels pinned above them by the 3D scene). */
const LABELS = [
  ...GROWTH.map((g) => ({ top: g.year, value: crore(g.revenue), sub: `${crore(g.pat)} profit`, tone: "text-foreground" })),
  { top: `Order book · ${ORDER_BOOK.asOf}`, value: crore(ORDER_BOOK.cr), sub: "Won, still to deliver", tone: "text-brand-blue" },
  { top: "The goal · in under 5 years", value: crore(REVENUE_TARGET), sub: "Revenue target", tone: "text-[#b86e00]" },
];

/**
 * Growth (Act III): the headline says it, the skyline shows it. Glass columns rise to scale year by
 * year (FY22 → FY26) with profit as a gold core; then the camera pulls back to the order book and
 * the ₹1,00,000 Cr target. The counter and year track are written straight to the DOM.
 */
export function Growth() {
  const root = useRef<HTMLElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const years = useRef<HTMLOListElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);

  useGSAP(
    () => {
      growth.progress = 0;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let shownYear = -2;
      const update = () => {
        const p = growth.progress;
        if (count.current) count.current.textContent = crore(revenueAt(p));
        const y = yearAt(p);
        if (y !== shownYear && years.current) {
          Array.from(years.current.children).forEach((li, k) => {
            li.toggleAttribute("data-on", k === y);
            li.toggleAttribute("data-done", k < y);
          });
          shownYear = y;
        }
      };
      update();
      gsap
        .timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.6 },
          onUpdate: update,
        })
        .to(growth, { progress: 1, duration: 10, ease: "none" }, 0)
        .fromTo(".gr-profit", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 7.4)
        .to(".gr-profit", { opacity: 0, y: -16, duration: 0.4 }, 8.5)
        .fromTo(".gr-ahead", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 8.8)
        .to({}, { duration: 0.4 }, 9.6);
      // phones: no room beside the columns, so the last beat takes the headline’s place at the top
      gsap.matchMedia().add("(max-width: 767px)", () => {
        const beats = root.current!.querySelector<HTMLElement>(".gr-beats")!;
        const title = root.current!.querySelector<HTMLElement>("#growth-title")!;
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.6 } })
          .to(".gr-intro", { opacity: 0, duration: 0.4 }, 8.5)
          .set(".gr-beats", { y: () => title.offsetTop - beats.offsetTop }, 8.6)
          .to({}, { duration: 0.4 }, 9.6);
      });
    },
    { scope: root },
  );

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = e.clientX;
    growth.dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current === null) return;
    growth.spin = (e.clientX - drag.current) * 0.004;
    drag.current = e.clientX;
  };
  const endDrag = () => {
    drag.current = null;
    growth.dragging = false;
  };

  return (
    <section ref={root} id="growth" data-chapter="growth" data-tone="light" aria-labelledby="growth-title" className="relative h-[460svh] bg-white">
      <div
        className="sticky top-0 h-svh touch-pan-y overflow-hidden select-none md:cursor-grab md:active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        data-cursor="Drag"
      >
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_70%,#eef8f2_0%,#ffffff_70%)]" />
        <RevenueSkyline labels={labels} />

        {/* what each column is */}
        <div ref={labels} aria-hidden className="pointer-events-none absolute inset-0">
          {LABELS.map((l) => (
            <div key={l.top} data-col className="group absolute top-0 left-0 opacity-0 will-change-transform">
              <div className="-translate-x-1/2 -translate-y-full pb-2 text-center whitespace-nowrap">
                <p className="text-[0.625rem] tracking-[0.15em] text-muted uppercase max-md:mx-auto max-md:max-w-[5.5rem] max-md:text-[0.5625rem] max-md:leading-tight max-md:whitespace-normal">{l.top}</p>
                <p className={cn("text-sm font-medium tabular-nums max-md:text-[0.6875rem] md:text-base", l.tone)}>{l.value}</p>
                <p className="hidden text-[0.6875rem] text-[#b86e00] group-data-[profit]:block">{l.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[11svh] px-6 md:top-0 md:bottom-0 md:flex md:max-w-[36rem] md:flex-col md:justify-center md:pl-[7vw]">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
            <span className="text-muted tabular-nums">{chapterNumber("growth")}</span>
            <span aria-hidden className="h-px w-6 bg-border-strong" />
            Growth
          </p>
          <div className="gr-intro">
          <h2 id="growth-title" data-split className="mt-4 text-4xl leading-[1.06] font-light tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            Revenue up <span className="whitespace-nowrap">{times(first.revenue, last.revenue)}×.</span>{" "}
            <Glow>
              Profit up <span className="whitespace-nowrap">{times(first.pat, last.pat)}×.</span>
            </Glow>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-body md:text-lg">
            In four years: revenue from {crore(first.revenue)} to {crore(last.revenue)}, profit from {crore(first.pat)} to {crore(last.pat)}.
          </p>

          <p className="mt-6 text-5xl font-light tracking-tight text-foreground tabular-nums md:mt-8 md:text-7xl" aria-live="off">
            <span ref={count}>₹0 Cr</span>
          </p>
          <ol ref={years} className="mt-4 flex gap-1.5" aria-label="Revenue by year">
            {GROWTH.map((g) => (
              <li key={g.year} className="group flex-1 text-[0.6875rem] text-muted transition-colors data-[done]:text-body data-[on]:font-medium data-[on]:text-foreground">
                <span className="mb-1.5 block h-1 rounded-full bg-border transition-colors duration-500 group-data-[done]:bg-brand-green/50 group-data-[on]:bg-(image:--brand-gradient)" />
                {g.year}
                <span className="sr-only"> {crore(g.revenue)}</span>
              </li>
            ))}
          </ol>
          </div>

          {/* two beats in one place: the profit, then what is ahead */}
          <div className="gr-beats mt-7 grid [&>*]:col-start-1 [&>*]:row-start-1">
            <div className="gr-profit opacity-0">
              <p className="flex items-center gap-2 text-sm text-foreground">
                <span className="size-2.5 rounded-sm bg-[#ffb81f] shadow-[0_0_10px_#ffb81f]" />
                The gold inside each column is that year’s profit.
              </p>
              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4 max-md:hidden">
                <Stat value={crore(FY26.operatingEbitda)} label="Operating EBITDA, up 117%" />
                <Stat value={`${FY26.roe}%`} label="Return on equity" />
                <Stat value={`${FY26.debtToEquity}x`} label="Debt to equity" />
              </dl>
            </div>
            <div className="gr-ahead opacity-0">
              <p className="text-2xl leading-snug font-light text-foreground md:text-3xl">
                {crore(ORDER_BOOK.cr)} already won. <Glow>{crore(REVENUE_TARGET)}</Glow> is the goal, in under five years.
              </p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-body">
                The blue column is the order book: work signed and still to deliver. The gold one is the revenue Waaree has set out to reach. FY27 operating EBITDA is guided at {FY26.fy27EbitdaGuidance}.
              </p>
            </div>
          </div>
        </div>

        <p className="pointer-events-none absolute right-6 bottom-6 max-w-xs text-right text-[0.6875rem] leading-snug text-muted md:right-[7vw]">
          <span className="mb-1 hidden items-center justify-end gap-1.5 md:flex">
            <Hand aria-hidden className="size-3.5" /> Drag to turn it
          </span>
          Revenue from operations and profit after tax, consolidated, to scale. Source: {FY26_SOURCE} (target: p. 42–43).
        </p>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-lg font-medium text-foreground tabular-nums">{value}</dt>
      <dd className="mt-0.5 text-xs leading-snug text-muted">{label}</dd>
    </div>
  );
}
