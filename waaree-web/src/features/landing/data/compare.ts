/**
 * Why Waaree leads: public figures only, each with its source and date (docs/research/waaree.md,
 * “Fact pack for the redesign”). Competitor capacities are the latest each company or the trade
 * press reported; “first / only” lines are Waaree’s own claims from its FY26 annual report.
 */

export type Maker = { name: string; modules: number; cells: number; us: boolean; asOf: string; source: string; waaree?: boolean };

export const MAKERS: Maker[] = [
  { name: "Waaree", modules: 25.8, cells: 5.4, us: true, asOf: "Sep 2026", source: "pv magazine India, 28 Oct 2026", waaree: true },
  { name: "Premier Energies", modules: 11.1, cells: 10.6, us: false, asOf: "Oct 2026", source: "Energetica India" },
  { name: "Emmvee", modules: 10.3, cells: 2.94, us: false, asOf: "Jun 2026", source: "SolarQuarter" },
  { name: "Vikram Solar", modules: 9.5, cells: 0, us: false, asOf: "Jun 2026", source: "pv magazine India" },
  { name: "ReNew", modules: 6.4, cells: 2.5, us: false, asOf: "2026", source: "renew.com" },
  { name: "Tata Power Solar", modules: 4.3, cells: 4.3, us: false, asOf: "Jan 2026", source: "tatapower.com" },
  { name: "Adani Solar", modules: 4, cells: 4, us: false, asOf: "Jun 2026", source: "Wood Mackenzie via Pulse" },
];

export const FIRSTS = [
  { big: "40", unit: "quarters", title: "BNEF Tier 1, quarter after quarter", text: "The only Indian company to reach this milestone.", tag: "Bankability" },
  { big: "#1", unit: "in India", title: "Largest module supplier", text: "13.9% of India’s module supply in FY2025 (JMK Research).", tag: "Market" },
  { big: "~44%", unit: "", title: "Of India’s module exports", text: "Waaree’s share, as reported in August 2025.", tag: "Exports" },
  { big: "Gold", unit: "98th pct", title: "EcoVadis medal", text: "The first Indian solar maker to win and keep Gold (May 2026).", tag: "Sustainability" },
  { big: "1st", unit: "in India", title: "Cradle-to-grave EPD", text: "First Indian company with a cradle-to-grave lifecycle assessment.", tag: "Transparency" },
  { big: "4×", unit: "running", title: "RETC Highest Achiever", text: "The only Indian company named Overall Highest Achiever.", tag: "Reliability" },
  { big: ">1", unit: "GW / month", title: "A first for India", text: "The first Indian maker to produce over 1 GW of modules in a single month.", tag: "Scale" },
  { big: "2026", unit: "Top Performer", title: "Kiwa PVEL scorecard", text: "Independent lab testing of module reliability.", tag: "Quality" },
] as const;

