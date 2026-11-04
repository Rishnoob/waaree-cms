"use client";

import "./polish.css";

import { gsap } from "gsap";
import { useEffect } from "react";

/**
 * Small touches shared by the public pages:
 * - `#wr-liquid`: an SVG filter (moving turbulence) that photos wear on hover (`group-hover:[filter:url(#wr-liquid)]`).
 * - Magnetic buttons: `[data-magnetic]` leans toward the pointer; `[data-tilt]` cards tilt in 3D with a glare.
 * All of it is off under reduced motion.
 */
export function Polish() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    let magnet: HTMLElement | null = null;
    let tilted: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      // magnetic: lean up to 8px toward the pointer
      const m = t.closest<HTMLElement>("[data-magnetic]");
      if (magnet && magnet !== m) gsap.to(magnet, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      magnet = m;
      if (m) {
        const r = m.getBoundingClientRect();
        gsap.to(m, { x: ((e.clientX - r.left) / r.width - 0.5) * 16, y: ((e.clientY - r.top) / r.height - 0.5) * 12, duration: 0.3, ease: "power2.out" });
      }
    };
    // [data-tilt] cards lean toward the pointer, with a soft glare where it is
    const tilt = (e: PointerEvent) => {
      const c = (e.target as HTMLElement).closest<HTMLElement>("[data-tilt]");
      if (tilted && tilted !== c) {
        gsap.to(tilted, { rotationX: 0, rotationY: 0, duration: 0.7, ease: "power3.out" });
        tilted.style.setProperty("--go", "0");
      }
      tilted = c;
      if (!c) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      gsap.to(c, { rotationX: (0.5 - y) * 7, rotationY: (x - 0.5) * 9, transformPerspective: 900, duration: 0.4, ease: "power2.out" });
      c.style.setProperty("--gx", `${x * 100}%`);
      c.style.setProperty("--gy", `${y * 100}%`);
      c.style.setProperty("--go", "1");
    };
    window.addEventListener("pointermove", tilt, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointermove", tilt);
    };
  }, []);

  return (
    <>
      <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
        <filter id="wr-liquid" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="2" seed="7">
            <animate attributeName="baseFrequency" dur="9s" values="0.008 0.014;0.012 0.02;0.008 0.014" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="14" />
        </filter>
      </svg>
    </>
  );
}
