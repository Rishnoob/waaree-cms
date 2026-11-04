"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis smooth scrolling driven by GSAP's ticker, so ScrollTrigger and Lenis share one clock
 * (the standard pairing). Skipped entirely when the visitor prefers reduced motion.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  // Measure pins as soon as the page mounts and again when fonts settle, instead of waiting for
  // window "load" (late images would otherwise shift every section below a pinned one).
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    const raf = requestAnimationFrame(refresh);
    void document.fonts?.ready.then(refresh);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // anchors: Lenis resolves #targets at click time, so pinned sections never throw links off.
    const lenis = new Lenis({ autoRaf: false, lerp: 0.09, wheelMultiplier: 0.9, anchors: { offset: 0 } });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return children;
}
