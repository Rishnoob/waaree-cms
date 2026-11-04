"use client";

import type { ServiceState } from "../api";
import { useSystemStatus } from "../hooks";

function Row({ label, state }: { label: string; state: ServiceState | "checking" }) {
  const text = { ok: "Connected", down: "Unreachable", checking: "Checking…" }[state];
  const dot = { ok: "bg-emerald-500", down: "bg-red-500", checking: "bg-zinc-400 animate-pulse" }[state];
  return (
    <li className="flex items-center justify-between gap-6 py-2">
      <span>{label}</span>
      <span className="flex items-center gap-2 text-sm" data-testid={`status-${label.toLowerCase()}`}>
        <span aria-hidden className={`size-2 rounded-full ${dot}`} />
        {text}
      </span>
    </li>
  );
}

/** Shows whether the API and database are reachable. Temporary landing content until the public site exists. */
export function SystemStatus() {
  const { data, isPending } = useSystemStatus();
  return (
    <section aria-label="System status" className="w-full max-w-sm rounded-2xl border border-foreground/10 p-6">
      <h2 className="mb-2 text-sm font-medium text-foreground/60">System status</h2>
      <ul className="divide-y divide-foreground/10">
        <Row label="API" state={isPending ? "checking" : (data?.api ?? "down")} />
        <Row label="Database" state={isPending ? "checking" : (data?.database ?? "down")} />
      </ul>
      {data?.version && <p className="mt-3 text-xs text-foreground/50">API version {data.version}</p>}
    </section>
  );
}
