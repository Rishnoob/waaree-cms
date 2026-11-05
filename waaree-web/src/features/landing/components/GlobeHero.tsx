"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowRight, ChevronDown, Hand } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { FACILITIES } from "../data/facilities";
import { HERO } from "../data/home";
import { hero } from "../story-state";
import { BRIDGE_BOX, BRIDGE_SRC } from "../three/bridge";
import { Glow } from "./Chapter";
import { KindIcon, statusLabel } from "./facility-ui";
import { LiveEnergy } from "./LiveEnergy";
import { SunMotes } from "./SunMotes";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** Line masks clip at the line box; give descenders (g, y, p) room without shifting the layout. */
export function roomForDescenders(masks: Element[]) {
  for (const m of masks) {
    (m as HTMLElement).style.paddingBottom = "0.16em";
    (m as HTMLElement).style.marginBottom = "-0.16em";
  }
}

// WebGL only in the browser; the sky and copy render instantly while it loads.
const GlobeScene = dynamic(() => import("../three/GlobeScene"), { ssr: false });

/**
 * Hero: a living 3D Earth (NASA Blue Marble colour, drifting clouds, a rising sun whose light streams onto it, Waaree’s sites glowing, arcs to its
 * sites abroad). Scrolling turns the planet to India and moves in, leading into “Who we are”.
 * Intro: the headline rises line by line; once the Earth loads it eases in, the sun and atmosphere
 * brighten, the installations unfold and the sites light up. Hovering a site shows a card; a click
 * opens its page.
 */
