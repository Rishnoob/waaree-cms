import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FacilityPage } from "@/features/landing/components/FacilityPage";
import { FACILITIES, facilityBySlug } from "@/features/landing/data/facilities";

// Every site is known at build time (pre-rendered); an unknown slug hits notFound() → 404.
export function generateStaticParams() {
  return FACILITIES.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: PageProps<"/factories/[slug]">): Promise<Metadata> {
  const f = facilityBySlug((await params).slug);
  if (!f) return {};
  return {
    title: `${f.short} · Waaree factories`,
    description: f.headline,
    openGraph: f.image ? { images: [f.image] } : undefined,
  };
}

export default async function FactoryPage({ params }: PageProps<"/factories/[slug]">) {
  const f = facilityBySlug((await params).slug);
  if (!f) notFound();
  return <FacilityPage f={f} />;
}
