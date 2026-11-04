"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Menu } from "@/components/ui/menu";
import { getSession, refreshSession, useSession } from "@/lib/auth/session";

import { logout } from "../api";

export function initials(name: string) {
  return name
    .replace(/[^\p{L}\s]/gu, "") // letters only: "Editor (test)" → "ET"
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/** Sign out from anywhere on the website. Inside the CMS you land on the sign-in page; elsewhere you stay put. */
export function useSignOut() {
  const router = useRouter();
  const pathname = usePathname();
  return async () => {
    await logout();
    if (pathname.startsWith("/cms")) router.replace("/login");
    else router.refresh();
  };
}

/**
 * The signed-in person, in the website’s navbar on every page (the site and the CMS alike): their
 * initials, and a menu with “Open the CMS” and “Log out”. Visitors who aren’t signed in see nothing.
 */
export function AccountMenu() {
  const session = useSession();
  const signOut = useSignOut();
  const router = useRouter();
  useEffect(() => {
    if (getSession().status === "unknown") void refreshSession(); // quietly restore a session from its cookie
  }, []);
  if (session.status !== "authenticated") return null;
  const { user } = session;
  return (
    <Menu
      trigger={
        <button
          type="button"
          aria-label={`Signed in as ${user.full_name}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(image:--brand-gradient) text-[0.6875rem] font-semibold text-white shadow-soft transition-transform hover:scale-105 focus-visible:shadow-glow focus-visible:outline-none"
        >
          {initials(user.full_name)}
        </button>
      }
      items={[
        ...(user.permissions.length ? [{ label: "Open the CMS", hint: `${user.full_name} · ${user.roles.map((r) => r.name).join(", ")}`, icon: LayoutDashboard, onSelect: () => router.push("/cms") }] : []),
        { label: "Log out", hint: user.permissions.length ? undefined : user.email, icon: LogOut, onSelect: () => void signOut() },
      ]}
    />
  );
}

/** Footer: “Staff sign in” for visitors; “Log out” once signed in. */
export function StaffSignIn() {
  const session = useSession();
  const signOut = useSignOut();
  const pathname = usePathname();
  if (session.status === "authenticated")
    return (
      <button type="button" onClick={() => void signOut()} className="hover:text-foreground">
        Log out ({session.user.full_name})
      </button>
    );
  return (
    <Link href={`/login?next=${encodeURIComponent(pathname === "/" ? "/cms" : pathname)}`} className="hover:text-foreground">
      Staff sign in
    </Link>
  );
}

/** Phones: the same account links, at the foot of the menu panel. */
export function MobileAccount({ onNavigate }: { onNavigate: () => void }) {
  const session = useSession();
  const signOut = useSignOut();
  if (session.status !== "authenticated") return null;
  return (
    <div className="mt-3 flex items-center gap-3 border-t border-border pt-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(image:--brand-gradient) text-[0.6875rem] font-semibold text-white">{initials(session.user.full_name)}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{session.user.full_name}</span>
      {session.user.permissions.length > 0 && (
        <Link href="/cms" onClick={onNavigate} className="text-sm font-medium text-primary-strong">
          Open the CMS
        </Link>
      )}
      <button
        type="button"
        onClick={() => {
          onNavigate();
          void signOut();
        }}
        className="text-sm text-body"
      >
        Log out
      </button>
    </div>
  );
}
