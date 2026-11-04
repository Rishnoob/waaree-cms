"use client"; // browser-only state; server components may import features that use it, never call it

/**
 * In-memory session. The access token lives only in JS memory (never localStorage), so XSS can't
 * read it from storage. The long-lived refresh token is an httpOnly cookie the browser sends to /auth/*.
 */
import { useSyncExternalStore } from "react";

import type { components } from "@/lib/api/schema";
import { env } from "@/lib/env";

export type SessionUser = components["schemas"]["SessionUser"];
type SessionOut = components["schemas"]["SessionOut"];

export type SessionState =
  | { status: "unknown" } // not checked yet (page just loaded)
  | { status: "anonymous" }
  | { status: "authenticated"; user: SessionUser; accessToken: string; expiresAt: number };

let state: SessionState = { status: "unknown" };
const listeners = new Set<() => void>();

function set(next: SessionState) {
  state = next;
  listeners.forEach((l) => l());
}

export function getSession(): SessionState {
  return state;
}

export function setSession(s: SessionOut) {
  set({ status: "authenticated", user: s.user, accessToken: s.access_token, expiresAt: Date.now() + s.expires_in * 1000 });
}

export function clearSession() {
  set({ status: "anonymous" });
}

let inflight: Promise<boolean> | null = null;

/** Get a fresh access token from the refresh cookie. Concurrent callers share one request. */
export function refreshSession(): Promise<boolean> {
  inflight ??= fetch(`${env.NEXT_PUBLIC_API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
    .then(async (res) => {
      if (!res.ok) throw new Error(String(res.status));
      setSession((await res.json()) as SessionOut);
      return true;
    })
    .catch(() => {
      clearSession();
      return false;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** A valid access token, refreshing it first if it expires within 30 s. */
export async function getAccessToken(): Promise<string | null> {
  if (state.status === "authenticated" && state.expiresAt - Date.now() > 30_000) return state.accessToken;
  if (state.status === "anonymous") return null;
  const ok = await refreshSession();
  return ok && state.status === "authenticated" ? state.accessToken : null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverSnapshot: SessionState = { status: "unknown" };

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSession, () => serverSnapshot);
}

/** True if the logged-in user has this permission. Only for showing/hiding UI; the API enforces it. */
export function useCan(permission: string): boolean {
  const s = useSession();
  return s.status === "authenticated" && s.user.permissions.includes(permission);
}
