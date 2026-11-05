"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MousePointer2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef } from "react";

import { cn } from "@/lib/utils/cn";

import { chapterNumber } from "../chapters";
import { FY26 } from "../data/annual-report";
import { anatomy } from "../story-state";
import { Glow } from "./Chapter";
import { HANDOFF_SECTION, HANDOFF_STAGE, HANDOFF_STYLE, showWhenPinned } from "./handoff";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PanelScene = dynamic(() => import("../three/PanelScene"), { ssr: false });

/** Labels pinned to the 3D layers (numbered while the module is apart, lettered inside the cell). */
const LABELS: { key: string; n: string; title: string; text: string; left?: boolean }[] = [
  { key: "glass", n: "1", title: "Tempered glass", text: "Anti-reflective, built for decades of hail and heat", left: true },
  { key: "evaTop", n: "2", title: "EVA encapsulant", text: "Seals the cells away from air and moisture", left: true },
  { key: "cells", n: "3", title: "TOPCon solar cells", text: "N-type silicon, half-cut to cut resistive losses", left: true },
  { key: "evaBottom", n: "4", title: "EVA encapsulant", text: "A second seal below the cells", left: true },
  { key: "frame", n: "5", title: "Aluminium frame", text: "Stiffens the module and mounts it", left: true },
  { key: "back", n: "6", title: "Backsheet", text: "Insulates and protects from behind", left: true },
  { key: "jbox", n: "7", title: "Junction box", text: "Bypass diodes keep power flowing in partial shade" },
  { key: "photon", n: "a", title: "Sunlight", text: "Each photon carries a little energy in" },
  { key: "silicon", n: "b", title: "N-type silicon", text: "Light knocks an electron loose here", left: true },
  { key: "oxide", n: "c", title: "Tunnel oxide, ~1.5 nm", text: "Electrons pass through; losses don’t" },
  { key: "rear", n: "d", title: "Rear contact", text: "Electrons leave as current", left: true },
];

/**
 * Inside the panel: a pinned 3D chapter. A studio-lit TOPCon module parts into its seven layers,
 * then the camera dives into one cell to watch sunlight become current, and pulls back as light
 * ripples across all 144 cells. One scroll timeline drives the scene (anatomy.progress) and the copy.
 */
