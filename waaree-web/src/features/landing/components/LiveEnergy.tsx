"use client";

import { Zap } from "lucide-react";
import { useEffect, useRef } from "react";

import { LIVE_ENERGY } from "../data/annual-report";

const fmt = (v: number) => Math.floor(v).toLocaleString("en-IN");

/**
 * “Since you arrived…”: energy the modules Waaree made in FY26 have generated while this page is
 * open (an estimate, explained on hover). Updates the DOM directly, no re-renders; the two numbers
 * sit in their own columns, so nothing shifts as digits are added.
 */
export function LiveEnergy({ className }: { className?: string }) {
  const kwh = useRef<HTMLSpanElement>(null);
  const homes = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const start = performance.now();
    // a calm count: four updates a second, not every frame
    const tick = () => {
      const e = ((performance.now() - start) / 1000) * LIVE_ENERGY.kwhPerSecond;
      if (kwh.current) kwh.current.textContent = fmt(e);
      if (homes.current) homes.current.textContent = fmt(e / LIVE_ENERGY.homeMonthKwh);
    };
    const t = window.setInterval(tick, 250);
    return () => window.clearInterval(t);
  }, []);

  return (
    <p
      className={className}
      title={`Estimate: the ${LIVE_ENERGY.gw} GW of modules Waaree made in FY26, at a ${LIVE_ENERGY.capacityFactor * 100}% average solar capacity factor (about ${Math.round(LIVE_ENERGY.kwhPerSecond)} kWh every second). A home month is 100 kWh.`}
    >
      <span className="flex items-center gap-2">
        <span className="relative inline-flex size-2">
          <span className="absolute inset-0 rounded-full bg-brand-green motion-safe:animate-ping" />
          <span className="relative inline-flex size-2 rounded-full bg-brand-green" />
        </span>
        Since you arrived, panels Waaree made last year generated
      </span>
      {/* two numbers in their own columns: they count up without moving any words */}
      <span className="mt-2 grid max-w-sm grid-cols-2 gap-4">
        <span className="flex flex-col">
          <span className="flex items-center gap-1 text-lg font-medium text-foreground tabular-nums">
            <Zap aria-hidden className="size-4 text-brand-green" />
            <span ref={kwh}>0</span> kWh
          </span>
          <span className="text-xs text-muted">of clean power</span>
        </span>
        <span className="flex flex-col">
          <span ref={homes} className="text-lg font-medium text-foreground tabular-nums">
            0
          </span>
          <span className="text-xs text-muted">homes powered for a month</span>
        </span>
      </span>
    </p>
  );
}
