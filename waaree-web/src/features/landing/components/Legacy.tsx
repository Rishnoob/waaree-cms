"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles } from "lucide-react";
import { useRef } from "react";

import { chapterNumber } from "../chapters";
import { capacityAt, CHIPS, END_YEAR, formatCapacity, knownCapacityAt, MILESTONES, SCENE_CAPTIONS, START_YEAR } from "../data/story";
import { SceneCover } from "../illustrations/iso";
import { LEGACY_SCENES } from "../illustrations/scenes";
import { legacy } from "../story-state";
import { Glow } from "./Chapter";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const N = MILESTONES.length;
const INTRO = 0.03; // scroll share for the chapter title before the first year
const HOLD = 0.5; // share of each year that holds still before the jump to the next
const SOLAR = 2007;

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
/** How “old film” a year looks: full before 1990, gone by the first solar line. */
const ageOf = (year: number) => clamp((SOLAR - year) / 17);

// the capacity graph along the bottom: years across, capacity up (eased so the early years show)
const GX = (year: number) => ((year - START_YEAR) / (END_YEAR - START_YEAR)) * 1000;
const GY = (mw: number) => 70 - 62 * Math.pow(Math.max(0, mw) / 25800, 0.42);
const GRAPH = (() => {
  const pts: string[] = [];
  for (let y = START_YEAR; y <= END_YEAR + 1e-6; y += 0.1) pts.push(`${GX(y).toFixed(1)},${GY(capacityAt(y)).toFixed(1)}`);
  return `M${pts.join(" L")}`;
})();
const TICKS = MILESTONES.map((m) => GX(m.at));

/** Film grain, drawn once as an SVG noise tile. */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.25 0 0 0 0 0.15 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/**
 * Our story, as a time machine. Each year fills the screen with its illustration (illustrations/
 * scenes: sharp and whole on the right, the same scene soft and wide behind), graded by its era:
 * warm, grainy old film before solar, crisp and bright after. One huge year on the left counts
 * through the years between milestones as the camera jumps forward (the shot zooms past, light
 * streaks by, the next settles in). Its story sits under the year; a glowing capacity graph runs
 * along the bottom. Everything is written straight to the DOM from the scroll; only the shot on
 * screen and the next are drawn.
 */
