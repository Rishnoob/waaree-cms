"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "radix-ui";
import { useEffect } from "react";

import { cn } from "@/lib/utils/cn";
import { getSession, refreshSession, useSession } from "@/lib/auth/session";

/**
 * “CMS” in the website’s main menu, shown only to signed-in staff with CMS access. Visitors never
 * see it: on load we quietly check the httpOnly session cookie; no session, no item. (The API
 * enforces access anyway.)
 */
export function AdminLink() {
  const session = useSession();
  const pathname = usePathname();
  useEffect(() => {
    if (getSession().status === "unknown") void refreshSession();
  }, []);
  if (session.status !== "authenticated" || session.user.permissions.length === 0) return null;
  const active = pathname.startsWith("/cms");
  return (
    <NavigationMenu.Item>
      <NavigationMenu.Link asChild active={active}>
        <Link
          href="/cms"
          className={cn(
            "relative flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:shadow-glow focus-visible:outline-none",
            active ? "bg-foreground/5 font-medium text-foreground" : "text-foreground/80",
          )}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-(image:--brand-gradient)" />
          CMS
        </Link>
      </NavigationMenu.Link>
    </NavigationMenu.Item>
  );
}
