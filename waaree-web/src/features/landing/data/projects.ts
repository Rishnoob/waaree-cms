/**
 * Every Waaree plant and project, where it stands and where it is going. All figures from the
 * Integrated Annual Report FY2025-26 (IAR26), page numbers as printed; capacities as on
 * 28 July 2026 unless noted. Drives “Waaree now” (the hub), the progress strips and the build board.
 */

export type Stage = "running" | "ramping" | "building" | "planned";
export type Segment = "solar" | "storage" | "power" | "hydrogen" | "epc";

export type Project = {
  id: string;
  name: string;
  place: string;
  segment: Segment;
  makes: string;
  /** Capacity today and the target, in `unit` (null when not stated). */
  now: number | null;
  target: number | null;
  unit: string;
  stage: Stage;
  /** “Operational”, or the financial year it is due. */
  due: string;
  invest?: string;
  overseas?: boolean;
  /** Our own facility page, when we have one. */
  slug?: string;
  image?: string;
  /** Short line for a card. */
  line: string;
  page: string;
};

export const STAGE_LABEL: Record<Stage, string> = {
  running: "Running at capacity",
  ramping: "Running, expanding",
  building: "Under construction",
  planned: "Approved, next",
};

export const PROJECTS: Project[] = [
  { id: "nagpur", name: "Integrated ingot–wafer plant", place: "Nagpur, Maharashtra", segment: "solar", makes: "Ingots and wafers", now: 0, target: 10, unit: "GW", stage: "building", due: "FY28", invest: "₹6,200 Cr", slug: "nagpur", line: "India’s largest: ground broken 14 March 2026 across 300 acres.", page: "8–9" },
  { id: "unn", name: "Solar cell plant", place: "Unn, Gujarat", segment: "solar", makes: "Solar cells", now: 0, target: 10, unit: "GW", stage: "building", due: "FY27", line: "Takes Waaree’s cell capacity from 5.4 to 15.4 GW.", page: "40–41" },
  { id: "rola", name: "Battery gigafactory", place: "Rola, Gujarat", segment: "storage", makes: "Battery cells, packs and containers", now: 5.15, target: 20, unit: "GWh", stage: "ramping", due: "FY29", invest: "~₹10,000 Cr", line: "Containers running; packs and cells being built.", page: "60–61" },
  { id: "dungri", name: "Electrolyser plant", place: "Dungri, Gujarat", segment: "hydrogen", makes: "Green hydrogen electrolysers", now: 0, target: 1, unit: "GW", stage: "building", due: "FY27", invest: "~₹676 Cr", line: "PLI awarded: Waaree’s entry into green hydrogen.", page: "20–21, 60–61" },
  { id: "glass", name: "Solar glass plant", place: "Gujarat", segment: "solar", makes: "Solar PV glass", now: 0, target: 2500, unit: "TPD", stage: "planned", due: "FY29", invest: "₹3,900 Cr", line: "Board-approved: the glass on every module, made at home.", page: "60–61" },
  { id: "texas", name: "Texas module plant", place: "Brookshire, Texas, USA", segment: "solar", makes: "Solar modules", now: 1.6, target: 3.2, unit: "GW", stage: "ramping", due: "FY27", overseas: true, slug: "texas", image: "/waaree/factories/texas.webp", line: "1.6 GW running, another 1.6 GW under construction.", page: "60–61" },
  { id: "arizona", name: "Arizona module plant", place: "Arizona, USA", segment: "solar", makes: "Solar modules", now: 1, target: 1.6, unit: "GW", stage: "building", due: "FY27", invest: "~₹164 Cr", overseas: true, slug: "arizona", line: "Meyer Burger’s US plant, acquired and being scaled up.", page: "20–21, 60–61" },
  { id: "sarodhi", name: "Inverter plant", place: "Sarodhi, Gujarat", segment: "power", makes: "Inverters", now: 3.05, target: 4, unit: "GW", stage: "ramping", due: "FY27", invest: "~₹180 Cr", slug: "sarodhi", line: "Phase I live; Phase II adds 1 GW.", page: "40–41" },
  { id: "alwar", name: "Transformer plant", place: "Alwar, Rajasthan", segment: "power", makes: "Transformers (Kotsons, 64%)", now: 9530, target: 20000, unit: "MVA", stage: "ramping", due: "FY27", invest: "~₹192 Cr", line: "Acquired October 2025; doubling its capacity.", page: "60–61" },
  { id: "azamnagar", name: "T&D plant", place: "Azamnagar, Gujarat", segment: "power", makes: "Transmission and distribution structures", now: null, target: null, unit: "", stage: "planned", due: "FY28", line: "A third transmission-structure plant.", page: "18–19" },
  { id: "oman", name: "Polysilicon stake", place: "Oman", segment: "solar", makes: "Polysilicon (United Solar)", now: 100, target: 100, unit: "KTPA", stage: "building", due: "FY27", invest: "~₹270 Cr", overseas: true, line: "A stake in the largest non-Chinese polysilicon maker.", page: "14–15, 18–19" },
  { id: "chikhli", name: "Module plant", place: "Chikhli, Gujarat", segment: "solar", makes: "Solar modules (18 lines)", now: 14.51, target: 14.51, unit: "GW", stage: "running", due: "Operational", slug: "chikhli", image: "/waaree/factories/chikhli.jpg", line: "Waaree’s largest: 14.51 GW of modules.", page: "58–59" },
  { id: "chikhli-cell", name: "Cell plant", place: "Chikhli, Gujarat", segment: "solar", makes: "Solar cells (11 lines)", now: 5.4, target: 5.4, unit: "GW", stage: "running", due: "Operational", slug: "chikhli", line: "5.4 GW of cells, running all year.", page: "34–35" },
  { id: "samakhiali", name: "Module plant", place: "Samakhiali, Gujarat", segment: "solar", makes: "Solar modules (8 lines)", now: 6, target: 6, unit: "GW", stage: "running", due: "Operational", slug: "samakhiali", line: "6 GW, the second 3 GW added in Q1 FY27.", page: "34–35, 40–41" },
  { id: "noida", name: "Module plant", place: "Noida, Uttar Pradesh", segment: "solar", makes: "Solar modules", now: 1.3, target: 1.3, unit: "GW", stage: "running", due: "Operational", line: "Waaree’s plant in the north.", page: "58–59" },
  { id: "nandigram", name: "Module plant", place: "Nandigram, Gujarat", segment: "solar", makes: "Solar modules", now: 1.11, target: 1.11, unit: "GW", stage: "running", due: "Operational", slug: "nandigram", image: "/waaree/factories/nandigram.webp", line: "1.11 GW on two lines.", page: "58–59" },
  { id: "tumb", name: "Module plant", place: "Tumb, Gujarat", segment: "solar", makes: "Solar modules", now: 1, target: 1, unit: "GW", stage: "running", due: "Operational", slug: "tumb", image: "/waaree/factories/tumb.webp", line: "1 GW on three lines.", page: "58–59" },
  { id: "td", name: "T&D plants", place: "Manglej and Bamangam, Gujarat", segment: "power", makes: "Transmission structures (APS, 55%)", now: 108000, target: 108000, unit: "MTPA", stage: "running", due: "Operational", invest: "~₹1,225 Cr", line: "Grid towers from the group that builds the plant.", page: "20–21, 58–59" },
  { id: "nashik", name: "Smart meter plant", place: "Nashik, Maharashtra", segment: "power", makes: "Smart meters (Racemosa, 76%)", now: 6, target: 6, unit: "lakh a year", stage: "running", due: "Operational", invest: "~₹53 Cr", line: "The digital layer of the grid.", page: "58–59" },
  { id: "epc", name: "Solar EPC projects", place: "India", segment: "epc", makes: "Solar plants, built and run", now: 5.89, target: 8.32, unit: "GWp", stage: "ramping", due: "Ongoing", image: "/waaree/portfolio/ground-mounted.webp", line: "5.89 GWp built; 2.43 GWp under execution (30 Jun 2026).", page: "26–27" },
];

