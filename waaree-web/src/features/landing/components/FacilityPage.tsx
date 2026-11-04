import { ArrowLeft, ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ViewTransition } from "react";

import { cn } from "@/lib/utils/cn";

import { type Facility, FACILITIES } from "../data/facilities";
import { INDIA_DOTS, INDIA_OUTLINE, INDIA_VIEWBOX, projectIndia } from "../data/india-map";
import { KindIcon, statusLabel } from "./facility-ui";
import { twinMode } from "../data/twin";
import { FactoryTwin } from "./FactoryTwin";
import { LandingNav } from "./LandingNav";
import { Polish } from "./Polish";
import { SiteFooter } from "./SiteFooter";

/** Static dotted India with one site glowing (no interactivity needed here). */
function MiniMap({ f }: { f: Facility }) {
  const p = projectIndia(f.lon, f.lat);
  const color = f.kind === "development" ? "#e8930c" : f.kind === "office" ? "#28a9e2" : "#1fa463";
  return (
    <svg viewBox={`0 0 ${INDIA_VIEWBOX.width} ${INDIA_VIEWBOX.height}`} role="img" aria-label={`Map of India showing ${f.short}`} className="h-auto w-full">
      <path d={INDIA_OUTLINE} fill="none" stroke="rgb(15 40 30 / 0.12)" strokeWidth={1.5} />
      <g fill="rgb(15 40 30 / 0.16)">
        {Array.from({ length: INDIA_DOTS.length / 2 }, (_, i) => (
          <circle key={i} cx={INDIA_DOTS[i * 2]} cy={INDIA_DOTS[i * 2 + 1]} r={3.1} />
        ))}
      </g>
      <circle cx={p.x} cy={p.y} r={34} fill={color} opacity={0.12} />
      <circle cx={p.x} cy={p.y} r={18} fill={color} opacity={0.25} />
      <circle cx={p.x} cy={p.y} r={9} fill={color} />
    </svg>
  );
}

/** A Waaree site’s own page: cinematic hero, story, facts, location and source. */
export function FacilityPage({ f }: { f: Facility }) {
  const i = FACILITIES.findIndex((x) => x.slug === f.slug);
  const prev = FACILITIES[(i - 1 + FACILITIES.length) % FACILITIES.length]!;
  const next = FACILITIES[(i + 1) % FACILITIES.length]!;
  const mode = twinMode(f);
  const accent = f.kind === "development" ? "text-[#b86e00]" : f.kind === "office" ? "text-brand-blue" : "text-primary";

  return (
    <>
      <LandingNav />
      <Polish />
      <ViewTransition enter="page-in" exit="page-out" default="none">
      <main className="bg-white text-body">
        {/* Hero */}
        <section className="relative px-6 pt-32 md:px-[7vw]">
          <div className="max-w-4xl animate-rise-in">
            <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted">
              <Link href="/#factories-map" className="inline-flex items-center gap-2 rounded-sm hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none">
                <ArrowLeft aria-hidden className="size-4" /> All factories
              </Link>
            </nav>
            <p className={cn("flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase", accent)}>
              <KindIcon f={f} className="size-4" /> {statusLabel(f)} · {f.region}, {f.country}
            </p>
            <h1 className="mt-5 text-4xl leading-[1.05] font-light tracking-tight text-foreground sm:text-6xl lg:text-7xl">{f.name}</h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed font-light text-body">{f.headline}</p>
          </div>
          {f.image && (
            <ViewTransition name={`site-image-${f.slug}`} share="morph" default="none">
              <div className="relative mt-12 aspect-[16/9] overflow-hidden rounded-lg border border-border md:aspect-[21/9]">
                <Image src={f.image} alt={f.imageAlt ?? ""} fill priority sizes="100vw" className="object-cover" />
              </div>
            </ViewTransition>
          )}
        </section>

        {/* Story + facts */}
        <section className="px-6 py-20 md:px-[7vw] md:py-28">
          <div className="grid gap-16 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-6">
              {f.story.map((para) => (
                <p key={para} className="text-2xl leading-relaxed font-light text-foreground/85">
                  {para}
                </p>
              ))}
              {f.address && (
                <p className="mt-6 flex gap-3 text-sm leading-relaxed text-muted">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" /> {f.address}
                </p>
              )}
            </div>
            <dl className="grid content-start gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-1">
              {f.facts.map((fact) => (
                <div key={fact.label} className="bg-white p-6">
                  <dt className="text-xs tracking-[0.15em] text-muted uppercase">{fact.label}</dt>
                  <dd className="mt-2 text-2xl font-light text-foreground">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {mode && <FactoryTwin f={f} mode={mode} />}

        {/* Location */}
        {f.country === "India" && (
          <section className="border-t border-border bg-(image:--brand-tint) px-6 py-20 md:px-[7vw] md:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_24rem]">
              <div>
                <p className="text-xs tracking-[0.2em] text-primary uppercase">On the map</p>
                <p className="mt-4 text-3xl leading-tight font-light text-foreground sm:text-4xl">
                  {f.short} is one of {FACILITIES.filter((x) => x.country === "India").length} Waaree sites across India.
                </p>
                <Link href="/#factories-map" className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-white transition-transform hover:translate-x-1 focus-visible:shadow-glow focus-visible:outline-none">
                  Explore every factory <ArrowRight aria-hidden className="size-4" />
                </Link>
              </div>
              <div className="mx-auto w-full max-w-sm">
                <MiniMap f={f} />
              </div>
            </div>
          </section>
        )}

        {/* Source + next */}
        <section className="border-t border-border px-6 py-12 md:px-[7vw]">
          <p className="text-xs text-muted">
            Source:{" "}
            <a href={f.source.url} className="inline-flex items-center gap-1 underline decoration-border-strong underline-offset-4 hover:text-foreground">
              {f.source.label}
              <ArrowUpRight aria-hidden className="size-3" />
            </a>
            {f.source.date && <> · {f.source.date}</>}
          </p>
          <nav aria-label="More sites" className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              { site: prev, label: "Previous site", Icon: ArrowLeft },
              { site: next, label: "Next site", Icon: ArrowRight },
            ].map(({ site, label, Icon }) => (
              <Link
                key={label}
                href={`/factories/${site.slug}`}
                className={cn(
                  "group flex flex-col rounded-lg border border-border bg-white p-6 transition-colors hover:border-primary/40 focus-visible:shadow-glow focus-visible:outline-none",
                  label === "Next site" && "sm:items-end sm:text-right",
                )}
              >
                <span className="flex items-center gap-2 text-xs tracking-[0.15em] text-muted uppercase">
                  {label === "Previous site" && <Icon aria-hidden className="size-3.5" />} {label}
                  {label === "Next site" && <Icon aria-hidden className="size-3.5" />}
                </span>
                <span className="mt-2 text-xl font-light text-foreground">{site.short}</span>
              </Link>
            ))}
          </nav>
        </section>
      </main>
      </ViewTransition>
      <SiteFooter />
    </>
  );
}
