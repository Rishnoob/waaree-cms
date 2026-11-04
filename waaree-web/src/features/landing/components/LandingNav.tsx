"use client";

import { ArrowUpRight, ChevronDown, Factory, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { NavigationMenu } from "radix-ui";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { AccountMenu, MobileAccount } from "@/features/auth";
import { cn } from "@/lib/utils/cn";

import { NAV } from "../data/home";
import { AdminLink } from "./AdminLink";
import { Announcement, ColumnLinks, MobileSiteLinks, SectionColumn, SiteLinks } from "./SiteLinks";
import { waareeUrl } from "./Chapter";

/** Featured tile shown inside every mega-menu panel: the factories map is the new front door. */
function FeaturedTile() {
  const onHome = usePathname() === "/";
  const home = (hash: string) => (onHome ? hash : `/${hash}`);
  return (
    <a
      href={home("#factories-map")}
      className="group relative flex min-h-56 flex-col justify-end overflow-hidden rounded-lg p-5 text-white focus-visible:shadow-glow focus-visible:outline-none"
    >
      <Image src="/waaree/factories/tumb.webp" alt="" fill sizes="280px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,transparent_20%,rgb(5_12_24/0.85)_100%)]" />
      <span className="relative flex items-center gap-2 text-xs tracking-[0.2em] text-white/75 uppercase">
        <Factory aria-hidden className="size-3.5" /> New
      </span>
      <span className="relative mt-1 text-lg leading-snug font-medium">Explore our factories on the map</span>
    </a>
  );
}

/** Floating glass navigation (spans the content width, logo aligned with the page’s left edge) with Waaree’s full mega menu (Radix Navigation Menu: accessible, hover-intent). */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const home = (hash: string) => (pathname === "/" ? hash : `/${hash}`);

  return (
    <header className="fixed inset-x-0 top-3 z-50 flex flex-col items-center px-3 md:top-4 md:px-[calc(7vw-1.25rem)]">
      <div className="w-full"><Announcement /></div>
      <NavigationMenu.Root
        aria-label="Main"
        delayDuration={80}
        className="relative w-full rounded-lg border border-white/50 bg-white/80 shadow-[0_10px_40px_-14px_rgb(5_12_24/0.45)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3 py-2 pr-2 pl-5">
          <Link href="/" aria-label="Waaree home" className="shrink-0 rounded-md focus-visible:shadow-glow focus-visible:outline-none">
            <Image src="/brand/waaree-logo.webp" alt="Waaree" width={110} height={35} priority className="h-auto w-[6.25rem]" />
          </Link>

          <NavigationMenu.List className="hidden items-center gap-0.5 lg:flex">
            {NAV.map((item) => (
              <NavigationMenu.Item key={item.label}>
                <NavigationMenu.Trigger className="group flex items-center gap-1 rounded-md px-3.5 py-2 text-sm whitespace-nowrap text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none data-[state=open]:bg-foreground/5 data-[state=open]:text-foreground">
                  {item.label}
                  <ChevronDown aria-hidden className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="flex w-max max-w-[64rem] gap-6 p-6 [&>div]:w-52">
                  {item.columns.map((col) => (
                    <div key={col.title}>
                      <p className="mb-3 text-[0.6875rem] font-medium tracking-[0.18em] text-muted uppercase">{col.title}</p>
                      <ul className="flex flex-col gap-0.5">
                        {col.links.map(([label, href]) => (
                          <li key={href + label}>
                            <NavigationMenu.Link asChild>
                              <a
                                href={waareeUrl(href)}
                                className="group flex items-center justify-between rounded-md px-3 py-2 text-sm text-foreground/85 transition-colors hover:bg-brand-green/8 hover:text-primary-strong focus-visible:shadow-glow focus-visible:outline-none"
                              >
                                {label}
                                <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                              </a>
                            </NavigationMenu.Link>
                          </li>
                        ))}
                        <ColumnLinks section={item.label} column={col.title} />
                      </ul>
                    </div>
                  ))}
                  <SectionColumn section={item.label} />
                  <div className="!w-[17rem] shrink-0">
                    <FeaturedTile />
                  </div>
                </NavigationMenu.Content>
              </NavigationMenu.Item>
            ))}
            <NavigationMenu.Item>
              <NavigationMenu.Link asChild>
                <a href={home("#factories-map")} className="rounded-md px-3.5 py-2 text-sm whitespace-nowrap text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none">
                  Factories
                </a>
              </NavigationMenu.Link>
            </NavigationMenu.Item>
            <SiteLinks />
            <AdminLink />
          </NavigationMenu.List>

          <div className="flex items-center gap-1.5">
            <AccountMenu />
            <Button asChild size="sm" arrow className="hidden sm:inline-flex lg:hidden xl:inline-flex">
              <a href={home("#contact")}>Get in touch</a>
            </Button>
            <IconButton label={open ? "Close menu" : "Open menu"} variant="secondary" className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? <X aria-hidden /> : <Menu aria-hidden />}
            </IconButton>
          </div>
        </div>

        {/* Desktop mega-menu panel */}
        <div className="absolute top-full left-1/2 mt-3 -translate-x-1/2">
          <NavigationMenu.Viewport className="origin-top overflow-hidden rounded-xl border border-white/60 bg-white/95 shadow-[0_24px_64px_-20px_rgb(5_12_24/0.45)] backdrop-blur-xl data-[state=open]:animate-dialog-in" />
        </div>

        {/* Phones & tablets */}
        {open && (
          <div className="animate-dialog-in absolute inset-x-0 top-full mt-2 max-h-[75svh] overflow-y-auto rounded-xl border border-white/60 bg-white/95 p-5 shadow-lg backdrop-blur-xl lg:hidden">
            <a href={home("#factories-map")} onClick={() => setOpen(false)} className="mb-3 flex items-center gap-2 rounded-md bg-(image:--brand-tint) px-4 py-3 font-medium text-foreground">
              <Factory aria-hidden className="size-4 text-primary" /> Explore our factories
            </a>
            {NAV.map((item) => (
              <details key={item.label} className="group border-b border-border last:border-none">
                <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 font-medium text-foreground">
                  {item.label}
                  <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="grid gap-4 pb-4 sm:grid-cols-2">
                  {item.columns.map((col) => (
                    <ul key={col.title} className="flex flex-col gap-1">
                      <li className="text-[0.6875rem] tracking-[0.18em] text-muted uppercase">{col.title}</li>
                      {col.links.map(([label, href]) => (
                        <li key={href + label}>
                          <a href={waareeUrl(href)} className="block py-1.5 text-sm text-body hover:text-primary-strong">
                            {label}
                          </a>
                        </li>
                      ))}
                      <ColumnLinks section={item.label} column={col.title} mobile />
                    </ul>
                  ))}
                </div>
              </details>
            ))}
            <MobileSiteLinks onNavigate={() => setOpen(false)} />
            <MobileAccount onNavigate={() => setOpen(false)} />
            <Button asChild arrow className={cn("mt-4 w-full")}>
              <a href={home("#contact")} onClick={() => setOpen(false)}>
                Get in touch
              </a>
            </Button>
          </div>
        )}
      </NavigationMenu.Root>
    </header>
  );
}