/** Dated milestones, newest first (IAR26). */
export const UPDATES = [
  { date: "Q1 FY27", title: "Samakhiali doubles to 6 GW", text: "Another 3 GW of module lines capitalised.", id: "samakhiali" },
  { date: "16 Mar 2026", title: "Into polysilicon", text: "Stake in United Solar, Oman, completed.", id: "oman" },
  { date: "14 Mar 2026", title: "Ground broken in Nagpur", text: "Work starts on India’s largest ingot–wafer plant.", id: "nagpur" },
  { date: "Nov 2025", title: "Smart meters join", text: "Racemosa becomes Waaree Smart Meters.", id: "nashik" },
  { date: "Oct 2025", title: "Transformers join", text: "64% of Kotsons acquired for ₹192 Cr.", id: "alwar" },
  { date: "Sep 2025", title: "A second US plant", text: "Meyer Burger’s Arizona assets acquired.", id: "arizona" },
  { date: "FY26", title: "Rola’s first line runs", text: "5.15 GWh of battery containers.", id: "rola" },
] as const;

/** The future, as Waaree states it (IAR26). */
export const AHEAD = {
  revenueTargetCr: 100000, // “Target ₹1,00,000 Crores revenue in less than 5 years”, p. 42–43
  ebitdaFY27: "₹7,000–7,700 Cr", // FY27 operating EBITDA guidance, p. 42–43
  capexCr: "30,000+", // capex roadmap, p. 8–9
  market: { from: "USD 320 bn", to: "USD 4 trillion", by: 2035 }, // p. 32–33
  fy27: [
    ["~29 GW", "Modules"],
    ["15.4 GW", "Solar cells"],
    ["4 GW", "Inverters"],
    ["20,000 MVA", "Transformers"],
    ["1 GW", "Electrolysers"],
  ],
  later: [
    ["10 GW", "Ingots and wafers", "FY28"],
    ["20 GWh", "Batteries", "FY29"],
    ["2,500 TPD", "Solar glass", "FY29"],
  ],
  netZero: "Scope 1 & 2 by 2030, Scope 3 by 2040", // p. 60–61
} as const;

export const pct = (p: Project) => (p.now != null && p.target ? Math.min(1, p.now / p.target) : 0);
export const fmtCap = (v: number | null, unit: string) => (v == null ? "—" : `${v.toLocaleString("en-IN")} ${unit}`.trim());
