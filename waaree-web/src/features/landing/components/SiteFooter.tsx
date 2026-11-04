import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";

import { StaffSignIn } from "@/features/auth";

import { FOOTER } from "../data/home";
import { waareeUrl } from "./Chapter";
import { CookieConsent } from "./CookieConsent";

/** Site footer: Waaree’s full sitemap, HQ contact, legal links, and a quiet link to the CMS. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[linear-gradient(180deg,#ffffff_0%,#f3f8f5_100%)] px-6 pt-20 pb-10 text-body md:px-[7vw]">
      <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <Image src="/brand/waaree-logo.webp" alt="Waaree, One with the Sun" width={150} height={48} className="h-auto w-36" />
          <p className="mt-8 flex gap-3 text-sm leading-relaxed">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" /> {FOOTER.address}
          </p>
          <p className="mt-3 flex items-center gap-3 text-sm">
            <Phone aria-hidden className="size-4 text-primary" /> <a href={`tel:${FOOTER.phone.replace(/\s/g, "")}`} className="hover:text-foreground">{FOOTER.phone}</a>
          </p>
          <p className="mt-3 flex items-center gap-3 text-sm">
            <Mail aria-hidden className="size-4 text-primary" /> <a href={`mailto:${FOOTER.email}`} className="hover:text-foreground">{FOOTER.email}</a>
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {FOOTER.columns.map((c) => (
            <div key={c.title}>
              <p className="mb-4 text-[0.6875rem] tracking-[0.2em] text-muted uppercase">{c.title}</p>
              <ul className="flex flex-col gap-2.5">
                {c.links.map(([label, href]) => (
                  <li key={label}>
                    <a href={waareeUrl(href)} className="text-sm transition-colors hover:text-foreground">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-xs text-muted md:flex-row md:items-center md:justify-between">
        <p>© Waaree Energies Limited. Concept homepage · facts as published on waaree.com.</p>
        <p className="flex flex-wrap gap-5">
          {FOOTER.legal.map(([label, href]) => (
            <a key={label} href={waareeUrl(href)} className="hover:text-foreground">
              {label}
            </a>
          ))}
          <StaffSignIn />
        </p>
      </div>
      <CookieConsent />
    </footer>
  );
}
