"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, Hand, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { chapterNumber } from "../chapters";
import { STAGES, stageAt } from "../data/journey";
import { BRIDGE_BOX, BRIDGE_SRC } from "../three/bridge";
import { journey } from "../story-state";
import { Glow } from "./Chapter";
import { HANDOFF_SECTION, HANDOFF_STAGE, HANDOFF_STYLE, showWhenPinned } from "./handoff";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const JourneyScene = dynamic(() => import("../three/JourneyScene"), {
  ssr: false,
});

/**
 * How it’s made: a pinned chapter where one cloud of points becomes, in turn, every link
 * Waaree makes, from sand to green hydrogen. It overlaps the last screen of Inside the panel and
 * opens on its panel at the hand-off frame, which turns to points and crumbles to sand; it ends
 * with the points gathering back into it, the panel the Factories map opens on. The stepper and
 * the stage text follow the flow.
 */
export function Journey() {
  const root = useRef<HTMLElement>(null);
  const stageEl = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const drag = useRef<number | null>(null);
  const [stage, setStage] = useState(0);

  useGSAP(
    () => {
      journey.progress = 0;
      journey.in = 1;
      journey.out = 0;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      showWhenPinned(root.current!, stageEl.current!);
      // the entry, with no scrub lag: it opens on the panel exactly where Inside the panel left it
      // (the same frame), which turns to points; the camera comes down, the copy arrives
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "top -45%", scrub: true } })
        .fromTo(journey, { in: 1 }, { in: 0, duration: 1, ease: "none", immediateRender: false }, 0)
        .fromTo(".jo-bridge-in", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "none", immediateRender: false }, 0)
        .fromTo(".jo-in", { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "none" }, 0.65);
      let shown = 0;
      // follow the smoothed value (the tween), not the raw scroll, so text and shape agree
      gsap.to(journey, {
        progress: 1,
        ease: "none",
        onUpdate: () => {
          const [a, b, t] = stageAt(journey.progress);
          // stage −1 at the end is the outro (the module again), shown as STAGES.length
          const s = b === -1 ? (t < 0.5 ? a : STAGES.length) : Math.max(0, t < 0.5 ? a : b);
          if (s !== shown) setStage((shown = s));
          if (fill.current) fill.current.style.transform = `scaleY(${b === -1 ? 1 : Math.max(0, a + t) / (STAGES.length - 1)})`;
        },
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.7 },
      });
      // the exit, with no scrub lag: the copy steps aside, the module rises to the hand-off frame and
      // becomes the real panel the India map opens on (Factories overlaps this last screen)
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: "bottom 150%", end: "bottom bottom", scrub: true } })
        .fromTo(journey, { out: 0 }, { out: 1, duration: 1, ease: "none", immediateRender: false }, 0)
        .fromTo(".jo-copy", { opacity: 1 }, { opacity: 0, duration: 0.35, ease: "none", immediateRender: false }, 0)
        .fromTo(".jo-bridge", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "none", immediateRender: false }, 0.75);
    },
    { scope: root },
  );

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = e.clientX;
    journey.dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current === null) return;
    journey.spin = (e.clientX - drag.current) * 0.005;
    drag.current = e.clientX;
  };
  const endDrag = () => {
    drag.current = null;
    journey.dragging = false;
  };

  const s = STAGES[stage];
  return (
    <section ref={root} id="journey" data-chapter="journey" data-tone="light" aria-labelledby="journey-title" className={cn("h-[840svh]", HANDOFF_SECTION)} style={HANDOFF_STYLE}>
      <div
        ref={stageEl}
        className={cn("sticky top-0 h-svh touch-pan-y overflow-hidden bg-white select-none md:cursor-grab md:active:cursor-grabbing", HANDOFF_STAGE)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        data-cursor="Drag"
      >
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_68%_55%,rgb(40_169_226/0.07),transparent_70%)]" />
        <JourneyScene />
        {/* eslint-disable-next-line @next/next/no-img-element -- a plain, preloaded frame; it must not be resized or lazy */}
        <img aria-hidden alt="" src={BRIDGE_SRC} decoding="async" className={cn("jo-bridge pointer-events-none opacity-0", BRIDGE_BOX)} />
        {/* eslint-disable-next-line @next/next/no-img-element -- the same frame, for the way in */}
        <img aria-hidden alt="" src={BRIDGE_SRC} decoding="async" className={cn("jo-bridge-in pointer-events-none", BRIDGE_BOX)} />

        <div className="jo-in pointer-events-none absolute inset-0">
          <div className="jo-copy pointer-events-none absolute inset-x-0 top-[11svh] px-6 md:top-0 md:bottom-0 md:flex md:max-w-[34rem] md:flex-col md:justify-center md:pl-[7vw]">
            <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
              <span className="text-muted tabular-nums">{chapterNumber("journey")}</span>
              <span aria-hidden className="h-px w-6 bg-border-strong" />
              How it’s made
            </p>
            <h2 id="journey-title" data-split className="mt-4 text-4xl leading-[1.08] font-light tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
              Every panel <Glow>begins as sand.</Glow>
            </h2>

            <div className="mt-6 flex gap-6 md:mt-10">
              {/* stepper */}
              <ol className="relative hidden flex-col gap-2.5 md:flex" aria-label="Stages">
                <span aria-hidden className="absolute top-1 bottom-1 left-[3px] w-px bg-border" />
                <span ref={fill} aria-hidden className="absolute top-1 bottom-1 left-[3px] w-px origin-top scale-y-0 bg-(image:--brand-gradient)" />
                {STAGES.map((st, k) => (
                  <li key={st.name} className={cn("relative flex items-center gap-3 pl-0 text-xs transition-colors duration-300", k === stage ? "font-medium text-foreground" : k < stage ? "text-body" : "text-muted")}>
                    <span className={cn("relative size-[7px] rounded-full transition-all duration-300", k <= stage ? "bg-brand-green" : "bg-border-strong", k === stage && "scale-150 shadow-[0_0_0_4px_rgb(13_176_43/0.15)]")} />
                    {st.name}
                  </li>
                ))}
              </ol>

              {/* the stage */}
              <div key={stage} className="max-w-sm animate-rise-in" aria-live="polite">
                {s ? (
                  <>
                    <p className="text-xs text-muted tabular-nums">
                      {String(stage + 1).padStart(2, "0")} / {STAGES.length}
                    </p>
                    <p className="mt-1 text-3xl font-light tracking-tight text-foreground md:text-4xl">{s.name}</p>
                    <p className="mt-3 text-base leading-relaxed text-body">{s.line}</p>
                    <p className="mt-3 flex items-start gap-1.5 text-sm font-medium text-primary-strong">
                      <MapPin aria-hidden className="mt-0.5 size-3.5 shrink-0" /> {s.where}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted">Back to the panel</p>
                    <p className="mt-1 text-3xl font-light tracking-tight text-foreground md:text-4xl">Every step has a home.</p>
                    <p className="mt-3 text-base leading-relaxed text-body">Most of these steps happen in Waaree’s own plants, running or being built, in India and the US. Here they are.</p>
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary-strong">
                      <ArrowDown aria-hidden className="size-3.5 motion-safe:animate-bounce" /> Where it’s made
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <p className="jo-copy pointer-events-none absolute right-6 bottom-6 hidden items-center gap-1.5 text-xs text-muted md:right-[7vw] md:flex">
            <Hand aria-hidden className="size-3.5" /> Drag to turn it
          </p>
        </div>
      </div>
    </section>
  );
}
