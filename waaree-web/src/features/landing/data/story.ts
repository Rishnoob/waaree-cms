import { LEGACY } from "./home";

/**
 * Our story as numbers: Waaree’s module capacity over time (MW) and where each milestone sits on
 * the timeline. Capacity points are from waaree.com (Our Legacy), the IPO prospectus and the FY26
 * annual report; see docs/research/waaree.md. Between points the line is interpolated.
 */
export const CAPACITY: [year: number, mw: number][] = [
  [1985, 0],
  [2006.9, 0],
  [2007, 30], // first 30 MW line, Surat (AR FY25)
  [2021, 2000], // AR FY25
  [2022.25, 4000], // FY22 end (CARE Ratings)
  [2022.95, 9000], // Dec 2022 (PV Tech)
  [2023.5, 12000], // crossed 12 GW (AR FY25)
  [2025.2, 15000], // FY25 “~15 GW” (AR FY25)
  [2025.55, 16700], // Jul 2025 incl. US (AR FY25)
  [2026.55, 25800], // 28 Jul 2026 (IAR FY26)
];

export const START_YEAR = 1985;
export const END_YEAR = 2026.8;

/** Where each LEGACY milestone sits (a range like “2019–21” sits mid-way). */
const yearOf = (label: string) => {
  const [a, b] = label.split("–");
  const y0 = Number(a);
  if (!b) return y0;
  const y1 = Number(b.length === 2 ? a!.slice(0, 2) + b : b);
  return (y0 + y1) / 2;
};

export const MILESTONES = [
  ...LEGACY.timeline.map((t) => ({ ...t, at: yearOf(t.year) })),
  { year: "Today", title: "25.8 GW, and still rising", text: "Module capacity up about 17× in five years: 12.6 GW made in FY26 alone.", at: 2026.6 },
];

/** Capacity (MW) at a given year, linearly between the known points. */
export function capacityAt(year: number) {
  for (let i = 1; i < CAPACITY.length; i++) {
    const [y1, c1] = CAPACITY[i]!;
    const [y0, c0] = CAPACITY[i - 1]!;
    if (year <= y1) return c0 + ((c1 - c0) * (year - y0)) / (y1 - y0);
  }
  return CAPACITY[CAPACITY.length - 1]![1];
}

/** The last sourced capacity point at or before a year (the line between points is a drawing, not data). */
export function knownCapacityAt(year: number): [number, number] {
  let k = CAPACITY[0]!;
  for (const c of CAPACITY) if (c[0] <= year + 1e-6) k = c;
  return k;
}

/** Capacity chips on milestone cards: only where a sourced figure exists. */
export const CHIPS: Record<string, string> = { "2007": "30 MW", "2019–21": "2 GW", "2022–24": "13.3 GW", "2025–26": "23.75 GW", Today: "25.8 GW" };

/**
 * Scroll → year. Every milestone gets the same share of the scroll, so the crowded recent years
 * aren’t rushed and the empty decades pass quickly.
 */
const ANCHORS = [START_YEAR, ...MILESTONES.map((m) => m.at)];
export function yearAtProgress(p: number) {
  const u = Math.min(1, Math.max(0, p)) * (ANCHORS.length - 1);
  const i = Math.min(ANCHORS.length - 2, Math.floor(u));
  const f = u - i;
  const e = f * f * (3 - 2 * f); // ease into each milestone and rest on it a moment
  return ANCHORS[i]! + (ANCHORS[i + 1]! - ANCHORS[i]!) * e;
}

/**
 * Which milestone is on show at scroll progress p, and how fully (0–1). Each one holds until the
 * next is about to arrive, then hands over: never an empty stage between years.
 */
export function shownAt(p: number) {
  const u = Math.min(1, Math.max(0, p)) * (ANCHORS.length - 1) + 0.18;
  const i = Math.min(MILESTONES.length - 1, Math.floor(u) - 1);
  if (i < 0) return { i: 0, vis: 0 };
  const f = u - Math.floor(u);
  const s = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  return { i, vis: i === MILESTONES.length - 1 ? s(f / 0.14) : Math.min(s(f / 0.14), s((1 - f) / 0.1)) };
}

/** What each milestone’s illustration shows (MILESTONES order; scenes in illustrations/scenes.tsx). */
export const SCENE_CAPTIONS = [
  "From the village to Mumbai, on ₹5,000",
  "Trading instrument gauges",
  "Waaree Instruments: gauges and valves",
  "Grey Hamburg, sunny India: the idea",
  "The first EPC plant takes shape",
  "Solar for India’s northeast, with NEEPCO",
  "A franchise in every town",
  "The first project abroad: Vietnam",
  "A network across India",
  "Listing day on NSE and BSE",
  "Solar cells, made by Waaree",
  "Transformers and smart meters for the grid",
  "Going upstream: ingots and wafers",
  "Chikhli today: Waaree’s largest plant",
];

export const formatCapacity =(mw: number) => (mw <= 0 ? "Before solar" : mw < 1000 ? `${Math.round(mw)} MW` : `${(mw / 1000).toFixed(1)} GW`);
