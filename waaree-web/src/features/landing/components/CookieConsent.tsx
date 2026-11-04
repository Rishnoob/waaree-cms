"use client";

import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

const KEY = "waaree-cookie-consent";

/**
 * Cookie consent (DPDPA-friendly): essential cookies only until the visitor agrees. Analytics tags
 * load only after “Accept” (they’re switched on when Waaree provides an analytics ID).
 */
const listeners = new Set<() => void>();
function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return "blocked"; // storage blocked: don't nag
  }
}

export function CookieConsent() {
  // server and first paint: hidden ("pending"); in the browser: the stored choice, if any
  const choice = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => "pending",
  );
  if (choice !== null) return null;
  const choose = (v: "all" | "essential") => {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  };
  return (
    <div role="dialog" aria-label="Cookies" className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-3xl animate-rise-in flex-col gap-3 rounded-lg border border-border bg-white/95 p-4 shadow-[0_18px_40px_-18px_rgb(16_40_30/0.4)] backdrop-blur-xl sm:flex-row sm:items-center sm:gap-6">
      <p className="flex-1 text-sm text-body">
        We use essential cookies to run this site, and, with your permission, analytics to improve it.
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => choose("essential")}>
          Essential only
        </Button>
        <Button size="sm" onClick={() => choose("all")}>
          Accept
        </Button>
      </div>
    </div>
  );
}
