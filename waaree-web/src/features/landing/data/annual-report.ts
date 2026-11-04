/**
 * Figures from Waaree Energies’ Integrated Annual Report FY2025-26 and its FY26 results release
 * (30 April 2026). Cross-checked against press coverage; see docs/research/waaree.md (“FY26 annual report”).
 * Rupee figures in crore, consolidated.
 */

export const FY26_SOURCE = "Waaree Energies Integrated Annual Report FY2025-26";

/** Revenue from operations and profit after tax, FY22 → FY26 (₹ crore). */
export const GROWTH = [
  { year: "FY22", revenue: 2854, pat: 80 },
  { year: "FY23", revenue: 6751, pat: 500 },
  { year: "FY24", revenue: 11398, pat: 1274 },
  { year: "FY25", revenue: 14445, pat: 1928 },
  { year: "FY26", revenue: 26537, pat: 3884 },
] as const;

export const FY26 = {
  operatingEbitda: 5909, // up 117%
  totalEbitda: 6617, // beat the ₹5,500–6,000 Cr guidance
  roe: 31.6, // %
  debtToEquity: 0.21,
  modulesProduced: 12.6, // GW, the highest ever
  fy27EbitdaGuidance: "₹7,000–7,700 Cr",
  topconEfficiency: 23.51, // %, best module efficiency
  maxModuleWatts: 715,
};

/**
 * Live-energy estimate: the modules Waaree made in FY26 alone, at an average Indian solar capacity
 * factor of 19%. kWh per second = 12.6 GW × 0.19 ÷ 3,600.
 */
export const LIVE_ENERGY = {
  gw: FY26.modulesProduced,
  capacityFactor: 0.19,
  kwhPerSecond: (FY26.modulesProduced * 1e6 * 0.19) / 3600,
  /** A typical Indian home uses about 100 kWh a month. */
  homeMonthKwh: 100,
};

/*
 * Growth chapter timeline (scroll progress 0 → 1): each year’s revenue flows in over its own window,
 * then FY26 profit lights up. Shared by the 3D scene and the counter so they never disagree.
 */
const YEAR_START = (y: number) => 0.04 + y * 0.15;
export const YEAR_SPAN = 0.1;
/** Scroll progress at which year y starts flowing in. */
export const yearStart = YEAR_START;
export const PROFIT_WINDOW = [0.74, 0.8] as const;

const smooth = (x: number) => x * x * (3 - 2 * x);

/** Revenue (₹ Cr) on screen at scroll progress p. */
export function revenueAt(p: number) {
  let prev = 0;
  for (let y = 0; y < GROWTH.length; y++) {
    const a = YEAR_START(y);
    if (p < a) return prev;
    const target = GROWTH[y]!.revenue;
    if (p < a + YEAR_SPAN) return prev + (target - prev) * smooth((p - a) / YEAR_SPAN);
    prev = target;
  }
  return prev;
}

/** Index of the year currently flowing in (or last finished), −1 before FY22 starts. */
export function yearAt(p: number) {
  let y = -1;
  for (let k = 0; k < GROWTH.length; k++) if (p >= YEAR_START(k)) y = k;
  return y;
}


/** 0 → 1 as FY26 profit lights up. */
export const profitAt = (p: number) => smooth(Math.min(1, Math.max(0, (p - PROFIT_WINDOW[0]) / (PROFIT_WINDOW[1] - PROFIT_WINDOW[0]))));

/** Order book on 30 September 2026 (₹ Cr): revenue already contracted, not yet earned. See docs/research/waaree.md. */
export const ORDER_BOOK = { cr: 59200, asOf: "30 Sep 2026" };

/** 0 → 1 as the order book rises beside FY26 (after the profit lights up). */
export const orderBookAt = (p: number) => smooth(Math.min(1, Math.max(0, (p - 0.8) / 0.08)));

/** Waaree’s stated goal: ₹1,00,000 Cr revenue in less than five years (IAR26, p. 42–43). */
export const REVENUE_TARGET = 100000;

/** 0 → 1 as the camera pulls back to reveal the ₹1,00,000 Cr target. */
export const targetAt = (p: number) => smooth(Math.min(1, Math.max(0, (p - 0.88) / 0.1)));
