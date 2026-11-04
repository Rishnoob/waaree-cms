/**
 * Giving back: Waaree’s CSR in FY26, from the Integrated Annual Report FY2025-26 (IAR26),
 * Corporate Overview pp. 7 and 88–91. See docs/research/waaree.md.
 */

export const COMMUNITY_SOURCE = "Waaree Integrated Annual Report FY2025-26, pp. 7 and 88–91";

/** Tree plantation drives with Sadbhavna Seva Foundation, Gujarat. */
export const GROVES = [
  { key: "vadodara", place: "Vadodara", trees: 2500 },
  { key: "ahmedabad", place: "Ahmedabad", trees: 5000 },
] as const;
export const SAPLINGS = GROVES.reduce((a, g) => a + g.trees, 0); // 7,500

/** School infrastructure through Tapovan Vidhyalay Dham, Maharashtra and Gujarat. */
export const STUDENTS = 2000;

export const CSR = {
  spendCr: 38.32,
  spendPrevCr: 16.98, // FY25
  peopleReached: "43,700+", // CSR beneficiaries, FY26 (IAR26 p. 7)
  reachedDirectly: "13,700+", // of which direct (30,000+ indirect)
  feesPaid: 328, // children, one full year of fees
  schoolBags: 1000,
  tribalStudents: "200+", // teacher and staff salaries at a tribal school
};

/*
 * The chapter’s timeline (scroll progress 0 → 1), shared by the 3D scene and the counters:
 * the groves are planted one after the other, then the school fills with its students.
 */
export const PLANT = { vadodara: [0.04, 0.24], ahmedabad: [0.2, 0.52] } as const;
export const SCHOOL = [0.55, 0.74] as const;

/** Then the foundation’s care, one place at a time (IAR26 pp. 88–91). */
export const CARE = [
  { key: "clinic", label: "Health care · 1,000+ people", at: 0.76 },
  { key: "water", label: "Clean water · 500+ at Degam", at: 0.8 },
  { key: "food", label: "Food truck · free meals", at: 0.84 },
  { key: "home", label: "Boys’ home · 100+ boys, Mumbai", at: 0.88 },
] as const;
export const careAt = (p: number, at: number) => Math.min(1, Math.max(0, (p - at) / 0.05));

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const span = (p: number, [a, b]: readonly [number, number]) => clamp01((p - a) / (b - a));

/** Saplings in the ground at progress p. */
export const plantedAt = (p: number) => Math.round(GROVES[0].trees * span(p, PLANT.vadodara) + GROVES[1].trees * span(p, PLANT.ahmedabad));
/** Students at school at progress p. */
export const studentsAt = (p: number) => Math.round(STUDENTS * span(p, SCHOOL));
