/**
 * How it’s made: the ten stages, from quartz sand to green hydrogen. Places and numbers are
 * from waaree.com (see facilities.ts) or the FY26 annual report (annual-report.ts / research notes).
 */
export const STAGES = [
  { name: "Sand", line: "The panel you just took apart began here, as silicon: the second most common element in the Earth’s crust.", where: "Quartz, under our feet" },
  { name: "Silicon ingot", line: "Purified silicon is melted and pulled, slowly turning, into one perfect crystal.", where: "Nagpur · a 10 GW ingot-wafer plant, under construction" },
  { name: "Wafers", line: "The crystal is sliced into wafers thinner than a fingernail.", where: "Nagpur · the same plant" },
  { name: "TOPCon cell", line: "Doped, coated and printed with silver, a wafer becomes a cell that turns light into current.", where: "Gujarat" },
  { name: "Solar module", line: "Cells, glass, EVA and a frame become a panel built to last decades.", where: "Chikhli, Samakhiali, Nandigram, Tumb, Greater Noida and Texas" },
  { name: "Inverter", line: "Turns the panel’s direct current into the alternating current homes and the grid run on.", where: "Sarodhi, Gujarat" },
  { name: "Battery storage", line: "Keeps the afternoon sun for the evening peak.", where: "Gujarat · a 5.15 GWh container line" },
  { name: "Transformer", line: "Steps the voltage up so solar power can travel the grid.", where: "Scaling to 20,000 MVA by FY28" },
  { name: "Smart meter", line: "Counts every unit you make and use.", where: "Waaree’s smart meter range" },
  { name: "Green hydrogen", line: "Electrolysers split water with solar power: fuel with no carbon in it.", where: "Waaree Clean Energy Solutions" },
] as const;

/**
 * The prelude: the chapter opens on the glowing module the panel chapter ended with (as points),
 * which crumbles back into sand. Stage −1 is that module.
 */
export const PRELUDE = 0.1;

/**
 * The outro: after the last stage the points gather back into that module, the one the Factories
 * map opens on, so the chapter hands over to “where it’s made”. Stage −1 again.
 */
export const OUTRO = 0.84;

/** Scroll progress → [from stage, to stage, flow 0 → 1]. Each stage holds, then flows into the next. */
export function stageAt(p: number): [number, number, number] {
  if (p < PRELUDE) {
    const x = Math.min(1, Math.max(0, (p / PRELUDE - 0.5) / 0.5));
    return [-1, 0, x * x * (3 - 2 * x)];
  }
  if (p > OUTRO) {
    const x = Math.min(1, Math.max(0, ((p - OUTRO) / (1 - OUTRO) - 0.1) / 0.6));
    return [STAGES.length - 1, -1, x * x * (3 - 2 * x)];
  }
  p = (p - PRELUDE) / (OUTRO - PRELUDE);
  const u = Math.min(1, Math.max(0, (p - 0.03) / 0.94)) * (STAGES.length - 1);
  const i = Math.min(STAGES.length - 1, Math.floor(u));
  const f = u - i;
  const x = Math.min(1, Math.max(0, (f - 0.45) / 0.55));
  return [i, Math.min(STAGES.length - 1, i + 1), x * x * (3 - 2 * x)];
}
