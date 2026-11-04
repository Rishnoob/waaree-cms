"use client";

/**
 * CMS sidebar state: collapsed (icon rail) by default, "pinned open" when the user expands it.
 * Remembered per browser. The shell only renders on the client (behind RequireAuth), so reading
 * localStorage directly causes no hydration mismatch.
 */
import { useSyncExternalStore } from "react";

const KEY = "waaree-cms-sidebar";
const EVENT = "waaree-sidebar-change";

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "expanded";
  } catch {
    return false;
  }
}

export function setSidebarExpanded(expanded: boolean) {
  try {
    localStorage.setItem(KEY, expanded ? "expanded" : "collapsed");
  } catch {
    // storage blocked: still works for this visit via the event below
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb); // other tabs
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useSidebarExpanded(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
