"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight, BookOpen, GraduationCap, HeartPulse, Sprout, TrendingUp, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef } from "react";

import { chapterNumber } from "../chapters";
import { CARE, COMMUNITY_SOURCE, CSR, GROVES, plantedAt, SAPLINGS, STUDENTS, studentsAt } from "../data/community";
import { IMPACT } from "../data/home";
import { community } from "../story-state";
import { Glow, waareeUrl } from "./Chapter";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const CommunityForest = dynamic(() => import("../three/CommunityForest"), { ssr: false });
const n = (v: number) => v.toLocaleString("en-IN");
// Waaree’s CSR programmes and what each covers, as described on waaree.com/csr.
const PROGRAMMES = [
  { name: "Shakti", what: "Communities", Icon: Users },
  { name: "Sehat", what: "Health", Icon: HeartPulse },
  { name: "Samarth", what: "Skills", Icon: TrendingUp },
  { name: "Srishti", what: "Environment", Icon: Sprout },
  { name: "Shiksha", what: "Education", Icon: BookOpen },
];

/**
 * Giving back: a pinned chapter after Impact. 7,500 saplings are planted in two groves as you
 * scroll (one 3D sapling per real one), then a school fills with a light for each of its 2,000+
 * students. Counters are written straight to the DOM from the scroll (no re-renders).
 */
export function GivingBack() {
  const root = useRef<HTMLElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const trees = useRef<HTMLSpanElement>(null);
  const kids = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      community.progress = 0;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const update = () => {
        const p = community.progress;
        if (trees.current) trees.current.textContent = n(plantedAt(p));
        if (kids.current) kids.current.textContent = n(studentsAt(p)) + (studentsAt(p) >= STUDENTS ? "+" : "");
      };
      update();
      gsap
        .timeline({
          defaults: { ease: "power2.out" },
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: reduced ? true : 0.6 },
          onUpdate: update,
        })
        .to(community, { progress: 1, duration: 10, ease: "none" }, 0)
        .fromTo(".gb-school", { opacity: 0.35 }, { opacity: 1, duration: 0.6 }, 5.6)
        .fromTo(".gb-more", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 8.2)
        .to({}, { duration: 1 }, 9);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="community" data-chapter="community" data-tone="light" aria-labelledby="community-title" className="relative h-[440svh] bg-white">
      <div className="sticky top-0 h-svh overflow-hidden bg-[radial-gradient(80%_70%_at_65%_60%,#effaf2_0%,#ffffff_70%)]">
        <CommunityForest labels={labels} />

        {/* labels pinned over the groves and the school */}
        <div ref={labels} aria-hidden className="pointer-events-none absolute inset-0">
          {[...GROVES.map((g) => `${g.place} · ${n(g.trees)} trees`), `School · ${n(STUDENTS)}+ students`, ...CARE.map((c) => c.label)].map((t) => (
            <div key={t} data-label className="absolute top-0 left-0 opacity-0 will-change-transform">
              <span className="block -translate-x-1/2 -translate-y-full rounded-full border border-white/80 bg-white/85 px-3 py-1 text-[0.6875rem] font-medium whitespace-nowrap text-foreground shadow-[0_8px_24px_-12px_rgb(5_12_24/0.45)] backdrop-blur-md">
                {t}
              </span>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-[11svh] px-6 md:top-0 md:bottom-0 md:flex md:max-w-[40rem] md:flex-col md:justify-center md:bg-[linear-gradient(90deg,#ffffff_55%,rgb(255_255_255/0))] md:pr-24 md:pl-[7vw]">
          <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
            <span className="text-muted tabular-nums">{chapterNumber("community")}</span>
            <span aria-hidden className="h-px w-6 bg-border-strong" />
            Giving back
          </p>
          <h2 id="community-title" data-split className="mt-4 text-4xl leading-[1.08] font-light tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
            7,500 trees. <Glow>2,000+ students.</Glow>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-body md:text-lg">
            Every sapling here is one Waaree planted in Gujarat in FY26. Every light is a student in a school it helped build. And around them: care, clean water, food and a home.
          </p>

          <dl className="mt-8 grid max-w-md grid-cols-2 gap-6">
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <Sprout aria-hidden className="size-3.5 text-primary" /> Saplings planted
              </dt>
              <dd className="mt-1 text-4xl font-light tracking-tight text-foreground tabular-nums md:text-5xl">
                <span ref={trees}>0</span>
                <span className="sr-only"> of {n(SAPLINGS)}</span>
              </dd>
            </div>
            <div className="gb-school">
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <GraduationCap aria-hidden className="size-3.5 text-primary" /> Students reached
              </dt>
              <dd className="mt-1 bg-(image:--brand-gradient) bg-clip-text text-4xl font-light tracking-tight text-transparent tabular-nums md:text-5xl">
                <span ref={kids}>0</span>
              </dd>
            </div>
          </dl>

          <div className="gb-more mt-7 max-w-md border-t border-border pt-5 opacity-0 max-md:hidden">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Stat value={`₹${CSR.spendCr} Cr`} label={`Spent on CSR in FY26, up from ₹${CSR.spendPrevCr} Cr in FY25`} />
              <Stat value={CSR.peopleReached} label={`People reached by Waaree’s CSR in FY26, ${CSR.reachedDirectly} of them directly`} />
              <Stat value={n(CSR.feesPaid)} label="Children whose school fees were paid for a full year" />
              <Stat value={n(CSR.schoolBags)} label="School bags given to village students in Gujarat" />
            </dl>
            <ul className="pointer-events-auto mt-5 flex flex-wrap gap-1.5" aria-label="Waaree Foundation programmes">
              {PROGRAMMES.map(({ name, what, Icon }) => (
                <li key={name} className="flex items-center gap-1.5 rounded-full border border-border bg-white/90 px-2.5 py-1 text-xs text-foreground">
                  <Icon aria-hidden className="size-3.5 text-primary" strokeWidth={1.6} /> {name} <span className="text-muted">· {what}</span>
                </li>
              ))}
              {IMPACT.links.filter((l) => /csr/i.test(l.label)).map((l) => (
                <li key={l.href}>
                  <a href={waareeUrl(l.href)} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-primary-strong hover:underline">
                    {l.label} <ArrowUpRight aria-hidden className="size-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="pointer-events-none absolute right-6 bottom-5 max-w-sm text-right text-[0.625rem] leading-snug text-muted md:right-[7vw]">
          Source: {COMMUNITY_SOURCE}. Plantations with Sadbhavna Seva Foundation; schools through Tapovan Vidhyalay Dham.
        </p>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="text-xl font-medium text-foreground tabular-nums">{value}</dt>
      <dd className="mt-0.5 text-xs leading-snug text-muted">{label}</dd>
    </div>
  );
}
