"use client";

import { gsap } from "gsap";
import { Hand, RotateCcw } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

import type { Facility } from "../data/facilities";
import { buildToday, PHASES, phaseAt, type TwinMode } from "../data/twin";

const FactoryScene = dynamic(() => import("../three/FactoryScene"), { ssr: false });

/**
 * A site’s build, as a living blueprint you can scrub: it plays from the plan to where the site
 * stands today when it comes into view. Drag the timeline to see earlier stages, or (for a site
 * still being built) a preview of what is coming.
 */
export function BuildStage({ f, mode, className }: { f: Facility; mode: TwinMode; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const progress = useRef(0); // read by the scene every frame
  const today = buildToday(f);
  const [value, setValue] = useState(0);
  const tween = useRef<gsap.core.Tween | null>(null);

  const play = () => {
    tween.current?.kill();
    progress.current = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tween.current = gsap.to(progress, {
      current: today,
      duration: reduced ? 0 : 3.2 + today * 2.4,
      ease: "power1.inOut",
      onUpdate: () => setValue(progress.current),
    });
  };

  // build to today the first time it comes into view
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          play();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    if (wrap.current) io.observe(wrap.current);
    return () => {
      io.disconnect();
      tween.current?.kill();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onScrub = (v: number) => {
    tween.current?.kill();
    progress.current = v;
    setValue(v);
  };

  const ahead = value > today + 0.01;
  return (
    <div ref={wrap} className={cn("overflow-hidden rounded-2xl border border-[#cfe3f3] bg-[#f3f9fd]", className)}>
      <div
        data-cursor="Drag"
        className="relative h-[58svh] min-h-[22rem] cursor-grab active:cursor-grabbing [background-image:linear-gradient(rgb(43_143_224/0.08)_1px,transparent_1px),linear-gradient(90deg,rgb(43_143_224/0.08)_1px,transparent_1px)] [background-size:28px_28px]"
      >
        <FactoryScene mode={mode} progress={progress} />
        <p className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-full border border-[#cfe3f3] bg-white/85 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur">
          <span className={cn("size-2 rounded-full", today < 1 ? "animate-pulse bg-[#f0a020]" : "bg-brand-green")} />
          {ahead ? "Preview: " : value >= today - 0.01 ? "Today: " : "Earlier: "}
          {phaseAt(value)}
        </p>
        <p className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-1.5 text-[0.6875rem] text-muted">
          <Hand aria-hidden className="size-3.5" /> Drag to look around · illustrative model
        </p>
      </div>

      {/* the timeline */}
      <div className="flex items-center gap-4 border-t border-[#cfe3f3] bg-white px-4 py-4 md:px-6">
        <button
          type="button"
          onClick={play}
          aria-label="Replay the build"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-primary-strong transition-colors hover:bg-brand-green/5 focus-visible:shadow-glow focus-visible:outline-none"
        >
          <RotateCcw aria-hidden className="size-4" />
        </button>
        <div className="relative flex-1">
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={value}
            onChange={(e) => onScrub(Number(e.target.value))}
            aria-label={`Build timeline for ${f.short}`}
            aria-valuetext={phaseAt(value)}
            className="w-full accent-[#0a9a2a]"
          />
          <div className="relative mt-1 h-8 text-[0.625rem] text-muted">
            {PHASES.map((ph) => (
              <span key={ph.name} className="absolute -translate-x-1/2 whitespace-nowrap max-sm:hidden" style={{ left: `${Math.min(97, Math.max(3, ph.at * 100))}%` }}>
                {ph.name}
              </span>
            ))}
            <span
              className="absolute top-4 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[0.625rem] font-semibold whitespace-nowrap text-white"
              style={{ left: `${Math.min(95, Math.max(5, today * 100))}%` }}
            >
              {today < 1 ? "Today" : "Live today"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
