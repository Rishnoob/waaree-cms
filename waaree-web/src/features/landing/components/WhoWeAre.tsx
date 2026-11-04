"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown } from "lucide-react";
import { useRef } from "react";

import { chapterNumber } from "../chapters";
import { FIRSTS } from "../data/compare";
import { HERO } from "../data/home";
import { Glow } from "./Chapter";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const format = (v: number, d: number) => v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

// the dial: 270° of ticks, like the gauges Waaree started with
const R = 46;
const SWEEP = 270;
const TICKS = Array.from({ length: 55 }, (_, i) => -SWEEP / 2 + (i * SWEEP) / 54);
// rounded, so the server and the browser print the same markup (trig differs in the last digits)
const round = (v: number) => Math.round(v * 1000) / 1000;
const polar = (deg: number, r: number) => [round(50 + r * Math.sin((deg * Math.PI) / 180)), round(50 - r * Math.cos((deg * Math.PI) / 180))] as const;
const ARC = round((SWEEP / 360) * 2 * Math.PI * R);
const [ax, ay] = polar(-SWEEP / 2, R);
const [bx, by] = polar(SWEEP / 2, R);

/**
 * Who we are (closes Act I), as one pinned scene over a giant gauge dial (Waaree began making gauges
 * in 1990): who Waaree is in one line, then four numbers take the screen one at a time, counting up
 * as the dial fills and the needle sweeps, the firsts drifting by below; it ends on “But how did we
 * get here?”, which Our story answers.
 */
