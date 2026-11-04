"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { LandingNav } from "@/features/landing/components/LandingNav";
import { SiteFooter } from "@/features/landing/components/SiteFooter";
import { parseBlocks, RenderBlocks } from "@/features/page-builder";
import { api, unwrap } from "@/lib/api/client";

/**
 * A page published from the CMS, on the public website: the homepage’s navbar and footer, the same
 * type and margins. Shows only the approved live version (never a draft).
 */
export function PublicPage({ slug }: { slug: string }) {
  const q = useQuery({
    queryKey: ["public-page", slug],
    queryFn: async () => unwrap(await api.GET("/pages/public/{slug}", { params: { path: { slug } } })),
    retry: false,
  });

  return (
    <>
      <LandingNav />
      <main className="min-h-[70svh] bg-white px-6 pt-32 pb-24 md:px-[7vw] md:pt-40">
        {q.isLoading ? (
          <div className="max-w-3xl animate-pulse">
            <div className="h-3 w-32 rounded bg-surface-muted" />
            <div className="mt-6 h-12 w-3/4 rounded bg-surface-muted" />
            <div className="mt-8 h-4 w-full rounded bg-surface-muted" />
            <div className="mt-3 h-4 w-5/6 rounded bg-surface-muted" />
          </div>
        ) : !q.data ? (
          <div className="max-w-3xl">
            <p className="text-xs font-medium tracking-[0.25em] text-primary uppercase">404</p>
            <h1 className="mt-4 text-4xl font-light tracking-tight text-foreground sm:text-5xl">This page isn’t here.</h1>
            <Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary-strong hover:underline">
              <ArrowLeft aria-hidden className="size-4" /> Back to the homepage
            </Link>
          </div>
        ) : (
          <article>
            <p className="flex items-center gap-3 text-xs font-medium tracking-[0.25em] text-primary uppercase">
              Waaree
              <span aria-hidden className="h-px w-6 bg-border-strong" />
              <span className="text-muted">{new Date(q.data.published_at + "Z").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
            </p>
            <h1 className="mt-5 max-w-4xl text-4xl leading-[1.08] font-light tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">{q.data.title}</h1>
            {q.data.summary && <p className="mt-6 max-w-3xl text-xl leading-relaxed font-light text-body">{q.data.summary}</p>}
            {q.data.body && (
              <div className="mt-12 border-t border-border pt-12">
                <RenderBlocks blocks={parseBlocks(q.data.body)} />
              </div>
            )}
          </article>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