export function InsideThePanel() {
  const root = useRef<HTMLElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      anatomy.progress = 0;
      anatomy.out = 0;      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      showWhenPinned(root.current!, stage.current!);
      // the last stretch settles the camera on the hand-off frame, with no scrub lag
      gsap.fromTo(anatomy, { out: 0 }, { out: 1, ease: "none", immediateRender: false, scrollTrigger: { trigger: root.current, start: "bottom 140%", end: "bottom bottom", scrub: true } });
      gsap
        .timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: reduced ? true : 1.1 },
        })
        .to(anatomy, { progress: 1, duration: 10, ease: "none" }, 0)
        // the words arrive once the panel has turned to us (no text over the hand-off)
        .fromTo(".ip-intro", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, 1.2)
        .to(".ip-intro", { opacity: 0, y: -30, duration: 0.5 }, 2.2)
        .fromTo(".ip-apart", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, 2.6)
        .to(".ip-apart", { opacity: 0, duration: 0.4 }, 4.1)
        .fromTo(".ip-dive", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 }, 6.5)
        .to(".ip-dive", { opacity: 0, y: -20, duration: 0.4 }, 8.3)
        .fromTo(".ip-final", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 }, 8.7)
        .to(".ip-final", { opacity: 0, y: -20, duration: 0.35 }, 9.45)
        .fromTo(".ip-next", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 9.6);
    },
    { scope: root },
  );

  const onPointerMove = (e: React.PointerEvent) => {
    anatomy.px = (e.clientX / window.innerWidth - 0.5) * 2;
    anatomy.py = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  return (
    <section ref={root} id="inside" data-chapter="inside" data-tone="light" aria-labelledby="inside-title" className={cn("h-[600svh]", HANDOFF_SECTION)} style={HANDOFF_STYLE}>
      <div ref={stage} className={cn("sticky top-0 h-svh overflow-hidden bg-white", HANDOFF_STAGE)} onPointerMove={onPointerMove}>
        <PanelScene labels={labels} />

        {/* Labels pinned to the 3D layers */}
        <div ref={labels} aria-hidden className="pointer-events-none absolute inset-0">
          {LABELS.map((l) => (
            <div key={l.key} data-anchor={l.key} className="absolute top-0 left-0 opacity-0 will-change-transform">
              <div className={cn("flex -translate-y-1/2 items-center", l.left ? "-translate-x-full flex-row-reverse" : "")}>
                <span className="relative -mx-[5px] size-2.5 shrink-0 rounded-full bg-brand-green ring-4 ring-brand-green/20" />
                <span className="h-px w-14 bg-foreground/30 max-md:hidden" />
                <span className="flex max-w-[15rem] items-start gap-2.5 rounded-md max-md:hidden border border-white/70 bg-white/80 px-3 py-2 shadow-[0_10px_30px_-14px_rgb(5_12_24/0.35)] backdrop-blur-md">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-(image:--brand-gradient) text-[0.625rem] font-semibold text-white uppercase">{l.n}</span>
                  <span>
                    <span className="block text-[0.8125rem] leading-tight font-medium text-foreground">{l.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-body max-md:hidden">{l.text}</span>
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 1 · Intro */}
        <div className="ip-intro pointer-events-none absolute inset-x-0 top-[12svh] px-6 md:top-0 md:bottom-0 md:flex md:max-w-[38rem] md:flex-col md:justify-center md:pl-[7vw]">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
            <span className="text-muted tabular-nums">{chapterNumber("inside")}</span>
            <span aria-hidden className="h-px w-6 bg-border-strong" />
            Inside the panel
          </p>
          <h2 id="inside-title" data-split className="mt-4 text-4xl leading-[1.08] font-light tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            Seven layers. One job: <Glow>catch the sun.</Glow>
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-body">
            A Waaree TOPCon module, under real glass. Keep scrolling to take it apart, then go inside one of its 144 cells.
          </p>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted max-md:hidden">
            <MousePointer2 aria-hidden className="size-4" /> Move your cursor to tilt the light
          </p>
        </div>

        {/* 2 · Apart */}
        <div className="ip-apart pointer-events-none absolute bottom-[9svh] left-6 max-w-sm opacity-0 max-md:right-4 max-md:left-4 max-md:rounded-2xl max-md:bg-white/80 max-md:px-5 max-md:py-4 max-md:backdrop-blur-md md:left-[7vw]">
          <p className="text-xs font-medium tracking-[0.25em] text-primary uppercase">Pulled apart</p>
          <p className="mt-2 text-2xl leading-snug font-light text-foreground md:text-3xl">Every layer earns its place for decades of sun.</p>
        </div>

        {/* 3 · Inside one cell */}
        <div className="ip-dive pointer-events-none absolute inset-x-0 bottom-[7svh] px-6 opacity-0 max-md:mx-4 max-md:rounded-2xl max-md:bg-white/80 max-md:px-5 max-md:py-5 max-md:shadow-[0_20px_50px_-30px_rgb(5_30_60/0.5)] max-md:backdrop-blur-md md:bottom-auto md:top-[16svh] md:max-w-md md:pl-[7vw]">
          <p className="text-xs font-medium tracking-[0.25em] text-primary uppercase">Inside one cell · cut open</p>
          <p className="mt-2 text-2xl leading-snug font-light text-foreground md:text-4xl">This is where light becomes current.</p>
          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <Legend className="bg-[#ffc94d]">Photon</Legend>
            <Legend className="bg-[#33e6ff]">Electron</Legend>
            <Legend className="bg-[#ff5fb4]">Hole</Legend>
          </p>
        </div>

        <p className="ip-next pointer-events-none absolute inset-x-0 bottom-[10svh] text-center max-md:top-[14svh] max-md:bottom-auto text-sm font-medium tracking-[0.2em] text-foreground/75 uppercase opacity-0">
          Rewind ↓
        </p>

        {/* 4 · All 144 light up */}
        <div className="ip-final absolute inset-x-0 bottom-[6svh] px-6 opacity-0 max-md:mx-4 max-md:rounded-2xl max-md:bg-white/80 max-md:px-5 max-md:py-5 max-md:shadow-[0_20px_50px_-30px_rgb(5_30_60/0.5)] max-md:backdrop-blur-md md:bottom-auto md:top-1/2 md:max-w-[30rem] md:-translate-y-1/2 md:pl-[7vw]">
          <p className="text-xs font-medium tracking-[0.25em] text-primary uppercase">Times 144 cells</p>
          <p className="mt-2 text-4xl leading-tight font-light tracking-tight text-foreground md:text-6xl">
            Up to <Glow>{FY26.maxModuleWatts} W</Glow> from one module.
          </p>
          <p className="mt-3 text-base leading-relaxed text-body">
            TOPCon’s tunnel oxide is why Waaree’s modules reach up to {FY26.topconEfficiency}% efficiency.
          </p>
        </div>
      </div>
    </section>
  );
}

function Legend({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full shadow-[0_0_8px_currentColor]", className)} />
      {children}
    </span>
  );
}
