"use client";

import type { Facility } from "../data/facilities";
import type { TwinMode } from "../data/twin";
import { BuildStage } from "./BuildStage";

/** “Build status” on a site page: the plant as a living blueprint, built to where it stands today. */
export function FactoryTwin({ f, mode }: { f: Facility; mode: TwinMode }) {
  const building = mode === "construction";
  return (
    <section className="px-6 pb-20 md:px-[7vw] md:pb-28">
      <div className="mb-8">
        <p className="text-xs tracking-[0.2em] text-primary uppercase">Build status</p>
        <p className="mt-3 text-3xl leading-tight font-light text-foreground sm:text-4xl">{building ? `${f.short}, rising.` : `${f.short}, at work.`}</p>
        <p className="mt-2 text-sm text-body">A living blueprint: watch it go from plan to {building ? "today’s stage" : "a running line"}, or scrub the timeline yourself.</p>
      </div>
      <BuildStage f={f} mode={mode} />
    </section>
  );
}