export function WhoWeAre() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const nums = gsap.utils.toArray<HTMLElement>(".ww-num");
      const tl = gsap.timeline({ defaults: { ease: "power2.out" }, scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.6 } });
      // the dial fills and the needle sweeps across the four numbers
      tl.fromTo(".ww-arc", { strokeDashoffset: ARC }, { strokeDashoffset: 0, duration: 8, ease: "none" }, 1.5)
        .fromTo(".ww-needle", { rotation: -SWEEP / 2 }, { rotation: SWEEP / 2, duration: 8, ease: "none", svgOrigin: "50 50" }, 1.5)
        // 0 · who
        .to(".ww-b0", { opacity: 0, y: -40, filter: "blur(8px)", duration: 0.8 }, 1)
        .fromTo(".ww-ticker", { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.6)
        .to(".ww-ticker", { opacity: 0, duration: 0.6 }, 9.6);
      // 1–4 · one number at a time, counting up
      nums.forEach((el, i) => {
        const beat = `.ww-b${i + 1}`;
        const at = 1.6 + i * 2;
        const v = { n: 0 };
        const d = Number(el.dataset.decimals);
        tl.fromTo(beat, { opacity: 0, y: 50, scale: 0.92, filter: "blur(10px)" }, { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.7 }, at)
          .fromTo(v, { n: 0 }, { n: Number(el.dataset.value), duration: 1.1, ease: "power3.out", onUpdate: () => void (el.textContent = format(v.n, d)) }, at)
          .to(beat, { opacity: 0, y: -50, scale: 1.04, filter: "blur(10px)", duration: 0.6, ease: "power2.in" }, at + 1.5);
      });
      // 5 · the question, which Our story answers
      tl.to(".ww-dial", { opacity: 0.25, scale: 1.15, duration: 1 }, 9.6)
        .fromTo(".ww-b5", { opacity: 0, y: 40, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.8 }, 9.9)
        .to({}, { duration: 1 }, 10.7);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="who-we-are" data-chapter="who-we-are" data-tone="light" aria-labelledby="who-title" className="relative h-[520svh] bg-white">
      <div className="sticky top-0 h-svh overflow-hidden bg-[radial-gradient(60%_60%_at_50%_50%,#eef8f2_0%,#ffffff_70%)]">
        {/* the gauge */}
        <svg aria-hidden viewBox="0 0 100 100" className="ww-dial absolute top-1/2 left-1/2 size-[min(88svh,96vw)] -translate-x-1/2 -translate-y-1/2">
          <defs>
            <linearGradient id="ww-g" x1="0" x2="1" y1="1" y2="0">
              <stop offset="0" stopColor="#0db02b" />
              <stop offset="1" stopColor="#28a9e2" />
            </linearGradient>
          </defs>
          {TICKS.map((deg, i) => {
            const major = i % 9 === 0;
            const [x1, y1] = polar(deg, major ? 40.5 : 42);
            const [x2, y2] = polar(deg, 43.5);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={major ? "rgb(5 30 20 / 0.28)" : "rgb(5 30 20 / 0.12)"} strokeWidth={major ? 0.35 : 0.2} />;
          })}
          <path d={`M ${ax} ${ay} A ${R} ${R} 0 1 1 ${bx} ${by}`} fill="none" stroke="rgb(13 176 43 / 0.08)" strokeWidth="0.7" strokeLinecap="round" />
          <path className="ww-arc" d={`M ${ax} ${ay} A ${R} ${R} 0 1 1 ${bx} ${by}`} fill="none" stroke="url(#ww-g)" strokeWidth="0.7" strokeLinecap="round" strokeDasharray={ARC} strokeDashoffset={ARC} style={{ filter: "drop-shadow(0 0 1.2px rgb(13 176 43 / 0.7))" }} />
          <g className="ww-needle" transform={`rotate(${-SWEEP / 2} 50 50)`}>
            <line x1="50" y1="50" x2="50" y2="9" stroke="url(#ww-g)" strokeWidth="0.35" strokeLinecap="round" opacity="0.5" />
            <circle cx="50" cy="8.6" r="0.9" fill="#28a9e2" style={{ filter: "drop-shadow(0 0 1.5px #28a9e2)" }} />
          </g>
        </svg>

        {/* 0 · who */}
        <div className="ww-b0 absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
            <span className="text-muted tabular-nums">{chapterNumber("who-we-are")}</span>
            <span aria-hidden className="h-px w-6 bg-border-strong" />
            Who we are
          </p>
          <h2 id="who-title" data-split className="mt-5 max-w-4xl text-4xl leading-[1.06] font-light tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            Started with gauges in 1990. <Glow>Now powering India’s switch to solar.</Glow>
          </h2>
        </div>

        {/* 1–4 · the numbers, one at a time */}
        <dl>
          {HERO.stats.map((s, i) => (
            <div key={s.label} className={`ww-b${i + 1} absolute inset-0 flex flex-col items-center justify-center px-6 text-center opacity-0`}>
              <dd className="flex items-baseline leading-none font-extralight tracking-tight tabular-nums">
                <span className="ww-num bg-(image:--brand-gradient) bg-clip-text text-[clamp(4.5rem,15vw,12rem)] text-transparent" data-value={s.value} data-decimals={s.decimals}>
                  {format(s.value, s.decimals)}
                </span>
                <span className="ml-2 text-3xl text-foreground md:text-5xl">{s.unit}</span>
              </dd>
              <dt className="mt-5 max-w-xs text-base text-body md:text-lg">{s.label}</dt>
            </div>
          ))}
        </dl>

        {/* the firsts, drifting by along the bottom */}
        <div className="ww-ticker group absolute inset-x-0 bottom-[6svh] overflow-hidden opacity-0 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          <div className="wr-marquee flex w-max gap-4 group-hover:[animation-play-state:paused]">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1 || undefined} aria-label={copy === 0 ? "Firsts no other Indian maker holds" : undefined} className="flex">
                {FIRSTS.map((f) => (
                  <li key={f.title} title={f.text} className="flex shrink-0 items-baseline gap-2 px-6 whitespace-nowrap">
                    <span className="bg-(image:--brand-gradient) bg-clip-text text-xl font-light text-transparent">{f.big}</span>
                    <span className="text-sm text-body">{f.title}</span>
                    <span aria-hidden className="ml-4 size-1 self-center rounded-full bg-brand-green/40" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* 5 · the question */}
        <div className="ww-b5 absolute inset-0 flex flex-col items-center justify-center px-6 text-center opacity-0">
          <p className="text-4xl leading-[1.08] font-light tracking-tight text-foreground sm:text-5xl lg:text-7xl">
            But how did we <Glow>get here?</Glow>
          </p>
          <p className="mt-8 flex items-center gap-2 text-xs font-medium tracking-[0.25em] text-primary uppercase">
            Our story, from 1985 <ArrowDown aria-hidden className="size-3.5 motion-safe:animate-bounce" />
          </p>
        </div>

        <p className="pointer-events-none absolute right-6 bottom-2 text-[0.625rem] text-muted md:right-[7vw]">Waaree’s Integrated Annual Report FY2025-26 and JMK Research.</p>
      </div>
    </section>
  );
}
