"use client";

import { ArrowUpRight, Menu, Play, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { AccountMenu } from "@/features/auth";
import { cn } from "@/lib/utils/cn";

import { ACTS, actOf, CHAPTERS } from "../chapters";
import { waareeUrl } from "./Chapter";

/** Each act’s first and last chapter, for jumps and its progress bar. */
const ACT_SPANS = ACTS.map((a) => {
  const ids = CHAPTERS.filter((c) => c.act === a.id).map((c) => c.id);
  return { ...a, first: ids[0]!, last: ids[ids.length - 1]! };
});

/**
 * The story bar: this page is “The Story of Waaree”, not waaree.com’s homepage, so its header is a
 * guide, not a site menu. It says where you are (act and chapter), shows the five acts as a
 * progress bar that fills as you scroll (click one to jump), and keeps one action: get in touch.
 * Progress is written straight to the DOM on scroll (no re-render per frame).
 */
export function StoryNav() {
  const [chapter, setChapter] = useState("story");
  const [open, setOpen] = useState(false);
  const fills = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    // where each chapter starts on the page, measured once (and again when the page resizes), so
    // scrolling only does arithmetic: no layout reads per frame
    let starts: number[] = [];
    let end = 0;
    const layout = () => {
      starts = CHAPTERS.map((c) => {
        const el = document.getElementById(c.id);
        return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
      });
      end = document.documentElement.scrollHeight - window.innerHeight * 0.55;
    };
    const measure = () => {
      raf = 0;
      const mid = window.innerHeight * 0.45;
      const y = window.scrollY + mid;
      let cur = 0;
      starts.forEach((t, i) => t < y && (cur = i));
      setChapter((prev) => (prev === CHAPTERS[cur]!.id ? prev : CHAPTERS[cur]!.id));
      // each act fills from its first chapter’s top to the next act’s first chapter
      ACT_SPANS.forEach((a, k) => {
        const el = fills.current[k];
        const from = starts[CHAPTERS.findIndex((c) => c.id === a.first)]!;
        const next = ACT_SPANS[k + 1];
        const to = next ? starts[CHAPTERS.findIndex((c) => c.id === next.first)]! : end + mid;
        if (!el || !Number.isFinite(from)) return;
        const f = Math.min(1, Math.max(0, (y - from) / Math.max(1, to - from)));
        const v = `scaleX(${f.toFixed(3)})`;
        if (el.style.transform !== v) el.style.transform = v;
      });
    };
    const onScroll = () => (raf ||= requestAnimationFrame(measure));
    const onResize = () => {
      layout();
      onScroll();
    };
    layout();
    measure();
    const ro = new ResizeObserver(onResize);
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const act = actOf(chapter);
  const label = CHAPTERS.find((c) => c.id === chapter)?.label;

  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 md:top-4 md:px-[calc(7vw-1.25rem)]">
      {/* no box: a soft white fade at the top edge keeps the bar readable over anything that scrolls under it
          (on phones the top of it is solid, as content runs right under the logo) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-4 h-28 bg-[linear-gradient(180deg,rgb(255_255_255/0.92)_0%,rgb(255_255_255/0.7)_45%,rgb(255_255_255/0)_100%)] max-md:h-[6.5rem] max-md:bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_68%,rgb(255_255_255/0)_100%)]" />
      <div
        className={cn(
          // transparent all the way down, as at the top: the story shows through
          "relative flex items-center gap-4 rounded-2xl py-2 pr-2 pl-4",
        )}
      >
        {/* who and where */}
        <a href="#story" className="flex shrink-0 items-center gap-3 rounded-md focus-visible:shadow-glow focus-visible:outline-none" aria-label="The Story of Waaree, back to the start">
          <Image src="/brand/waaree-logo.webp" alt="Waaree" width={110} height={35} priority className="h-auto w-[5.5rem]" />
          <span aria-hidden className="h-7 w-px bg-foreground/15 max-sm:hidden" />
          <span className="flex flex-col leading-tight max-sm:hidden">
            <span className="text-[0.625rem] font-medium tracking-[0.22em] text-muted uppercase">The Story of Waaree</span>
            <span key={chapter} className="animate-rise-in text-[0.8125rem] font-medium text-foreground">
              {act && <span className="text-primary-strong">Act {act.n}</span>} <span className="text-foreground/40">·</span> {label}
            </span>
          </span>
        </a>

        {/* the five acts: where the story is, and a jump to any of them */}
        <nav aria-label="Acts" className="mx-auto hidden flex-1 lg:block">
          <ol className="flex max-w-3xl gap-1.5">
            {ACT_SPANS.map((a, k) => {
              const on = act?.id === a.id;
              const done = act ? k < ACTS.findIndex((x) => x.id === act.id) : false;
              return (
                <li key={a.id} className="min-w-0 flex-1">
                  <a
                    href={`#${a.first}`}
                    aria-current={on ? "step" : undefined}
                    className="group block rounded-md px-1.5 pt-1 pb-1.5 focus-visible:shadow-glow focus-visible:outline-none"
                  >
                    <span className={cn("block truncate text-[0.6875rem] whitespace-nowrap transition-colors", on ? "font-medium text-foreground" : "text-foreground/55 group-hover:text-foreground")}>
                      <span className="tabular-nums">{["I", "II", "III", "IV", "V"][k]}</span> {a.label}
                    </span>
                    {/* the act you are in: its whole underline lit in brand colour, filling brighter as you go;
                        acts behind you: a soft full bar; acts ahead: grey */}
                    <span
                      className={cn(
                        "mt-1.5 block h-[3px] overflow-hidden rounded-full transition-[background-color,box-shadow] duration-500",
                        on ? "bg-brand-green/30 shadow-[0_0_10px_rgb(13_176_43/0.45)]" : done ? "bg-brand-green/25" : "bg-foreground/10",
                      )}
                    >
                      <span
                        ref={(el) => {
                          fills.current[k] = el;
                        }}
                        className={cn("block h-full origin-left scale-x-0 rounded-full bg-(image:--brand-gradient) transition-opacity duration-500", on ? "opacity-100" : "opacity-0")}
                      />
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <a
            href="#manufacturing"
            className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none md:flex"
          >
            <Play aria-hidden className="size-3.5 fill-current" /> Films
          </a>
          <AccountMenu />
          <Button asChild size="sm" arrow className="max-sm:hidden">
            <a href="#contact">Get in touch</a>
          </Button>
          <IconButton label={open ? "Close chapters" : "All chapters"} variant="secondary" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </IconButton>
        </div>

        {/* every chapter, by act */}
        {open && (
          <div className="absolute inset-x-0 top-full mt-2 max-h-[78svh] animate-dialog-in overflow-y-auto rounded-2xl border border-white/60 bg-white/95 p-5 shadow-lg backdrop-blur-xl md:p-7">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {ACT_SPANS.map((a, k) => (
                <div key={a.id}>
                  <p className="text-[0.625rem] font-medium tracking-[0.22em] text-primary uppercase">Act {["I", "II", "III", "IV", "V"][k]}</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{a.label}</p>
                  <ul className="mt-2 flex flex-col">
                    {CHAPTERS.filter((c) => c.act === a.id).map((c) => (
                      <li key={c.id}>
                        <a
                          href={`#${c.id}`}
                          onClick={() => setOpen(false)}
                          className={cn("block rounded-md py-1.5 text-sm transition-colors hover:text-primary-strong", c.id === chapter ? "font-medium text-foreground" : "text-body")}
                        >
                          {c.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <a href={waareeUrl("/")} className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
              Visit waaree.com <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
