/**
 * Impact at every level. Reported figures are from Waaree’s FY26 annual report (IAR26) and BRSR;
 * estimates are worked out here, in the open, from the FY26 module output.
 */

const FY26_GW = 12.6; // modules produced in FY26
const CAPACITY_FACTOR = 0.19; // average Indian solar
const GRID_TCO2_PER_MWH = 0.71; // CEA CO2 baseline v21 (FY2024-25)
const HOME_KWH_PER_YEAR = 1200; // a typical Indian household

/** Electricity those modules make in a year, MWh. */
export const FY26_MODULES_MWH = FY26_GW * 1000 * CAPACITY_FACTOR * 8760;

export const ESTIMATES = {
  co2Mt: (FY26_MODULES_MWH * GRID_TCO2_PER_MWH) / 1e6, // ≈ 14.9 Mt a year
  homesMn: (FY26_MODULES_MWH * 1000) / HOME_KWH_PER_YEAR / 1e6, // ≈ 17.5 million
  how: `${FY26_GW} GW made in FY26 × ${CAPACITY_FACTOR * 100}% capacity factor × 8,760 h; CO₂ at ${GRID_TCO2_PER_MWH} t/MWh (CEA grid factor); a home uses ${HOME_KWH_PER_YEAR.toLocaleString("en-IN")} kWh a year.`,
};

export const LEVELS = [
  {
    key: "planet",
    label: "Planet",
    headline: "Cleaner air, every year those panels shine.",
    big: `≈${ESTIMATES.co2Mt.toFixed(0)} Mt`,
    bigText: "of CO₂ a year kept out of the air by the modules Waaree made in FY26 alone (estimate).",
    stats: [
      ["14,740 t", "CO₂e avoided in Waaree’s own operations"],
      ["~39,000 KL", "Water saved in FY26"],
      ["0 t", "Waste sent to landfill"],
      ["2030", "Net zero for its own operations (Scope 1 & 2)"],
    ],
  },
  {
    key: "people",
    label: "People",
    headline: "Light in millions of homes. Work for thousands of hands.",
    big: `≈${ESTIMATES.homesMn.toFixed(0)} million`,
    bigText: "homes’ worth of electricity a year from the modules made in FY26 (estimate).",
    stats: [
      ["8,513", "Jobs on the factory floor"],
      ["2,120", "Engineers and office staff"],
      ["5,000+", "Installers in Waaree’s network"],
      ["27 states", "And about 15,000 pincodes served"],
    ],
  },
  {
    key: "prosperity",
    label: "Prosperity",
    headline: "Value that flows to partners, towns and shareholders.",
    big: "33%",
    bigText: "of FY26 revenue earned overseas: made in India, sold to the world.",
    stats: [
      ["25+", "Countries Waaree sells to"],
      ["2,500+", "Local selling partners, plus 700+ franchisees"],
      ["76×", "IPO subscription, October 2024"],
      ["₹4", "Dividend per share for FY26"],
    ],
  },
] as const;
