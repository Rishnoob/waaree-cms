import type { MetadataRoute } from "next";

import { FACILITIES } from "@/features/landing/data/facilities";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8002";

/** sitemap.xml: the homepage, every factory page and every live CMS page (from the API). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let pages: { slug: string; published_at: string }[] = [];
  try {
    const res = await fetch(`${API}/pages/public`, { cache: "no-store" });
    if (res.ok) pages = (await res.json()) as typeof pages;
  } catch {
    /* API down: the static part of the sitemap still works */
  }
  return [
    { url: `${SITE}/`, changeFrequency: "weekly", priority: 1 },
    ...FACILITIES.map((f) => ({ url: `${SITE}/factories/${f.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...pages.map((p) => ({ url: `${SITE}/${p.slug}`, lastModified: new Date(p.published_at + "Z"), changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
