import type { Facility } from "./facilities";

/** The miniature a site page shows: its line at work, or the frame rising. Offices get none. */
export type TwinMode = "modules" | "inverters" | "construction";

export function twinMode(f: Facility): TwinMode | null {
  if (f.status === "under-construction") return "construction";
  if (f.kind !== "manufacturing") return null;
  return /inverter/i.test(f.makes) ? "inverters" : "modules";
}

/** Build phases, as fractions of the build (the blueprint stage reads them). */
export const PHASES = [
  { at: 0, name: "Plan" },
  { at: 0.08, name: "Foundations" },
  { at: 0.2, name: "Structure" },
  { at: 0.46, name: "Envelope" },
  { at: 0.7, name: "Solar roof" },
  { at: 0.82, name: "Fit-out" },
  { at: 0.95, name: "Live" },
] as const;

export const phaseAt = (p: number) => [...PHASES].reverse().find((ph) => p >= ph.at - 1e-6)!.name;

/**
 * Where each site stands today: running sites are complete; Nagpur broke ground on 14 March 2026
 * and is due in FY28, so it is shown in its foundations stage (illustrative).
 */
export function buildToday(f: Facility) {
  return f.status === "under-construction" ? 0.16 : 1;
}
