"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import { NavigationMenu } from "radix-ui";

import { useSitePublic } from "@/features/site";
import { cn } from "@/lib/utils/cn";

const link =
  "group flex items-center justify-between rounded-md px-3 py-2 text-sm text-foreground/85 transition-colors hover:bg-brand-green/8 hover:text-primary-strong focus-visible:shadow-glow focus-visible:outline-none";

/** Live CMS links placed inside one of Waaree’s built-in sections but in no sub-menu (an extra “More” column). */
export function useSectionLinks(section: string) {
  const site = useSitePublic();
  return (site.data?.menu ?? []).filter((m) => m.section === section && !m.column);
}

/** Live CMS pages placed in a sub-menu (e.g. Company › Group Business), listed after Waaree’s own links there. */
export function ColumnLinks({ section, column, mobile = false }: { section: string; column: string; mobile?: boolean }) {
  const site = useSitePublic();
  const links = (site.data?.menu ?? []).filter((m) => m.section === section && m.column === column);
  return links.map((m) =>
    mobile ? (
      <li key={m.id}>
        <a href={m.href} className="block py-1.5 text-sm text-body hover:text-primary-strong">
          {m.label}
        </a>
      </li>
    ) : (
      <li key={m.id}>
        <NavigationMenu.Link asChild>
          <a href={m.href} className={link}>
            {m.label}
            <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </NavigationMenu.Link>
      </li>
    ),
  );
}

export function SectionColumn({ section }: { section: string }) {
  const links = useSectionLinks(section);
  if (!links.length) return null;
  return (
    <div>
      <p className="mb-3 text-[0.6875rem] font-medium tracking-[0.18em] text-muted uppercase">More</p>
      <ul className="flex flex-col gap-0.5">
        {links.map((m) => (
          <li key={m.id}>
            <NavigationMenu.Link asChild>
              <a href={m.href} className={link}>
                {m.label}
                <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            </NavigationMenu.Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * How many of your own menu items fit on the bar beside Waaree’s five, by screen width. The first
 * ones (in the CMS’s order) get a slot; the rest, and every page not in a menu item, go under
 * “More”. Plain screen-width rules, not measuring, so the bar never jumps or wraps.
 */
export const BAR_SLOTS = [
  { bar: "hidden min-[1440px]:block", more: "min-[1440px]:hidden", from: "wide screens" },
  { bar: "hidden min-[1680px]:block", more: "min-[1680px]:hidden", from: "very wide screens" },
] as const;

const barItem =
  "flex max-w-[11rem] items-center gap-1 rounded-md px-3.5 py-2 text-sm whitespace-nowrap text-foreground/80 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none data-[state=open]:bg-foreground/5 data-[state=open]:text-foreground";

/** Your own menu items on the bar (as many as fit), then “More” with everything else. */
export function SiteLinks() {
  const site = useSitePublic();
  const menu = site.data?.menu ?? [];
  const more = site.data?.more ?? [];
  const tops = menu.filter((m) => !m.section && !m.parent_id);
  const kidsOf = (id: number) => menu.filter((c) => c.parent_id === id);
  // “More” is needed when some top item can’t have a slot, or there are pages outside the menu
  const moreClass = more.length > 0 || tops.length > BAR_SLOTS.length ? "" : tops.length > 0 ? BAR_SLOTS[tops.length - 1]!.more : null;

  return (
    <>
      {tops.slice(0, BAR_SLOTS.length).map((m, i) => {
        const kids = kidsOf(m.id);
        return (
          <NavigationMenu.Item key={m.id} className={BAR_SLOTS[i]!.bar}>
            {kids.length === 0 ? (
              <NavigationMenu.Link asChild>
                <a href={m.href} title={m.label} className={barItem}>
                  <span className="truncate">{m.label}</span>
                </a>
              </NavigationMenu.Link>
            ) : (
              <>
                <NavigationMenu.Trigger title={m.label} className={cn(barItem, "group")}>
                  <span className="truncate">{m.label}</span>
                  <ChevronDown aria-hidden className="size-3.5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="w-72 p-4">
                  <ul className="flex flex-col gap-0.5">
                    {kids.map((k) => (
                      <li key={k.id}>
                        <NavigationMenu.Link asChild>
                          <a href={k.href} className={link}>
                            {k.label}
                            <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                          </a>
                        </NavigationMenu.Link>
                      </li>
                    ))}
                  </ul>
                </NavigationMenu.Content>
              </>
            )}
          </NavigationMenu.Item>
        );
      })}

      {moreClass !== null && (
        <NavigationMenu.Item className={moreClass}>
          <NavigationMenu.Trigger className={cn(barItem, "group")}>
            More
            <ChevronDown aria-hidden className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="max-h-[70vh] w-[22rem] overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              {tops.map((m, i) => {
                const kids = kidsOf(m.id);
                const hide = BAR_SLOTS[i]?.more; // already on the bar at this width
                return kids.length === 0 ? (
                  <NavigationMenu.Link key={m.id} asChild>
                    <a href={m.href} className={cn(link, hide)}>
                      {m.label}
                      <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </NavigationMenu.Link>
                ) : (
                  <div key={m.id} className={hide}>
                    <p className="mb-1.5 px-3 text-[0.6875rem] font-medium tracking-[0.18em] text-muted uppercase">{m.label}</p>
                    <ul className="flex flex-col gap-0.5">
                      {kids.map((k) => (
                        <li key={k.id}>
                          <NavigationMenu.Link asChild>
                            <a href={k.href} className={link}>
                              {k.label}
                              <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                            </a>
                          </NavigationMenu.Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {more.length > 0 && (
                <div>
                  {tops.length > 0 && <p className="mb-1.5 px-3 text-[0.6875rem] font-medium tracking-[0.18em] text-muted uppercase">Other pages</p>}
                  <ul className="flex flex-col gap-0.5">
                    {more.map((m) => (
                      <li key={m.href}>
                        <NavigationMenu.Link asChild>
                          <a href={m.href} className={link}>
                            {m.label}
                            <ArrowUpRight aria-hidden className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                          </a>
                        </NavigationMenu.Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      )}
    </>
  );
}

/** Phones: the CMS links in a simple list under the built-in sections. */
export function MobileSiteLinks({ onNavigate }: { onNavigate: () => void }) {
  const site = useSitePublic();
  const menu = (site.data?.menu ?? []).filter((m) => !m.column); // sub-menu pages show inside their section above
  const more = site.data?.more ?? [];
  if (!menu.length && !more.length) return null;
  return (
    <ul className="flex flex-col border-t border-border pt-2">
      {more.map((m) => (
        <li key={m.href}>
          <a href={m.href} onClick={onNavigate} className="block rounded-md px-3 py-2.5 text-sm text-foreground/85 hover:bg-brand-green/8">
            More · {m.label}
          </a>
        </li>
      ))}
      {menu.map((m) => (
        <li key={m.id}>
          <a href={m.href} onClick={onNavigate} className="block rounded-md px-3 py-2.5 text-sm text-foreground/85 hover:bg-brand-green/8">
            {m.section ? `${m.section} · ` : ""}
            {m.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** The announcement line set in CMS → Settings (hidden when empty). */
export function Announcement() {
  const site = useSitePublic();
  const text = site.data?.settings.announcement;
  if (!text) return null;
  return <p className="mb-2 rounded-md bg-(image:--brand-gradient) px-4 py-1.5 text-center text-xs font-medium text-white shadow-soft">{text}</p>;
}
