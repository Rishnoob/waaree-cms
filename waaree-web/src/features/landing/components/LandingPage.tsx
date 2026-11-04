"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useRef, ViewTransition } from "react";

import { ChapterRail } from "./ChapterRail";
import { Enquiry } from "./Enquiry";
import { Factories } from "./Factories";
import { FilmPlayer } from "./FilmPlayer";
import { GivingBack } from "./GivingBack";
import { GlobeHero, roomForDescenders } from "./GlobeHero";
import { Growth } from "./Growth";
import { ImpactLevels } from "./ImpactLevels";
import { InsideThePanel } from "./InsideThePanel";
import { Interlude } from "./Interlude";
import { Journey } from "./Journey";
import { Legacy } from "./Legacy";
import { Manufacturing } from "./Manufacturing";
import { Newsroom } from "./Newsroom";
import { Polish } from "./Polish";
import { Offerings } from "./Offerings";
import { SiteFooter } from "./SiteFooter";
import { SmoothScroll } from "./SmoothScroll";
import { StoryNav } from "./StoryNav";
import { WaareeNow } from "./WaareeNow";
import { WhatsNext } from "./WhatsNext";
import { WhoWeAre } from "./WhoWeAre";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

// The page’s calm colour drift: each chapter tints the whole page as you arrive (all near-white).

/**
 * The Story of Waaree: a scroll-driven presentation in five acts (chapters.ts): who Waaree is,
 * its journey, its progress, where it is going, and why it matters.
 */
export function LandingPage() {
  const main = useRef<HTMLElement>(null);

  // Fetch every 3D scene’s code while the page is idle (after the hero has loaded), one at a
  // time, so no chapter waits for a download when it is reached.
  useEffect(() => {
    const scenes = [
      () => import("../three/PanelScene"),
      () => import("../three/JourneyScene"),
      () => import("../three/IndiaHolo"),
      () => import("../three/RevenueSkyline"),
      () => import("../three/ImpactIsland"),
      () => import("../three/CommunityForest"),
    ];
    let cancelled = false;
    const idle = (fn: () => void) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 400));
    const next = (i: number) => {
      if (cancelled || i >= scenes.length) return;
      idle(() => void scenes[i]!().finally(() => next(i + 1)));
    };
    const start = window.setTimeout(() => next(0), 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
  }, []);

  useGSAP(
    (_, contextSafe) => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) return;

      // One reveal system for every chapter: [data-reveal] elements rise in, in small staggered batches.
      gsap.set("[data-reveal]", { opacity: 0, y: 32 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true }),
      });

      // Chapter headings rise line by line from behind a mask (split after Poppins loads, re-split on resize).
      document.fonts.ready.then(
        contextSafe!(() => {
          gsap.utils.toArray<HTMLElement>("[data-split]").forEach((el) => {
            SplitText.create(el, {
              type: "lines",
              mask: "lines",
              autoSplit: true,
              onSplit: (self) => {
                roomForDescenders(self.masks);
                return gsap.fromTo(
                  self.lines,
                  { yPercent: 110 },
                  { yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.09, scrollTrigger: { trigger: el, start: "top 85%", once: true } },
                );
              },
            });
          });
        }),
      );
    },
    { scope: main },
  );

  return (
    <SmoothScroll>
      <StoryNav />
      <FilmPlayer />
      <ChapterRail />
      <Polish />
      <ViewTransition enter="page-in" exit="page-out" default="none">
      <main ref={main} className="bg-white">
        {/* Act I · Who we are (the globe → panel hand-off must stay together; the panel then crumbles into sand) */}
        <GlobeHero />
        <InsideThePanel />
        <Journey />
        <Factories />
        <WhoWeAre />
        {/* Act II · Our journey (Who we are ends on “But how did we get here?”) */}
        <Legacy />
        <Manufacturing />
        {/* Act III · Progress */}
        <WaareeNow />
        <Growth />
        {/* Act IV · Where it’s going */}
        <WhatsNext />
        {/* Act V · Why it matters */}
        <ImpactLevels />
        {/* a breath between two big scenes */}
        <Interlude id="pause" words="Clean power is half the story. The other half is the people who live beside the plants." cue="Waaree India Foundation" />
        <GivingBack />
        <Offerings />
        <Newsroom />
        <Enquiry />
      </main>
      </ViewTransition>
      <SiteFooter />
    </SmoothScroll>
  );
}
