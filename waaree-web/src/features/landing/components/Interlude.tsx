"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * A breath between two big scenes: one sentence on white space, its words lighting up one by one as
 * you scroll (no 3D, nothing to load). Not a chapter; it carries one chapter into the next.
 */
export function Interlude({ id, words, cue }: { id: string; words: string; cue: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
      gsap.fromTo(
        ".il-word",
        { opacity: 0.12 },
        { opacity: 1, ease: "none", stagger: 0.12, scrollTrigger: { trigger: root.current, start: "top top", end: "70% bottom", scrub: true } },
      );
      gsap.fromTo(".il-cue", { opacity: 0, y: 12 }, { opacity: 1, y: 0, scrollTrigger: { trigger: root.current, start: "60% bottom", end: "80% bottom", scrub: true } });
    },
    { scope: root },
  );

  return (
    <section ref={root} id={id} aria-label={words} className="relative h-[180svh] bg-white">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center px-6 text-center md:px-[12vw]">
        <span aria-hidden className="mb-10 block h-px w-16 bg-(image:--brand-gradient)" />
        <p aria-hidden className="max-w-5xl text-3xl leading-[1.2] font-light tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
          {words.split(" ").map((w, i) => (
            <span key={i} className="il-word">
              {w}{" "}
            </span>
          ))}
        </p>
        <p className="il-cue mt-10 text-xs font-medium tracking-[0.25em] text-primary uppercase opacity-0">{cue} ↓</p>
      </div>
    </section>
  );
}
