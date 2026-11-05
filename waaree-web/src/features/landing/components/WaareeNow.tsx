"use client";

import { Play } from "lucide-react";
import { Fragment, useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { chapterNumber } from "../chapters";
import { filmFor } from "../data/films";
import { AHEAD, fmtCap, pct, PROJECTS, STAGE_LABEL, UPDATES } from "../data/projects";
import { Glow } from "./Chapter";
import { openFilm } from "./FilmPlayer";
import { BuildGlyph, ProjectCard, Row, STAGE_TONE } from "./ProgressRow";

const FEATURED = ["nagpur", "unn", "rola", "texas", "dungri"].map((id) => PROJECTS.find((p) => p.id === id)!);
const rising = PROJECTS.filter((p) => p.stage !== "running");
// each project shows once: the biggest builds on the billboard, the rest of the work in one row (in
// time order, the furthest along first within a year), what runs at full capacity in the other
const WHEN = ["FY27", "FY28", "FY29", "Ongoing"] as const;
const building = WHEN.map((w) => [w, rising.filter((p) => p.due === w && !FEATURED.includes(p)).sort((a, b) => pct(b) - pct(a))] as const).filter(([, items]) => items.length);
const RUNNING = PROJECTS.filter((p) => p.stage === "running");
const others = building.reduce((n, [, items]) => n + items.length, 0); // FEATURED.length + others = rising.length

/**
 * Waaree now (Act III): every plant and project and where it stands, each shown once. The latest
 * updates drifting by, a billboard of the biggest builds, then two rows: the rest of the work in
 * progress (with year marks) and what runs today. Figures from IAR26 (data/projects.ts).
 */
export function WaareeNow() {
  return (
    <section id="waaree-now" data-chapter="waaree-now" data-tone="light" aria-labelledby="now-title" className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f3f8fb_30%,#f6fbf8_100%)] px-6 pt-28 pb-20 md:px-[7vw] md:pt-36">
      <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
        <span className="text-muted tabular-nums">{chapterNumber("waaree-now")}</span>
        <span aria-hidden className="h-px w-6 bg-border-strong" />
        Act III · Progress
      </p>
      <h2 id="now-title" data-split className="mt-4 max-w-4xl text-4xl leading-[1.06] font-light tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
        {rising.length} projects rising. <Glow><span className="whitespace-nowrap">₹{AHEAD.capexCr} Cr</span> in motion.</Glow>
      </h2>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-body">
        Every Waaree plant and project, and exactly where it stands: from the silicon in Oman to the battery lines in Rola. Figures as on 28 July 2026.
      </p>

      <Updates />
      <Billboard />

      <Row title={`The other ${others} being built`} className="mt-16">
        {building.map(([when, items]) => (
          <Fragment key={when}>
            <YearMark label={when === "Ongoing" ? "Ongoing" : `Due ${when}`} />
            {items.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </Fragment>
        ))}
      </Row>
      <Row title="Running today" note={`${RUNNING.length} plants`} className="mt-10">
        {RUNNING.map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
      </Row>
      <p className="mt-4 text-[0.6875rem] text-muted">Source: Waaree Integrated Annual Report FY2025-26.</p>
    </section>
  );
}

/** The biggest builds, one at a time (rotates every 7 s; pauses on hover or focus). */
function Billboard() {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (hold || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((k) => (k + 1) % FEATURED.length), 7000);
    return () => window.clearInterval(t);
  }, [hold]);
  const p = FEATURED[i]!;
  const film = filmFor(p.id);
  const tone = STAGE_TONE[p.stage];
  return (
    <div
      className="relative mt-14 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0b4a3c_0%,#0c4f5a_45%,#0e4670_100%)] text-white shadow-[0_50px_100px_-50px_rgb(12_110_120/0.6),0_0_0_1px_rgb(255_255_255/0.08)_inset]"
      aria-roledescription="carousel"
      aria-label="Biggest builds"
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_70%_at_75%_60%,rgb(25_196_106/0.35),transparent_70%),radial-gradient(40%_60%_at_100%_0%,rgb(40_169_226/0.45),transparent_70%),radial-gradient(35%_50%_at_0%_100%,rgb(240_160_32/0.14),transparent_70%)]" />
      <div aria-hidden className="absolute inset-0 [background-image:linear-gradient(rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.07)_1px,transparent_1px)] [mask-image:linear-gradient(90deg,transparent,#000_55%)] [background-size:36px_36px]" />
      <h3 className="relative flex items-center gap-3 px-7 pt-7 text-xl font-light text-white md:px-12 md:pt-10 md:text-2xl">
        <span aria-hidden className="h-px w-8 bg-[linear-gradient(90deg,#19c46a,#28a9e2)]" />
        <span>
          The <span className="font-normal text-[#7fe8b0]">{FEATURED.length}</span> biggest of the <span className="font-normal text-[#8fd8ff]">{rising.length}</span>
        </span>
      </h3>
      <div key={p.id} className="relative grid animate-rise-in items-center gap-6 p-7 md:grid-cols-[1fr_1.1fr] md:px-12 md:pt-6 md:pb-12">
        <div>
          <p className="flex items-center gap-2 text-xs tracking-[0.2em] text-white/70 uppercase">
            <span className={cn("size-2 rounded-full", tone.dot, "animate-pulse")} /> {STAGE_LABEL[p.stage]} · {p.place}
          </p>
          <h3 className="mt-3 text-3xl leading-tight font-light text-white md:text-5xl">{p.name}</h3>
          <p className="mt-3 max-w-md text-base leading-relaxed text-white/80">{p.line}</p>
          <dl className="mt-7 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-5">
            <div>
              <dt className="text-[0.625rem] tracking-[0.15em] text-white/60 uppercase">Target</dt>
              <dd className="mt-1 text-xl font-light tabular-nums">{fmtCap(p.target, p.unit)}</dd>
            </div>
            <div>
              <dt className="text-[0.625rem] tracking-[0.15em] text-white/60 uppercase">Due</dt>
              <dd className="mt-1 text-xl font-light">{p.due}</dd>
            </div>
            <div>
              <dt className="text-[0.625rem] tracking-[0.15em] text-white/60 uppercase">Capex</dt>
              <dd className="mt-1 text-xl font-light">{p.invest ?? "—"}</dd>
            </div>
          </dl>
          {film && (
            <button type="button" onClick={() => openFilm(film)} className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0b4a3c] transition-transform hover:scale-105 focus-visible:shadow-glow focus-visible:outline-none">
              <Play aria-hidden className="size-4 fill-current" /> Watch: {film.title}
            </button>
          )}
        </div>
        <BuildGlyph p={p} className="mx-auto w-full max-w-xl text-white" />
      </div>
      <div className="relative flex gap-2 px-7 pb-6 md:px-12" role="tablist" aria-label="Choose a build">
        {FEATURED.map((f, k) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={k === i}
            aria-label={f.name}
            onClick={() => setI(k)}
            className="group flex-1 py-2 focus-visible:outline-none"
          >
            <span className="block h-[3px] overflow-hidden rounded-full bg-white/20">
              <span className={cn("block h-full rounded-full bg-(image:--brand-gradient) transition-[width] ease-linear", k === i ? (hold ? "w-full duration-300" : "w-full duration-[7000ms]") : k < i ? "w-full duration-0" : "w-0 duration-0")} />
            </span>
            <span className={cn("mt-2 block truncate text-left text-[0.6875rem] transition-colors", k === i ? "text-white" : "text-white/60 group-hover:text-white/90")}>{f.place.split(",")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** A milestone on the timeline row: the year, glowing, with the line running on. */
function YearMark({ label }: { label: string }) {
  return (
    <div aria-hidden className="relative flex w-10 shrink-0 snap-start md:w-14 flex-col items-center pt-2">
      <span className="bg-(image:--brand-gradient) bg-clip-text text-lg font-medium whitespace-nowrap text-transparent [writing-mode:vertical-rl]">{label}</span>
      <span className="mt-3 w-px flex-1 bg-[linear-gradient(180deg,#0db02b,#28a9e2_60%,transparent)]" />
      <span className="absolute top-0 size-2 rounded-full bg-brand-green shadow-[0_0_0_4px_rgb(13_176_43/0.15),0_0_14px_rgb(13_176_43/0.6)]" />
    </div>
  );
}

/** The latest updates, newest first: a light live-feed bar, drifting by in one slow line (pauses on hover). */
function Updates() {
  return (
    <div className="group relative mt-10 flex items-center overflow-hidden rounded-full bg-white/80 text-foreground shadow-[0_20px_50px_-36px_rgb(5_30_60/0.45)] ring-1 ring-border backdrop-blur">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(40%_120%_at_0%_50%,rgb(13_176_43/0.1),transparent_70%)]" />
      <p className="relative z-10 flex shrink-0 items-center gap-2 border-r border-border py-3 pr-5 pl-5 text-[0.6875rem] font-medium tracking-[0.25em] text-primary-strong uppercase md:pl-6">
        <span className="relative flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#19c46a] opacity-60" />
          <span className="relative size-2 rounded-full bg-[#19c46a]" />
        </span>
        Latest
      </p>
      <div className="relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_5%,#000_95%,transparent)]">
        <div className="wr-marquee flex w-max gap-4 group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1 || undefined} aria-label={copy === 0 ? "Latest updates" : undefined} className="flex">
              {UPDATES.map((u) => (
                <li key={u.title} className="flex shrink-0 items-baseline gap-2.5 py-3 pr-6 pl-6 whitespace-nowrap">
                  <span aria-hidden className="size-1.5 -translate-y-px self-center rounded-full bg-[#28a9e2] shadow-[0_0_10px_#28a9e2]" />
                  <span className="text-[0.6875rem] tracking-[0.15em] text-primary-strong uppercase tabular-nums">{u.date}</span>
                  <span className="text-sm font-medium">{u.title}</span>
                  <span className="text-sm text-muted">{u.text}</span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