export function GlobeHero() {
  const root = useRef<HTMLElement>(null);
  const drag = useRef<{ x: number } | null>(null);
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState<{ slug: string; x: number; y: number } | null>(null);
  const site = hover ? FACILITIES.find((f) => f.slug === hover.slug) : undefined;

  const onSite = useCallback((slug: string | null, x = 0, y = 0) => {
    // keep the card on screen: near the right edge it opens to the left of the pointer
    const left = Math.min(x + 18, window.innerWidth - 280);
    setHover((h) => (slug ? (h?.slug === slug && Math.abs(h.x - left) < 2 && Math.abs(h.y - y) < 2 ? h : { slug, x: left, y }) : null));
  }, []);
  const onReady = useCallback(() => {
    setReady(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) hero.intro = 1;
    else gsap.to(hero, { intro: 1, duration: 2.8, ease: "power2.out", delay: 0.15 });
  }, []);

  useGSAP(
    (_, contextSafe) => {
      hero.progress = 0;
      hero.intro = 0;
      hero.dive = 0;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        // The headline rises line by line from behind a mask; the rest follows.
        document.fonts.ready.then(
          contextSafe!(() => {
            SplitText.create("#hero-title", {
              type: "lines",
              mask: "lines",
              autoSplit: true,
              onSplit: (self) => {
                roomForDescenders(self.masks);
                return gsap.fromTo(self.lines, { yPercent: 110 }, { yPercent: 0, duration: 1.2, ease: "power4.out", stagger: 0.1, delay: 0.1 });
              },
            });
            gsap.fromTo(".hero-intro", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.55 });
          }),
        );
      }
      gsap
        .timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.6 },
        })
        .to(hero, { progress: 1, duration: 10, ease: "none" }, 0)
        .to(".hero-copy", { opacity: 0, y: -40, duration: 2.5 }, 0.6)
        .to(".hero-hint", { opacity: 0, duration: 1.5 }, 0.4)
        .fromTo(".hero-caption", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 2 }, 5.5)
        // the dive: India's module belt turns to us, we fall through the clouds into the next chapter
        .to(".hero-caption", { opacity: 0, y: -30, duration: 1.2 }, 9.6)
        .to(hero, { dive: 1, duration: 4, ease: "power1.in" }, 10)
        .fromTo(".hero-dive-label", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1 }, 10.4)
        .to(".hero-dive-label", { opacity: 0, duration: 0.6 }, 12.2)
        // clouds rush past mid-dive, then clear to show the module rising out of the array
        .fromTo(".hero-clouds", { opacity: 0, scale: 0.6 }, { opacity: 0.75, scale: 1.2, duration: 1.2, ease: "power2.in" }, 10.8)
        .to(".hero-clouds", { opacity: 0, scale: 1.8, duration: 1 }, 12.0)
        .to({}, { duration: 0.6 }, 14.6);
      // The hand-off, on the same scroll range but with no scrub lag (it must be exact when the next
      // chapter cuts in): the module from the array grows, on a white sky, to the very frame
      // “Inside the panel” opens on.
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: true } })
        .fromTo(".hero-bridge", { opacity: 0, scale: 0.18 }, { opacity: 1, duration: 0.5, ease: "none", immediateRender: true }, 11.7)
        .to(".hero-bridge", { scale: 1, duration: 2.3, ease: "power2.inOut" }, 11.8)
        .fromTo(".hero-white", { opacity: 0 }, { opacity: 1, duration: 1, ease: "none" }, 12.6)
        .to({}, { duration: 0.01 }, 15.19);
    },
    { scope: root },
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a,button")) return;
    drag.current = { x: e.clientX };
    downAt.current = { x: e.clientX, y: e.clientY };
    hero.dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    hero.spinVelocity = (e.clientX - drag.current.x) * 0.0045;
    drag.current.x = e.clientX;
  };
  const endDrag = (e: React.PointerEvent) => {
    // a click (not a drag) on a hovered site opens its page
    const d = downAt.current;
    if (e.type === "pointerup" && d && hover && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) {
      router.push(`/factories/${hover.slug}`);
    }
    drag.current = null;
    downAt.current = null;
    hero.dragging = false;
  };

  return (
    <section ref={root} id="story" data-tone="light" aria-labelledby="hero-title" className="relative h-[330svh]">
      <div
        className={cn(
          "sticky top-0 h-svh touch-pan-y overflow-hidden select-none",
          hover ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
        )}
        data-cursor={hover ? undefined : "Drag"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* Morning sky, warmed where the sun rises over the Earth */}
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,#eef7fc_0%,#f7fbf9_55%,#ffffff_100%)]" />
        <div
          aria-hidden
          className="absolute -top-[25vmin] left-[38%] size-[85vmin] rounded-full bg-[radial-gradient(circle,rgb(255_222_160/0.4)_0%,rgb(255_236_200/0.14)_40%,transparent_70%)]"
        />
        <div aria-hidden className="absolute inset-0 bg-(image:--brand-mesh) opacity-60" />

        {/* While the Earth loads: a soft planet-glow in its place, which hands over to it */}
        <div
          aria-hidden
          className={cn(
            "absolute top-1/2 right-[-12vh] size-[84vh] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_40%_40%,rgb(120_190_235/0.45),rgb(130_210_170/0.25)_45%,transparent_70%)] blur-2xl transition-opacity duration-1000 max-md:hidden",
            ready ? "opacity-0" : "opacity-100 motion-safe:animate-pulse",
          )}
        />
        <SunMotes />

        <div className={cn("absolute inset-0 transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}>
          <GlobeScene onSite={onSite} onReady={onReady} />
        </div>

        {/* Hover card for a site on the globe */}
        {site && hover && (
          <div
            role="status"
            className="pointer-events-none absolute z-10 w-64 animate-fade-in rounded-lg border border-border bg-white/90 p-4 shadow-md backdrop-blur-md"
            style={{ left: hover.x, top: hover.y + 18 }}
          >
            <p className="flex items-center gap-1.5 text-[0.6875rem] tracking-[0.15em] text-muted uppercase">
              <KindIcon f={site} className="size-3.5" /> {statusLabel(site)} · {site.country}
            </p>
            <p className="mt-1 font-medium text-foreground">{site.short}</p>
            <p className="mt-1 text-sm leading-snug text-body">{site.headline}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary-strong">
              Click to explore <ArrowRight aria-hidden className="size-3.5" />
            </p>
          </div>
        )}

        {/* Copy */}
        <div className="hero-copy pointer-events-none absolute inset-x-0 top-[13svh] px-6 md:top-0 md:bottom-0 md:flex md:max-w-[44rem] md:flex-col md:justify-center md:pl-[7vw] 2xl:max-w-[54rem]">
          <p className="hero-intro text-xs font-medium tracking-[0.25em] text-primary uppercase">Waaree · One with the Sun</p>
          <h1 id="hero-title" className="mt-5 text-[2.6rem] leading-[1.04] font-light tracking-tight text-foreground sm:text-6xl lg:text-7xl 2xl:text-[5.5rem]">
            Accelerating Global <Glow>Energy Transition</Glow>
          </h1>
          <p className="hero-intro mt-6 max-w-md text-lg leading-relaxed text-body 2xl:max-w-lg 2xl:text-xl">{HERO.oneLiner}</p>
          <div className="hero-intro pointer-events-auto mt-9 flex flex-wrap gap-3">
            {/* the one call to action: brand gradient, a slow light across it, the arrow leans in on hover */}
            <a
              href="#inside"
              data-magnetic
              className="group relative inline-flex h-14 items-center gap-4 overflow-hidden rounded-full bg-[linear-gradient(100deg,#0a9a3a,#13b06a_45%,#1f9fd8)] py-2 pr-2 pl-7 text-base font-medium text-white shadow-[0_14px_36px_-12px_rgb(13_150_90/0.65)] transition-shadow duration-500 hover:shadow-[0_18px_48px_-12px_rgb(31_159_216/0.7)] focus-visible:shadow-glow focus-visible:outline-none"
            >
              <span aria-hidden className="wn-shimmer absolute inset-y-0 w-1/3 bg-[linear-gradient(100deg,transparent,rgb(255_255_255/0.35),transparent)]" />
              <span className="relative">Explore our story</span>
              <span aria-hidden className="relative grid size-10 place-items-center rounded-full bg-white/20 ring-1 ring-white/40 backdrop-blur transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight className="size-4" />
              </span>
            </a>
          </div>
          <LiveEnergy className="hero-intro mt-5 max-w-md text-sm leading-relaxed text-body max-sm:hidden" />
        </div>

        <p className="hero-hint pointer-events-none absolute right-6 bottom-8 hidden items-center gap-2 rounded-md border border-border bg-white/70 px-3 py-2 text-xs text-muted backdrop-blur md:right-[7vw] md:flex">
          <Hand aria-hidden className="size-3.5" /> Drag to turn the Earth
        </p>
        <a
          href="#who-we-are"
          className="hero-hint absolute bottom-8 left-6 flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground md:left-[7vw]"
        >
          <ChevronDown aria-hidden className="size-4 motion-safe:animate-bounce" /> Scroll
        </a>

        {/* The dive: clouds rush past; one module rises out of the array and grows to fill the frame
            “Inside the panel” opens on (the same panel, in the same place: the cut is invisible) */}
        <div aria-hidden className="hero-white pointer-events-none absolute inset-0 bg-white opacity-0" />
        {/* eslint-disable-next-line @next/next/no-img-element -- a plain, preloaded frame; it must not be resized or lazy */}
        <img aria-hidden alt="" src={BRIDGE_SRC} decoding="async" className={cn("hero-bridge pointer-events-none opacity-0", BRIDGE_BOX)} />
        <p className="hero-dive-label pointer-events-none absolute inset-x-0 bottom-[14svh] text-center text-sm font-medium tracking-[0.2em] text-foreground/80 uppercase opacity-0">
          Into south Gujarat · one of these panels is about to meet you
        </p>
        <div aria-hidden className="hero-clouds pointer-events-none absolute -inset-[20%] opacity-0">
          <div className="absolute inset-0 bg-[url(/earth/earth-clouds.webp)] bg-cover bg-center opacity-70 mix-blend-screen blur-[2px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgb(255_255_255/0.95)_0%,rgb(255_255_255/0.6)_35%,transparent_70%)]" />
        </div>

        {/* Arrives as the Earth turns to India: a line, not a list (the numbers live in Who we are) */}
        <div className="hero-caption pointer-events-none absolute inset-x-0 top-[13svh] px-6 opacity-0 max-md:mx-4 max-md:rounded-2xl max-md:bg-white/80 max-md:px-5 max-md:py-5 max-md:shadow-[0_20px_50px_-30px_rgb(5_30_60/0.5)] max-md:backdrop-blur-md md:top-0 md:bottom-0 md:flex md:max-w-[36rem] md:flex-col md:justify-center md:pl-[7vw]">
          <p className="text-xs font-medium tracking-[0.25em] text-primary uppercase">Where it begins</p>
          <p className="mt-3 text-3xl leading-tight font-light tracking-tight text-foreground sm:text-5xl">
            It all begins in <Glow>India.</Glow>
          </p>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-body">
            A Mumbai business that grew into a solar company the world relies on. Its story unfolds below.
          </p>
        </div>
      </div>
    </section>
  );
}
