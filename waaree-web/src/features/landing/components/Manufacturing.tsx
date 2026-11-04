"use client";

import { Play } from "lucide-react";
import Image from "next/image";

import { FILMS } from "../data/films";
import { MANUFACTURING } from "../data/home";
import { Chapter, Glow } from "./Chapter";
import { FilmCard, openFilm } from "./FilmPlayer";
import { Row } from "./ProgressRow";

/** Films (Act II): the brand film, a row of Waaree’s films (each loads only on play, in the page’s one player), then the innovations behind every module. */
export function Manufacturing() {
  const { film } = MANUFACTURING;

  return (
    <Chapter
      id="manufacturing"
      tone="light"
      eyebrow="Films · Manufacturing excellence"
      title={
        <>
          Don’t take our word for it. <br className="hidden sm:block" />
          <Glow>See Waaree at work.</Glow>
        </>
      }
      intro="Films from Waaree’s own channel: the lines, the labs, the US plant, the projects and the people. Then the details built into every module."
    >
      <button
        type="button"
        data-reveal
        onClick={() => openFilm(FILMS[0]!)}
        aria-label={`Play: ${FILMS[0]!.title}`}
        className="group relative block aspect-[16/9] w-full overflow-hidden rounded-2xl text-left focus-visible:shadow-glow focus-visible:outline-none md:aspect-auto md:h-[min(56svh,40rem)]"
      >
        <Image src={film.poster} alt="" fill sizes="100vw" className="object-cover transition-transform duration-[1.6s] group-hover:scale-[1.03]" />
        <span aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgb(8_30_22/0.65)_0%,rgb(8_30_22/0.05)_60%)]" />
        <span className="absolute bottom-8 left-8 flex items-center gap-5 md:bottom-12 md:left-12">
          <span className="relative flex size-16 items-center justify-center rounded-full bg-white text-[#050c18] shadow-[0_0_0_10px_rgb(255_255_255/0.15)] transition-transform duration-500 group-hover:scale-110 md:size-20">
            <Play aria-hidden className="ml-1 size-7 fill-current" />
          </span>
          <span>
            <span className="block text-xs tracking-[0.2em] text-white/70 uppercase">Brand film · {FILMS[0]!.length}</span>
            <span className="block text-2xl font-light text-white md:text-4xl">{FILMS[0]!.title}</span>
          </span>
        </span>
      </button>

      <Row title="More from Waaree" note={`${FILMS.length - 1} films`} className="mt-10">
        {FILMS.slice(1).map((f) => (
          <FilmCard key={f.id} film={f} />
        ))}
      </Row>

      <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {MANUFACTURING.innovations.map((n, i) => (
          <li key={n.title} data-reveal className="bg-white p-7">
            <span className="text-xs text-muted tabular-nums">0{i + 1}</span>
            <h3 className="mt-6 text-lg font-medium text-foreground">{n.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-body">{n.text}</p>
          </li>
        ))}
      </ol>
    </Chapter>
  );
}
