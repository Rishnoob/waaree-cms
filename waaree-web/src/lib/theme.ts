"use client";

/**
 * Light/dark theme for the CMS. Stored per browser (a convenience, not data), applied as the `dark`
 * class on <html> so portalled popups follow it. The public site always stays light.
 * THEME_INIT_SCRIPT (./theme-script.ts) runs before paint in the CMS layout so there's no light flash.
 */
import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY as KEY } from "./theme-script";

export type Theme = "light" | "dark";
const EVENT = "waaree-theme-change";

function read(): Theme {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // storage blocked (private mode): the theme still applies for this visit
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => "light");
}
