"use client";

import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef } from "react";

import { cn } from "@/lib/utils/cn";

import { FACILITIES } from "../data/facilities";
import { BRIDGE_BOX, BRIDGE_SRC } from "../three/bridge";
import { KindIcon, statusLabel } from "./facility-ui";

const IndiaHolo = dynamic(() => import("../three/IndiaHolo"), { ssr: false });

const SITES = FACILITIES.filter((f) => f.country === "India");

// South Gujarat’s sites stand a few km apart: their labels fan out over the sea, joined by leaders.
const FAN: Record<string, [number, number]> = { nandigram: [-120, 34], tumb: [-120, 66], sarodhi: [-120, 98] };

const tone = (f: (typeof SITES)[number]) =>
  f.status === "under-construction" ? { dot: "bg-[#f0a020]", text: "text-[#b86e00]", ring: "ring-[#f0a020]/30" } : f.kind === "office" ? { dot: "bg-[#28a9e2]", text: "text-brand-blue", ring: "ring-[#28a9e2]/30" } : { dot: "bg-brand-green", text: "text-primary-strong", ring: "ring-brand-green/30" };

/**
 * The factories hologram (3D India + status towers) with real links pinned over each tower: hover or
 * focus one for its status card, click to open its page. `active` is shared with the site list.
 */
export function HoloMap({ active, onActive, className }: { active: string | null; onActive: (slug: string | null) => void; className?: string }) {
  const pins = useRef<HTMLDivElement>(null);
  const bridge = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("relative", className)} data-cursor="Explore">
      {/* the stage: a holographic floor grid that melts into the page */}
      <div
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(rgb(13_176_43/0.07)_1px,transparent_1px),linear-gradient(90deg,rgb(13_176_43/0.07)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_75%)]"
      />
      <IndiaHolo sites={SITES} active={active} pins={pins} bridge={bridge} />

      {/* the hand-off from “Inside the panel”: its last frame, then it melts into one tile (driven by IndiaHolo) */}
      <div ref={bridge} aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-white" />
        {/* eslint-disable-next-line @next/next/no-img-element -- a plain frame, sized by the 3D scene each frame */}
        <img alt="" src={BRIDGE_SRC} decoding="async" className={BRIDGE_BOX} />
      </div>

      <div ref={pins} className="pointer-events-none absolute inset-0">
        {SITES.map((f, i) => {
          const on = active === f.slug;
          const t = tone(f);
          const [dx, dy] = FAN[f.slug] ?? [0, 0];
          return (
            <div key={f.slug} data-pin={i} className={cn("absolute top-0 left-0 will-change-transform", on ? "z-20" : "z-10")}>
              {(dx !== 0 || dy !== 0) && (
                <span
                  aria-hidden
                  className="absolute top-0 left-0 h-px origin-left bg-foreground/25"
                  style={{ width: Math.round(Math.hypot(dx, dy)), transform: `rotate(${Math.atan2(dy, dx).toFixed(3)}rad)` }}
                />
              )}
              <Link
                style={{ left: dx, top: dy + (dx ? 10 : 0) }}
                href={`/factories/${f.slug}`}
                aria-label={f.name}
                onPointerEnter={() => onActive(f.slug)}
                onPointerLeave={() => onActive(null)}
                onFocus={() => onActive(f.slug)}
                onBlur={() => onActive(null)}
                className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full rounded-full focus-visible:shadow-glow focus-visible:outline-none"
              >
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border border-white/80 bg-white/85 py-1 pr-2.5 pl-1.5 text-[0.6875rem] font-medium whitespace-nowrap text-foreground shadow-[0_8px_24px_-12px_rgb(5_12_24/0.45)] ring-4 backdrop-blur-md transition-all duration-300",
                    t.ring,
                    on ? "scale-110" : "opacity-95",
                  )}
                >
                  <span className={cn("size-2 rounded-full", t.dot, f.status === "under-construction" && "animate-pulse")} />
                  {f.short}
                </span>
              </Link>

              {/* status card */}
              {on && (
                <div role="status" style={{ left: dx, top: dy + 12 }} className="pointer-events-none absolute w-64 -translate-x-1/2 animate-fade-in rounded-lg border border-white/70 bg-white/90 p-4 shadow-[0_24px_60px_-20px_rgb(5_12_24/0.45)] backdrop-blur-xl">
                  <p className={cn("flex items-center gap-1.5 text-[0.6875rem] tracking-[0.15em] uppercase", t.text)}>
                    <KindIcon f={f} className="size-3.5" /> {statusLabel(f)}
                  </p>
                  <p className="mt-1 font-medium text-foreground">{f.short}</p>
                  <p className="mt-1 text-sm leading-snug text-body">{f.headline}</p>
                  {f.status === "under-construction" ? (
                    <div className="mt-3">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#f0a020]/15">
                        <div className="h-full w-1/3 animate-pulse rounded-full bg-[linear-gradient(90deg,#f0a020,#ffd27a)]" />
                      </div>
                      <p className="mt-1.5 text-[0.6875rem] text-muted">Building now</p>
                    </div>
                  ) : (
                    f.kind !== "office" && (
                      <p className="mt-3 flex items-center gap-1.5 text-[0.6875rem] text-primary-strong">
                        <span className="relative inline-flex size-2">
                          <span className="absolute inset-0 animate-ping rounded-full bg-brand-green" />
                          <span className="relative size-2 rounded-full bg-brand-green" />
                        </span>
                        Producing now
                      </p>
                    )
                  )}
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary-strong">
                    Step inside <ArrowRight aria-hidden className="size-3.5" />
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