export function Legacy() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      legacy.progress = 0;
      const el = root.current!;
      const shots = Array.from(el.querySelectorAll<HTMLElement>("[data-shot]"));
      const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-card]"));
      const big = el.querySelector<HTMLElement>("[data-big]")!;
      const bigWrap = el.querySelector<HTMLElement>("[data-bigwrap]")!;
      const streaks = el.querySelector<HTMLElement>("[data-streaks]")!;
      const grain = el.querySelector<HTMLElement>("[data-grain]")!;
      const fill = el.querySelector<SVGRectElement>("[data-fill]")!;
      const head = el.querySelector<SVGCircleElement>("[data-head]")!;
      const capEl = el.querySelector<HTMLElement>("[data-cap]")!;
      const set = (n: HTMLElement | SVGElement, prop: string, v: string) => {
        const s = n.style as unknown as Record<string, string>;
        if (s[prop] !== v) s[prop] = v;
      };
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const update = () => {
        const p = legacy.progress;
        const u = clamp((p - INTRO) / (1 - INTRO)) * (N - 1);
        const i = Math.min(N - 1, Math.floor(u));
        const f = u - i;
        const w = i < N - 1 ? smooth((f - HOLD) / (1 - HOLD)) : 0; // the jump to the next year
        const intro = 1 - smooth(p / INTRO);
        const year = i < N - 1 ? MILESTONES[i]!.at + (MILESTONES[i + 1]!.at - MILESTONES[i]!.at) * w : MILESTONES[i]!.at;

        shots.forEach((s, k) => {
          const on = k === i || (k === i + 1 && w > 0.001);
          set(s, "display", on ? "block" : "none");
          if (!on) return;
          if (k === i) {
            // the camera pushes in through the year, then rushes past it
            const scale = reduced ? 1 : 1 + 0.06 * clamp(f / HOLD) + 0.45 * w * w;
            set(s, "opacity", (1 - smooth((w - 0.35) / 0.5)).toFixed(3));
            set(s.firstElementChild as HTMLElement, "transform", `scale(${scale.toFixed(4)})`);
          } else {
            // the next year settles in from a little closer
            set(s, "opacity", smooth((w - 0.3) / 0.5).toFixed(3));
            set(s.firstElementChild as HTMLElement, "transform", `scale(${(reduced ? 1 : 1.18 - 0.18 * smooth(w)).toFixed(4)})`);
          }
        });
        // light rushing past at the height of the jump
        const rush = Math.sin(Math.PI * clamp(w));
        set(streaks, "opacity", (rush * 0.9).toFixed(3));
        set(streaks, "transform", `scale(${(1 + w * 0.6).toFixed(3)})`);
        // old film before solar: grain and a warm vignette that fade as the years go by
        set(grain, "opacity", (ageOf(year) * 0.9).toFixed(3));

        // the one year: counts through the years while jumping, rests on the milestone’s label
        const resting = w < 0.12 || w > 0.88;
        const label = resting ? MILESTONES[w > 0.88 ? i + 1 : i]!.year : String(Math.floor(year));
        if (big.textContent !== label) big.textContent = label;
        set(bigWrap, "opacity", (1 - intro).toFixed(3));
        set(bigWrap, "transform", `translateY(${(-rush * 10).toFixed(1)}px)`);

        cards.forEach((c, k) => {
          const o = k === i ? (1 - smooth(w / 0.3)) * (k === 0 ? 1 - intro : 1) : k === i + 1 ? smooth((w - 0.7) / 0.3) : 0;
          set(c, "opacity", o.toFixed(3));
          set(c, "transform", `translateY(${((1 - o) * 16).toFixed(1)}px)`);
        });

        // the graph fills to the year on screen
        fill.setAttribute("width", GX(year).toFixed(1));
        head.setAttribute("cx", GX(year).toFixed(1));
        head.setAttribute("cy", GY(capacityAt(year)).toFixed(1));
        const [ky, mw] = knownCapacityAt(year);
        const cap = mw > 0 ? `${formatCapacity(mw)} · ${Math.floor(ky)}` : "Before solar";
        if (capEl.textContent !== cap) capEl.textContent = cap;
      };
      update();
      gsap.to(legacy, {
        progress: 1,
        ease: "none",
        onUpdate: update,
        scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.8 },
      });
      gsap.fromTo(".lg-intro", { opacity: 1 }, { opacity: 0, y: -24, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "3% top", scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="legacy" data-chapter="legacy" data-tone="light" aria-labelledby="legacy-title" className="relative h-[1100svh] bg-white">
      <div className="sticky top-0 h-svh overflow-hidden bg-white">
        {/* the shots: one full-screen illustration per year, graded by its era */}
        {MILESTONES.map((m, i) => {
          const Art = LEGACY_SCENES[m.year];
          const age = ageOf(m.at);
          const grade = age > 0 ? `sepia(${(age * 0.55).toFixed(2)}) saturate(${(1 - age * 0.25).toFixed(2)}) contrast(${(1 + age * 0.06).toFixed(2)})` : "saturate(1.12) contrast(1.03)";
          return (
            <div key={m.year + i} data-shot aria-hidden className="absolute inset-0 isolate bg-white" style={{ display: i === 0 ? "block" : "none", filter: grade }}>
              {/* the sharp scene, whole, at full height on the right; the camera pushes into it */}
              <div className="absolute inset-y-0 right-0 z-[1] w-full origin-[62%_60%] will-change-transform [mask-image:linear-gradient(90deg,transparent_0%,black_20%,black_94%,transparent_100%)] md:w-[min(64vw,calc(100svh*1.32))]">
                <SceneCover value="contain">{Art ? <Art /> : null}</SceneCover>
              </div>
              {/* the same scene, soft and wide, filling the rest of the screen */}
              <div className="absolute -inset-[8%] scale-110 opacity-70 blur-3xl saturate-150 max-md:hidden">
                <SceneCover value="cover">{Art ? <Art /> : null}</SceneCover>
              </div>
            </div>
          );
        })}

        {/* old film: grain and a warm vignette (fades out as the story reaches solar) */}
        <div aria-hidden data-grain className="pointer-events-none absolute inset-0 mix-blend-multiply" style={{ backgroundImage: GRAIN }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,transparent_45%,rgb(120_80_40/0.35)_100%)]" />
        </div>
        {/* the jump: light rushing past */}
        <div aria-hidden data-streaks className="pointer-events-none absolute inset-0 opacity-0 will-change-transform">
          <div className="absolute inset-0 bg-[repeating-conic-gradient(from_0deg_at_62%_55%,rgb(255_255_255/0)_0deg,rgb(255_255_255/0.85)_0.6deg,rgb(255_255_255/0)_1.6deg,rgb(255_255_255/0)_7deg)] [mask-image:radial-gradient(circle_at_62%_55%,transparent_12%,black_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_55%,rgb(255_255_255/0.9),rgb(214_255_226/0.4)_25%,transparent_55%)]" />
        </div>

        {/* readability: soft light behind the story (left) and the graph (bottom) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgb(255_255_255/0.85)_0%,rgb(255_255_255/0.5)_28%,rgb(255_255_255/0)_46%)] max-md:bg-[linear-gradient(180deg,rgb(255_255_255/0.92)_0%,rgb(255_255_255/0)_50%)]" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[26svh] bg-[linear-gradient(0deg,#ffffff_10%,rgb(255_255_255/0))]" />

        {/* intro */}
        <div className="lg-intro pointer-events-none absolute top-[12svh] left-6 max-w-xl md:left-[7vw]">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
            <span className="text-muted tabular-nums">{chapterNumber("legacy")}</span>
            <span aria-hidden className="h-px w-6 bg-border-strong" />
            Our story
          </p>
          <h2 id="legacy-title" data-split className="mt-4 text-4xl leading-[1.08] font-light tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            From a ₹5,000 loan to <Glow>a nation’s solar backbone.</Glow>
          </h2>
        </div>

        {/* the one year, and the story under it */}
        <div className="pointer-events-none absolute inset-x-6 top-[11svh] md:inset-x-auto md:top-[16svh] md:left-[7vw] md:w-[26rem]">
          <div data-bigwrap className="opacity-0 will-change-transform">
            <p aria-hidden className="text-[0.625rem] font-medium tracking-[0.3em] text-muted uppercase">
              {chapterNumber("legacy")} · Our story
            </p>
            <p
              data-big
              aria-hidden
              className="mt-2 inline-block bg-(image:--brand-gradient) bg-clip-text pr-2 text-[clamp(4rem,8.5vw,8.5rem)] leading-[0.9] font-light tracking-tighter whitespace-nowrap text-transparent tabular-nums [filter:drop-shadow(0_14px_30px_rgb(13_176_43/0.25))]"
            >
              {MILESTONES[0]!.year}
            </p>
          </div>
          <div className="relative mt-6">
            {MILESTONES.map((m, i) => (
              <article key={m.year + i} data-card className="absolute inset-x-0 top-0 opacity-0 will-change-transform">
                {CHIPS[m.year] && (
                  <span className="inline-block rounded-full border border-brand-green/30 bg-white/70 px-2 py-0.5 text-[0.625rem] font-medium tracking-wider text-primary-strong uppercase backdrop-blur">
                    {CHIPS[m.year]}
                  </span>
                )}
                <h3 className="mt-3 text-2xl leading-snug font-light text-foreground md:text-3xl">{m.title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-body md:text-base">{m.text}</p>
                <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                  <Sparkles aria-hidden className="size-3.5 shrink-0 text-primary" /> {SCENE_CAPTIONS[i]}
                </p>
              </article>
            ))}
          </div>
        </div>

        {/* the capacity graph: the whole story at a glance, lit up to the year on screen */}
        <div className="pointer-events-none absolute inset-x-6 bottom-6 md:inset-x-[7vw]">
          <p className="text-right">
            <span className="block text-[0.625rem] tracking-[0.25em] text-muted uppercase">Module capacity · last reported</span>
            <span data-cap className="block bg-(image:--brand-gradient) bg-clip-text text-2xl leading-none font-light text-transparent tabular-nums md:text-3xl">
              Before solar
            </span>
          </p>
          <svg viewBox="0 0 1000 76" preserveAspectRatio="none" className="mt-3 block h-12 w-full overflow-visible md:h-14" aria-hidden>
            <defs>
              <linearGradient id="lg-line" x1="0" x2="1">
                <stop offset="0" stopColor="#0db02b" />
                <stop offset="1" stopColor="#28a9e2" />
              </linearGradient>
              <linearGradient id="lg-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#28a9e2" stopOpacity="0.28" />
                <stop offset="1" stopColor="#0db02b" stopOpacity="0" />
              </linearGradient>
              <clipPath id="lg-clip">
                <rect data-fill x="0" y="-10" width="0" height="100" />
              </clipPath>
            </defs>
            <path d={GRAPH} fill="none" stroke="#d6e6dd" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <g clipPath="url(#lg-clip)">
              <path d={`${GRAPH} L1000,76 L0,76 Z`} fill="url(#lg-area)" />
              <path d={GRAPH} fill="none" stroke="url(#lg-line)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            </g>
            {TICKS.map((x, i) => (
              <line key={i} x1={x} x2={x} y1={72} y2={76} stroke="#9fb9ac" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}
            <circle data-head r="4" cx="0" cy={GY(0)} fill="#0db02b" className="drop-shadow-[0_0_6px_rgb(13_176_43/0.9)]" />
          </svg>
          <p className="mt-1 flex justify-between text-[0.625rem] text-muted tabular-nums">
            <span>{START_YEAR}</span>
            <span>Today</span>
          </p>
        </div>
      </div>
    </section>
  );
}
