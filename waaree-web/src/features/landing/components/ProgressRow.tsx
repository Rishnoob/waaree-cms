"use client";

import { ArrowUpRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { filmFor } from "../data/films";
import { fmtCap, pct, type Project, STAGE_LABEL, type Stage } from "../data/projects";
import { openFilm } from "./FilmPlayer";

export const STAGE_TONE: Record<Stage, { dot: string; text: string; fill: string }> = {
  running: { dot: "bg-brand-green", text: "text-primary-strong", fill: "#0db02b" },
  ramping: { dot: "bg-[#28a9e2]", text: "text-brand-blue", fill: "#28a9e2" },
  building: { dot: "bg-[#f0a020]", text: "text-[#b86e00]", fill: "#f0a020" },
  planned: { dot: "bg-[#8b7cf6]", text: "text-[#5b4bd1]", fill: "#8b7cf6" },
};

/**
 * Our build glyph (not a copied blueprint): an isometric hall that fills with light from the ground
 * to the share built today; the rest stands as a dashed wireframe with a scan line at the build
 * front. Storage shows container rows, hydrogen its tanks, power a lattice tower, solar a sawtooth roof.
 */
export function BuildGlyph({ p, className }: { p: Project; className?: string }) {
  const id = useId().replace(/:/g, "");
  const k = p.stage === "running" ? 1 : pct(p);
  const tone = STAGE_TONE[p.stage].fill;
  // an isometric box: x along (cos30, sin30), z along (-cos30, sin30), y up
  const W = 100;
  const D = 48;
  const H = 44;
  const c = 0.866;
  const ox = 64;
  const oy = 70;
  const P = (x: number, y: number, z: number) => `${(ox + x * c - z * c).toFixed(1)},${(oy + x * 0.5 + z * 0.5 - y).toFixed(1)}`;
  const face = (pts: [number, number, number][]) => pts.map((q) => P(...q)).join(" ");
  const h = H * k;
  return (
    <svg viewBox="0 0 240 150" className={cn("block", className)} aria-hidden>
      <defs>
        <linearGradient id={`f${id}`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0" stopColor={tone} stopOpacity="0.95" />
          <stop offset="1" stopColor={tone} stopOpacity="0.45" />
        </linearGradient>
        <pattern id={`g${id}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="skewX(-30)">
          <path d="M10 0H0V10" fill="none" stroke="currentColor" strokeOpacity="0.07" />
        </pattern>
      </defs>
      <rect width="240" height="150" fill={`url(#g${id})`} />
      {/* the plot */}
      <polygon points={face([[-10, 0, -10], [W + 10, 0, -10], [W + 10, 0, D + 10], [-10, 0, D + 10]])} fill={tone} fillOpacity="0.07" stroke={tone} strokeOpacity="0.25" strokeDasharray="3 3" />
      {/* built: solid, lit faces up to today */}
      {k > 0 && (
        <g>
          <polygon points={face([[0, 0, D], [W, 0, D], [W, h, D], [0, h, D]])} fill={`url(#f${id})`} />
          <polygon points={face([[W, 0, 0], [W, 0, D], [W, h, D], [W, h, 0]])} fill={tone} fillOpacity="0.55" />
          <polygon points={face([[0, h, 0], [W, h, 0], [W, h, D], [0, h, D]])} fill={tone} fillOpacity={k >= 1 ? 0.3 : 0.75} />
        </g>
      )}
      {/* still to build: wireframe */}
      <g fill="none" stroke={tone} strokeWidth="1" strokeOpacity="0.8" strokeDasharray={k >= 1 ? undefined : "3 2.5"}>
        <polygon points={face([[0, 0, D], [W, 0, D], [W, H, D], [0, H, D]])} />
        <polygon points={face([[W, 0, 0], [W, 0, D], [W, H, D], [W, H, 0]])} />
        <polygon points={face([[0, H, 0], [W, H, 0], [W, H, D], [0, H, D]])} />
        {/* the segment’s signature on the roof */}
        {p.segment === "solar" || p.segment === "epc"
          ? [0, 1, 2, 3].map((i) => <polygon key={i} points={face([[i * 25, H, 0], [i * 25 + 25, H, 0], [i * 25 + 25, H + 10, D * 0.15], [i * 25 + 25, H, D]])} />)
          : p.segment === "storage"
            ? [0, 1, 2].map((i) => <polygon key={i} points={face([[8 + i * 30, H, 12], [30 + i * 30, H, 12], [30 + i * 30, H + 9, 12], [8 + i * 30, H + 9, 12]])} />)
            : p.segment === "hydrogen"
              ? [0, 1].map((i) => <ellipse key={i} cx={ox + (25 + i * 45) * c - 24 * c} cy={oy + (25 + i * 45) * 0.5 + 12 - H - 12} rx="10" ry="15" />)
              : <polyline points={[P(W - 20, H, D / 2), P(W - 10, H + 40, D / 2), P(W, H, D / 2), P(W - 20, H, D / 2), P(W, H + 22, D / 2)].join(" ")} />}
      </g>
      {/* the build front */}
      {k > 0 && k < 1 && (
        <g>
          <polyline points={face([[0, h, D], [W, h, D], [W, h, 0]])} fill="none" stroke="#ffffff" strokeWidth="2" />
          <polyline points={face([[0, h, D], [W, h, D], [W, h, 0]])} fill="none" stroke={tone} strokeWidth="1" className="motion-safe:animate-pulse" />
        </g>
      )}
      <text x="228" y="22" textAnchor="end" className="fill-current" fontSize="20" fontWeight="300" opacity="0.85">
        {p.stage === "planned" ? "Next" : `${Math.round(k * 100)}%`}
      </text>
      <text x="228" y="36" textAnchor="end" className="fill-current" fontSize="8" letterSpacing="1.5" opacity="0.5">
        {p.stage === "planned" ? "APPROVED" : "BUILT TODAY"}
      </text>
    </svg>
  );
}

/** A project or plant as a card: image or build glyph, status, capacity now → target, due, film. */
export function ProjectCard({ p, className }: { p: Project; className?: string }) {
  const tone = STAGE_TONE[p.stage];
  const film = filmFor(p.id);
  const grows = p.target != null && p.now !== p.target;
  return (
    <article className={cn("group relative flex w-[min(78vw,18.5rem)] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_20px_50px_-30px_rgb(5_30_20/0.5)] transition-all duration-500 hover:-translate-y-1 hover:border-brand-green/40", className)}>
      <div className="relative h-36 overflow-hidden bg-[linear-gradient(160deg,#f3faf6,#eef6fb)] text-foreground">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- small, lazy card image
          <img src={p.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <BuildGlyph p={p} className="absolute inset-0 size-full p-2" />
        )}
        <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[0.625rem] font-medium tracking-wide text-foreground shadow-sm backdrop-blur">
          <span className={cn("size-1.5 rounded-full", tone.dot, p.stage === "building" && "animate-pulse")} />
          {STAGE_LABEL[p.stage]}
        </span>
        {film && (
          <button
            type="button"
            onClick={() => openFilm(film)}
            className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-[#050c18]/75 px-2.5 py-1 text-[0.6875rem] text-white backdrop-blur transition-colors hover:bg-[#050c18] focus-visible:shadow-glow focus-visible:outline-none"
          >
            <Play aria-hidden className="size-3 fill-current" /> Watch
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[0.6875rem] tracking-[0.12em] text-muted uppercase">{p.place}</p>
        <h4 className="mt-1 text-base leading-snug font-medium text-foreground">{p.name}</h4>
        <p className="mt-1 text-xs leading-relaxed text-body">{p.line}</p>
        <div className="mt-auto pt-3">
          <p className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-foreground tabular-nums">{grows ? `${fmtCap(p.now, p.unit)} → ${fmtCap(p.target, "")}` : fmtCap(p.now, p.unit)}</span>
            <span className={cn("text-xs font-medium", tone.text)}>{p.due}</span>
          </p>
          {grows && (
            <span className="mt-2 block h-1 overflow-hidden rounded-full bg-foreground/8">
              <span className="block h-full rounded-full" style={{ width: `${Math.max(4, pct(p) * 100)}%`, background: tone.fill }} />
            </span>
          )}
          <p className="mt-2 flex items-center justify-between text-[0.6875rem] text-muted">
            <span>{p.invest ? `Capex ${p.invest}` : p.makes}</span>
            {p.slug && (
              <Link href={`/factories/${p.slug}`} className="inline-flex items-center gap-0.5 font-medium text-primary-strong hover:underline">
                Site <ArrowUpRight aria-hidden className="size-3" />
              </Link>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

/**
 * A Netflix-style row: a title, then cards you can swipe or step through with the arrows beside the
 * title (greyed out at either end; hidden when everything fits).
 * `dock` is the slim strip docked at the bottom of a chapter.
 */
export function Row({ title, note, children, dock, className }: { title: string; note?: string; children: React.ReactNode; dock?: boolean; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const check = () => {
      const start = el.scrollLeft < 8;
      const end = el.scrollLeft + el.clientWidth > el.scrollWidth - 8;
      setEdge((e) => (e.start === start && e.end === end ? e : { start, end }));
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, []);
  const step = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.85, behavior: "smooth" });
  const arrow = (dir: -1 | 1) => {
    const end = dir < 0 ? edge.start : edge.end;
    const Icon = dir < 0 ? ChevronLeft : ChevronRight;
    return (
      <button
        type="button"
        onClick={() => step(dir)}
        disabled={end}
        aria-label={`${dir < 0 ? "Back" : "More"}: ${title}`}
        className="grid size-10 place-items-center rounded-full border border-border bg-white text-foreground shadow-[0_6px_18px_-10px_rgb(5_12_24/0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-green/50 hover:text-primary-strong focus-visible:shadow-glow focus-visible:outline-none disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none"
      >
        <Icon aria-hidden className="size-5" />
      </button>
    );
  };
  return (
    <section aria-label={title} className={cn("relative", className)}>
      <div className="mb-3 flex items-end justify-between gap-4">
        <h3 className={cn("font-medium text-foreground", dock ? "text-sm" : "text-lg md:text-xl")}>
          {title} {note && <span className="ml-2 text-xs font-normal text-muted">{note}</span>}
        </h3>
        {/* only when there is more to see than fits */}
        {!(edge.start && edge.end) && (
          <span className="flex shrink-0 gap-2 max-md:hidden">
            {arrow(-1)}
            {arrow(1)}
          </span>
        )}
      </div>
      <div
        ref={track}
        className="-mx-6 flex snap-x snap-mandatory scroll-px-6 gap-4 overflow-x-auto px-6 pt-1 pb-5 [scrollbar-width:none] md:-mx-[7vw] md:scroll-px-[7vw] md:px-[7vw] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </section>
  );
}
