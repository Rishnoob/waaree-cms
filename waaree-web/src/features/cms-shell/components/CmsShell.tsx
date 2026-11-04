"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cmsNav } from "@/features/cms-nav";
import { LandingNav } from "@/features/landing/components/LandingNav";
import { useSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";

import { CommandPalette } from "./CommandPalette";

function isActive(pathname: string, href: string) {
  return href === "/cms" ? pathname === "/cms" || pathname.startsWith("/cms/pages") : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * The CMS lives inside the Waaree website: the site’s own navbar stays on top (“CMS” is one of its
 * items, staff only; your account menu is there too, as on every page of the site). Under it, the
 * CMS sections are plain labelled tabs, with search on the right. Editing a page opens full screen.
 */
export function CmsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [search, setSearch] = useState(false);
  const session = useSession();
  const user = session.status === "authenticated" ? session.user : null;
  const perms = user?.permissions ?? [];
  const visible = cmsNav.filter((i) => !i.permission || perms.includes(i.permission));
  const palette = <CommandPalette items={visible} open={search} onOpenChange={setSearch} />;

  // a page (or custom block) being edited gets the whole screen
  if (/^\/cms\/(pages|ui-kit)\/\d+/.test(pathname))
    return (
      <>
        {palette}
        {children}
      </>
    );

  const ordered = [...visible].sort((a, b) => ["main", "content", "admin", "system"].indexOf(a.group) - ["main", "content", "admin", "system"].indexOf(b.group) || a.order - b.order);

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      {palette}

      <div className="px-4 pt-24 sm:px-6 md:px-[7vw] md:pt-28">
        <div className="flex items-center gap-4 border-b border-border">
          <nav aria-label="CMS" className="-mb-px flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex gap-1">
              {ordered.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 border-b-2 px-3 py-3 text-[0.9375rem] whitespace-nowrap transition-colors focus-visible:shadow-glow focus-visible:outline-none",
                        active ? "border-brand-green font-medium text-foreground" : "border-transparent text-body hover:text-foreground",
                      )}
                    >
                      <item.icon aria-hidden className={cn("size-4", active ? "text-primary" : "text-muted")} strokeWidth={1.75} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <button
            type="button"
            onClick={() => setSearch(true)}
            className="hidden items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-border-strong hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none sm:flex"
          >
            <Search aria-hidden className="size-4" /> Search
            <kbd className="rounded-sm border border-border px-1 text-[0.625rem]">Ctrl K</kbd>
          </button>
        </div>

        <main id="main" className="min-w-0 animate-rise-in pt-8 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
}
