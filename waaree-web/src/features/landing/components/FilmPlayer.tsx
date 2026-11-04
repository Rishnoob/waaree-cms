"use client";

import { Play, X } from "lucide-react";
import { Dialog as RDialog } from "radix-ui";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

import { embed, type Film, thumb } from "../data/films";

/*
 * One film player for the whole page: any FilmCard calls `openFilm`, the single <FilmPlayer />
 * (mounted once in LandingPage) shows it. The YouTube player loads only when a film is opened.
 */
const listeners = new Set<(f: Film | null) => void>();
export const openFilm = (f: Film) => listeners.forEach((l) => l(f));

export function FilmPlayer() {
  const [film, setFilm] = useState<Film | null>(null);
  useEffect(() => {
    listeners.add(setFilm);
    return () => void listeners.delete(setFilm);
  }, []);
  return (
    <RDialog.Root open={!!film} onOpenChange={(o) => !o && setFilm(null)}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-[60] animate-fade-in bg-[#050c18]/85 backdrop-blur-xl" />
        <RDialog.Content className="fixed top-1/2 left-1/2 z-[60] w-[min(92vw,80rem)] -translate-x-1/2 -translate-y-1/2 animate-dialog-in focus:outline-none">
          <RDialog.Title className="mb-3 text-lg font-light text-white">{film?.title}</RDialog.Title>
          <RDialog.Description className="sr-only">Video player. Press Escape to close.</RDialog.Description>
          <div className="relative aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
            {film && <iframe src={embed(film)} title={film.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="absolute inset-0 size-full" />}
          </div>
          <RDialog.Close className="absolute -top-1 right-0 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10 focus-visible:shadow-glow focus-visible:outline-none">
            <X aria-hidden className="size-4" /> Close
          </RDialog.Close>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/** A film as a card: its thumbnail, kind and length; plays in the page’s player. */
export function FilmCard({ film, className, size = "md" }: { film: Film; className?: string; size?: "md" | "lg" }) {
  return (
    <button
      type="button"
      onClick={() => openFilm(film)}
      aria-label={`Play: ${film.title}`}
      className={cn(
        "group relative block shrink-0 snap-start overflow-hidden rounded-xl bg-[#0b1a2a] text-left shadow-[0_18px_40px_-24px_rgb(5_12_24/0.6)] transition-transform duration-500 hover:-translate-y-1 focus-visible:shadow-glow focus-visible:outline-none",
        size === "lg" ? "aspect-video w-[min(84vw,40rem)]" : "aspect-video w-[min(72vw,19rem)]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube’s own thumbnail; lazy */}
      <img src={thumb(film.id)} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(5_12_24/0)_35%,rgb(5_12_24/0.85)_100%)]" />
      <span className="absolute top-3 right-3 rounded-full bg-black/55 px-2 py-0.5 text-[0.6875rem] text-white tabular-nums backdrop-blur">{film.length}</span>
      <span className="absolute inset-x-4 bottom-3.5 flex items-end gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[#050c18] transition-transform duration-500 group-hover:scale-110">
          <Play aria-hidden className="ml-0.5 size-4 fill-current" />
        </span>
        <span className="min-w-0">
          <span className="block text-[0.625rem] tracking-[0.18em] text-white/70 uppercase">{film.kind}</span>
          <span className={cn("block truncate font-medium text-white", size === "lg" ? "text-xl" : "text-sm")}>{film.title}</span>
        </span>
      </span>
    </button>
  );
}
