/**
 * A small isometric diorama kit (pure SVG, server-renderable). Every story scene is built from these
 * pieces so the whole page shares one hand-crafted look: the hero’s pastel light, Waaree navy panels
 * and greens, soft shading (top lit, left face lit by the sun, right face in shade).
 *
 * World units: x runs to the lower right, y to the lower left, z up. 1 unit = S px.
 */
import { createContext, type ReactNode, useContext, useId } from "react";

import "./illustrations.css";

export const S = 10;
const C = 0.866;

export type P3 = [number, number, number];

export function iso(x: number, y: number, z = 0): [number, number] {
  return [(x - y) * C * S, (x + y) * 0.5 * S - z * S];
}
/** Round for SVG: server and browser trig can differ in the last digit, which breaks hydration. */
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const pts = (list: P3[]) => list.map((p) => iso(...p).map((n) => n.toFixed(1)).join(",")).join(" ");

/* ── Palette ───────────────────────────────────────────────────────────────── */
export type Tone = { top: string; left: string; right: string };
export const T = {
  white: { top: "#ffffff", left: "#f2f6f8", right: "#d9e4ea" },
  cloud: { top: "#fbfdfe", left: "#eaf1f5", right: "#d3dfe7" },
  mint: { top: "#e4f6eb", left: "#cbebd8", right: "#acd9bf" },
  grass: { top: "#cdeccf", left: "#e8dcc6", right: "#d6c4a5" }, // land slab: grass on top, earth sides
  green: { top: "#6bd897", left: "#2fb46a", right: "#21915a" },
  sky: { top: "#dcf0fb", left: "#bfe2f5", right: "#9fceea" },
  blue: { top: "#7cc8f0", left: "#3ea9e0", right: "#2a87bd" },
  sand: { top: "#f8ecd8", left: "#efdcbd", right: "#ddc49f" },
  peach: { top: "#ffe3c4", left: "#ffd0a3", right: "#f2b783" },
  grey: { top: "#eef2f4", left: "#dde4e8", right: "#c5d0d7" },
  steel: { top: "#c9d4dc", left: "#aebcc7", right: "#8e9ead" },
  navy: { top: "#3a63a8", left: "#28497f", right: "#1d3963" },
  ink: { top: "#5d7180", left: "#4a5c69", right: "#3a4a55" },
  water: { top: "#bfe4f7", left: "#9fd2ee", right: "#86c1e2" },
} satisfies Record<string, Tone>;

export const INK = "#3d4f5c";
export const BRAND = "#0db02b";

/* ── Solids ────────────────────────────────────────────────────────────────── */
export function Box({ x, y, z = 0, w, d, h, tone = T.white, edge = true, shadow = z === 0 }: { x: number; y: number; z?: number; w: number; d: number; h: number; tone?: Tone; edge?: boolean; shadow?: boolean }) {
  const sh = h * 0.55;
  return (
    <g>
      {shadow && (
        <polygon
          points={pts([[x + w, y, 0.01], [x + w + sh, y - sh * 0.35, 0.01], [x + w + sh, y + d - sh * 0.35, 0.01], [x + w, y + d, 0.01]])}
          fill="rgb(40 80 90 / 0.10)"
        />
      )}
      <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={tone.right} />
      <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={tone.left} />
      <polygon
        points={pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])}
        fill={tone.top}
        stroke={edge ? "rgb(255 255 255 / 0.75)" : undefined}
        strokeWidth={0.6}
        strokeLinejoin="round"
      />
    </g>
  );
}

/** A gable roof running along x (ridge at mid-depth). */
export function Gable({ x, y, z, w, d, rise, tone = T.peach, wall = T.white }: { x: number; y: number; z: number; w: number; d: number; rise: number; tone?: Tone; wall?: Tone }) {
  const m = y + d / 2;
  return (
    <g>
      <polygon points={pts([[x, y, z], [x + w, y, z], [x + w, m, z + rise], [x, m, z + rise]])} fill={tone.top} />
      <polygon points={pts([[x + w, y, z], [x + w, y + d, z], [x + w, m, z + rise]])} fill={wall.right} />
      <polygon points={pts([[x, y + d, z], [x + w, y + d, z], [x + w, m, z + rise], [x, m, z + rise]])} fill={tone.left} stroke="rgb(255 255 255 / 0.6)" strokeWidth={0.5} />
    </g>
  );
}

/** Factory saw-tooth roof along x: north-light glazing on every tooth. */
export function SawRoof({ x, y, z, w, d, teeth, rise, tone = T.grey }: { x: number; y: number; z: number; w: number; d: number; teeth: number; rise: number; tone?: Tone }) {
  const step = d / teeth;
  return (
    <g>
      {Array.from({ length: teeth }, (_, i) => {
        const y0 = y + i * step;
        return (
          <g key={i}>
            <polygon points={pts([[x, y0, z], [x + w, y0, z], [x + w, y0, z + rise], [x, y0, z + rise]])} fill="#bfe2f5" />
            <polygon points={pts([[x + w, y0, z], [x + w, y0 + step, z], [x + w, y0, z + rise]])} fill={T.white.right} />
            <polygon points={pts([[x, y0, z + rise], [x + w, y0, z + rise], [x + w, y0 + step, z], [x, y0 + step, z]])} fill={tone.left} stroke="rgb(255 255 255 / 0.7)" strokeWidth={0.5} />
          </g>
        );
      })}
    </g>
  );
}

/** A vertical cylinder (tanks, ingots, silos). */
export function Cylinder({ x, y, z = 0, r, h, tone = T.white, band }: { x: number; y: number; z?: number; r: number; h: number; tone?: Tone; band?: string }) {
  const [cx, cyTop] = iso(x, y, z + h);
  const [, cyBot] = iso(x, y, z);
  const rx = r * S * 1.22;
  const ry = r * S * 0.7;
  const gid = `cyl-${x}-${y}-${z}`.replace(/\./g, "_").replace(/-/g, "m");
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" x2="1">
          <stop offset="0" stopColor={tone.left} />
          <stop offset="0.55" stopColor={tone.top} />
          <stop offset="1" stopColor={tone.right} />
        </linearGradient>
      </defs>
      <path d={`M${cx - rx},${cyTop} L${cx - rx},${cyBot} A${rx},${ry} 0 0 0 ${cx + rx},${cyBot} L${cx + rx},${cyTop} Z`} fill={`url(#${gid})`} />
      {band && <path d={`M${cx - rx},${cyTop + (cyBot - cyTop) * 0.62} A${rx},${ry} 0 0 0 ${cx + rx},${cyTop + (cyBot - cyTop) * 0.62}`} stroke={band} strokeWidth={2.2} fill="none" />}
      <ellipse cx={cx} cy={cyTop} rx={rx} ry={ry} fill={tone.top} stroke="rgb(255 255 255 / 0.8)" strokeWidth={0.6} />
    </g>
  );
}

/* ── Drawing on a face (signs, windows, doors, text in perspective) ─────────── */
/**
 * Children are drawn in face units (1 = one world unit; x to the right, y downward) and mapped onto
 * a box face. `at` is the face’s top-left corner as you see it.
 */
export function OnFace({ face, at, children }: { face: "left" | "right" | "top"; at: P3; children: ReactNode }) {
  const [ox, oy] = iso(...at);
  const m =
    face === "left"
      ? [C * S, 0.5 * S, 0, S]
      : face === "right"
        ? [C * S, -0.5 * S, 0, S]
        : [C * S, 0.5 * S, -C * S, 0.5 * S];
  return <g transform={`matrix(${m.map((n) => n.toFixed(3)).join(" ")} ${ox.toFixed(1)} ${oy.toFixed(1)})`}>{children}</g>;
}

/** A row of windows on a face (face units). */
export function Windows({ x, y, w, h, n, gap = 0.6, fill = "#bfe2f5" }: { x: number; y: number; w: number; h: number; n: number; gap?: number; fill?: string }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x + i * (w + gap)} y={y} width={w} height={h} rx={0.12} fill={fill} />
      ))}
    </>
  );
}

/* ── Solar ─────────────────────────────────────────────────────────────────── */
/** One tilted PV module (low edge at y + d, high edge at y), with cells, frame, legs and a light sweep. */
export function Panel({ x, y, z = 0, w = 2, d = 1.2, lift = 0.9, cols = 4, rows = 3, sweep = true }: { x: number; y: number; z?: number; w?: number; d?: number; lift?: number; cols?: number; rows?: number; sweep?: boolean }) {
  const lo = z + 0.25;
  const hi = z + 0.25 + lift;
  const corner: P3[] = [[x, y, hi], [x + w, y, hi], [x + w, y + d, lo], [x, y + d, lo]];
  const lines: ReactNode[] = [];
  for (let i = 1; i < cols; i++) {
    const t = x + (w * i) / cols;
    const [a, b] = [iso(t, y, hi), iso(t, y + d, lo)];
    lines.push(<line key={`c${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />);
  }
  for (let j = 1; j < rows; j++) {
    const yy = y + (d * j) / rows;
    const zz = hi + (lo - hi) * (j / rows);
    const [a, b] = [iso(x, yy, zz), iso(x + w, yy, zz)];
    lines.push(<line key={`r${j}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />);
  }
  const [l1, l2] = [iso(x + 0.2, y + 0.1, hi - 0.05), iso(x + 0.2, y + 0.1, z)];
  const [l3, l4] = [iso(x + w - 0.2, y + 0.1, hi - 0.05), iso(x + w - 0.2, y + 0.1, z)];
  return (
    <g>
      <line x1={l1[0]} y1={l1[1]} x2={l2[0]} y2={l2[1]} stroke="#9aa9b4" strokeWidth={0.8} />
      <line x1={l3[0]} y1={l3[1]} x2={l4[0]} y2={l4[1]} stroke="#9aa9b4" strokeWidth={0.8} />
      <polygon points={pts(corner)} fill="url(#ill-panel)" stroke="#f4f8fb" strokeWidth={0.9} strokeLinejoin="round" />
      <g stroke="rgb(190 215 245 / 0.45)" strokeWidth={0.45}>{lines}</g>
      {sweep && <polygon className="ill-sweep" points={pts(corner)} fill="url(#ill-sweep)" />}
    </g>
  );
}

/** A grid of panels. */
export function PanelField({ x, y, z = 0, cols, rows, w = 2, d = 1.2, gapX = 0.35, gapY = 1.1, lift = 0.9 }: { x: number; y: number; z?: number; cols: number; rows: number; w?: number; d?: number; gapX?: number; gapY?: number; lift?: number }) {
  const items: ReactNode[] = [];
  // back rows first so nearer rows overlap them
  for (let r = 0; r < rows; r++) {
    for (let c = cols - 1; c >= 0; c--) {
      items.push(<Panel key={`${r}-${c}`} x={x + c * (w + gapX)} y={y + r * (d + gapY)} z={z} w={w} d={d} lift={lift} />);
    }
  }
  return <g>{items}</g>;
}

/** Panels laid on a roof slope or flat roof (low lift). */
export function RoofPanels({ x, y, z, cols, w = 1.4, d = 1, gap = 0.2 }: { x: number; y: number; z: number; cols: number; w?: number; d?: number; gap?: number }) {
  return (
    <g>
      {Array.from({ length: cols }, (_, c) => (
        <Panel key={c} x={x + c * (w + gap)} y={y} z={z} w={w} d={d} lift={0.35} cols={3} rows={2} />
      ))}
    </g>
  );
}

/* ── Nature & life ─────────────────────────────────────────────────────────── */
export function Tree({ x, y, z = 0, s = 1, kind = "round" }: { x: number; y: number; z?: number; s?: number; kind?: "round" | "pine" | "palm" }) {
  const [bx, by] = iso(x, y, z);
  const [, ty] = iso(x, y, z + 1.1 * s);
  if (kind === "pine") {
    return (
      <g>
        <ellipse cx={bx} cy={by} rx={4 * s} ry={2 * s} fill="rgb(60 90 70 / 0.12)" />
        <line x1={bx} y1={by} x2={bx} y2={ty} stroke="#a58a6a" strokeWidth={1.2 * s} />
        <path d={`M${bx},${ty - 16 * s} L${bx + 6 * s},${ty + 2 * s} L${bx - 6 * s},${ty + 2 * s} Z`} fill="#7fcf9b" />
        <path d={`M${bx},${ty - 16 * s} L${bx + 6 * s},${ty + 2 * s} L${bx},${ty + 2 * s} Z`} fill="#5dbb82" />
      </g>
    );
  }
  if (kind === "palm") {
    return (
      <g>
        <ellipse cx={bx} cy={by} rx={4 * s} ry={2 * s} fill="rgb(60 90 70 / 0.12)" />
        <path d={`M${bx},${by} Q${bx + 2 * s},${by - 10 * s} ${bx + 1 * s},${by - 20 * s}`} stroke="#b89a74" strokeWidth={1.4 * s} fill="none" />
        {[-150, -110, -60, -20, 20].map((a) => (
          <path
            key={a}
            d={`M${bx + s},${by - 20 * s} q${r3(Math.cos((a * Math.PI) / 180) * 6 * s)},${r3(Math.sin((a * Math.PI) / 180) * 6 * s - 2 * s)} ${r3(Math.cos((a * Math.PI) / 180) * 10 * s)},${r3(Math.sin((a * Math.PI) / 180) * 6 * s + 3 * s)}`}
            stroke="#5dbb82"
            strokeWidth={2 * s}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </g>
    );
  }
  return (
    <g>
      <ellipse cx={bx} cy={by} rx={5 * s} ry={2.4 * s} fill="rgb(60 90 70 / 0.12)" />
      <line x1={bx} y1={by} x2={bx} y2={ty} stroke="#a58a6a" strokeWidth={1.3 * s} />
      <circle cx={bx} cy={ty - 4 * s} r={6 * s} fill="#8fd6a8" />
      <circle cx={bx - 1.8 * s} cy={ty - 5.6 * s} r={3.4 * s} fill="#b4e6c5" />
    </g>
  );
}

/** A small person (hard hat optional). `bob` gives them a gentle working motion. */
export function Person({ x, y, z = 0, shirt = "#2fb46a", hat, bob = false, female = false }: { x: number; y: number; z?: number; shirt?: string; hat?: string; bob?: boolean; female?: boolean }) {
  const [px, py] = iso(x, y, z);
  return (
    <g className={bob ? "ill-bob" : undefined} style={{ transformOrigin: `${px}px ${py}px` }}>
      <ellipse cx={px} cy={py} rx={3} ry={1.4} fill="rgb(40 60 70 / 0.15)" />
      <rect x={px - 1.6} y={py - 7} width={1.3} height={6} rx={0.6} fill="#4a5c69" />
      <rect x={px + 0.3} y={py - 7} width={1.3} height={6} rx={0.6} fill="#3d4f5c" />
      {female ? (
        <path d={`M${px - 2.2},${py - 13} h4.4 l1,7.6 h-6.4 z`} fill={shirt} />
      ) : (
        <rect x={px - 2.4} y={py - 13} width={4.8} height={7} rx={1.8} fill={shirt} />
      )}
      {female && !hat && <circle cx={px + 1.9} cy={py - 16.6} r={1.3} fill="#3a3330" />}
      <circle cx={px} cy={py - 15.4} r={2.3} fill="#e9b98f" />
      {female && !hat && <path d={`M${px - 2.4},${py - 15.2} a2.4,2.4 0 0 1 4.8,0 q-2.4,-1 -4.8,0 z`} fill="#3a3330" />}
      {hat && <path d={`M${px - 2.8},${py - 16} a2.8,2.4 0 0 1 5.6,0 z`} fill={hat} />}
    </g>
  );
}

/** A delivery truck facing +x, with a Waaree-green cab. */
export function Truck({ x, y, z = 0, cargo = "panels" }: { x: number; y: number; z?: number; cargo?: "panels" | "box" }) {
  return (
    <g>
      <Box x={x} y={y} z={z + 0.4} w={3.4} d={1.6} h={1.7} tone={cargo === "panels" ? T.white : T.sky} />
      {cargo === "panels" && (
        <OnFace face="left" at={[x, y + 1.6, z + 2.1]}>
          <rect x={0.4} y={0.35} width={2.6} height={0.5} rx={0.1} fill={BRAND} />
        </OnFace>
      )}
      <Box x={x + 3.4} y={y + 0.1} z={z + 0.4} w={1.3} d={1.4} h={1.3} tone={T.green} />
      <OnFace face="right" at={[x + 4.7, y + 1.5, z + 1.7]}>
        <rect x={0.2} y={0.15} width={1} height={0.5} rx={0.1} fill="#d9f1ff" />
      </OnFace>
      {[[x + 0.8, y + 1.6], [x + 3.8, y + 1.5]].map(([wx, wy], i) => {
        const [cx, cy] = iso(wx!, wy!, z + 0.35);
        return <ellipse key={i} cx={cx} cy={cy} rx={2.4} ry={2.6} fill="#3d4f5c" />;
      })}
    </g>
  );
}

/* ── Ground ────────────────────────────────────────────────────────────────── */
// fixed tuft positions (fractions of the slab), so every render is identical
const TUFTS: [number, number][] = [[-0.85, -0.2], [-0.6, 0.55], [-0.2, 0.92], [0.3, 0.75], [0.7, 0.35], [0.9, -0.6], [0.55, -0.9], [-0.4, -0.85], [0.05, 0.3], [-0.92, 0.85]];

/** The floating diorama base every scene stands on. Coordinates −size..size. */
export function Slab({ size = 10, h = 1.4, tone = T.grass }: { size?: number; h?: number; tone?: Tone }) {
  const [sx, sy] = iso(size, size, -h);
  return (
    <g>
      <ellipse cx={0} cy={sy + 26} rx={size * S * 1.25} ry={size * S * 0.32} fill="rgb(40 80 90 / 0.07)" filter="url(#ill-soft)" />
      <Box x={-size} y={-size} z={-h} w={size * 2} d={size * 2} h={h} tone={tone} edge={false} shadow={false} />
      {tone !== T.water && TUFTS.map(([tx, ty], i) => {
        const [px, py] = iso(tx * size, ty * size, 0);
        return <path key={i} d={`M${px - 2},${py} q1,-3 2,-3.6 q1,0.6 2,3.6`} fill="#b5e0bd" />;
      })}
      <line x1={sx} y1={sy} x2={sx} y2={sy + h * S} stroke="rgb(255 255 255 / 0.5)" strokeWidth={0.8} />
    </g>
  );
}

/** A flat patch on the ground (roads, water, yards). */
export function Patch({ x, y, w, d, fill, z = 0.01 }: { x: number; y: number; w: number; d: number; fill: string; z?: number }) {
  return <polygon points={pts([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]])} fill={fill} />;
}

/* ── Sky ───────────────────────────────────────────────────────────────────── */
export function Cloud({ cx, cy, s = 1, slow = false }: { cx: number; cy: number; s?: number; slow?: boolean }) {
  return (
    <g className={slow ? "ill-drift-slow" : "ill-drift"}>
      <ellipse cx={cx} cy={cy} rx={18 * s} ry={7 * s} fill="#ffffff" opacity={0.95} />
      <ellipse cx={cx - 8 * s} cy={cy + 1 * s} rx={10 * s} ry={6 * s} fill="#ffffff" />
      <ellipse cx={cx + 6 * s} cy={cy - 4 * s} rx={10 * s} ry={8 * s} fill="#ffffff" />
    </g>
  );
}

/**
 * Light for each shot. Every mood is a light-mode sky that melts into white at the bottom, so cards
 * stay white; the sun’s colour and height change with the time of day.
 */
export const MOODS = {
  dawn: { sky: ["#ffe6d4", "#fff8f2"], sun: ["#fff6ea", "#ffc9a1"], at: [120, -40] },
  morning: { sky: ["#e2f2fc", "#ffffff"], sun: ["#fffaf0", "#ffe1bd"], at: [-120, -110] },
  golden: { sky: ["#ffedd2", "#fffaf3"], sun: ["#fff3dc", "#ffcf8a"], at: [130, -70] },
  dusk: { sky: ["#e7e0f5", "#fff4ee"], sun: ["#ffe9d6", "#ffaf8a"], at: [-130, -45] },
  overcast: { sky: ["#e2e8ee", "#f8fafb"], sun: null, at: [0, 0] },
  clean: { sky: ["#e8f3fb", "#ffffff"], sun: null, at: [0, 0] },
} as const satisfies Record<string, { sky: readonly [string, string]; sun: readonly [string, string] | null; at: readonly [number, number] }>;
export type Mood = keyof typeof MOODS;

export type Backdrop = "plains" | "hills" | "city" | "sea" | "none";

/**
 * How a scene fills its box: "cover" crops to fill (keeping the ground), "contain" fits it whole at
 * full height; either way its small animations run. Default: a card illustration (width-led, still).
 */
export const SceneCover = createContext<false | "cover" | "contain">(false);

/**
 * The frame every scene lives in: the mood’s sky and sun, a painted distance, shared gradients,
 * then the shot. It always fades to white at the bottom edge so it merges with the white card.
 * viewBox is −188…188 × −150…150 (about 5:4), the origin at the centre.
 */
export function Scene({
  label,
  mood = "morning",
  sun,
  backdrop = "plains",
  fade = true,
  children,
}: {
  label: string;
  mood?: Mood;
  sun?: [number, number] | null;
  backdrop?: Backdrop;
  fade?: boolean;
  children: ReactNode;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const m = MOODS[mood];
  const at = sun === undefined ? (m.sun ? m.at : null) : sun;
  const cover = useContext(SceneCover);
  return (
    <svg
      viewBox="-188 -150 376 300"
      role="img"
      aria-label={label}
      preserveAspectRatio={cover === "cover" ? "xMidYMax slice" : cover === "contain" ? "xMidYMid meet" : undefined}
      data-live={cover ? "" : undefined}
      className={cover ? "ill block size-full" : "ill block h-auto w-full"}
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={m.sky[0]} />
          <stop offset="1" stopColor={m.sky[1]} />
        </linearGradient>
        <radialGradient id={`${uid}-sun`}>
          <stop offset="0" stopColor={m.sun?.[0] ?? "#ffffff"} />
          <stop offset="0.25" stopColor={m.sun?.[1] ?? "#ffffff"} />
          <stop offset="0.6" stopColor={m.sun?.[1] ?? "#ffffff"} stopOpacity={0.35} />
          <stop offset="1" stopColor={m.sun?.[1] ?? "#ffffff"} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${uid}-fade`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="ill-panel" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#3f6fb8" />
          <stop offset="1" stopColor="#1f3f75" />
        </linearGradient>
        <linearGradient id="ill-sweep" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0.35" stopColor="rgb(255 255 255 / 0)" />
          <stop offset="0.5" stopColor="rgb(255 255 255 / 0.55)" />
          <stop offset="0.65" stopColor="rgb(255 255 255 / 0)" />
        </linearGradient>
        {[["far", "#e3f2ec"], ["near", "#d3ecdc"], ["city", "#e3f1e8"], ["tower", "#d6e8f3"], ["sea", "#d6eefa"]].map(([id, c]) => (
          <linearGradient key={id} id={`ill-${id}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="-110" y2="30">
            <stop offset="0.45" stopColor={c} />
            <stop offset="1" stopColor="#ffffff" stopOpacity={0} />
          </linearGradient>
        ))}
        <filter id="ill-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <rect x={-188} y={-150} width={376} height={300} fill={`url(#${uid}-sky)`} />
      {at && (
        <g className="ill-glow" style={{ transformOrigin: `${at[0]}px ${at[1]}px` }}>
          <circle cx={at[0]} cy={at[1]} r={50} fill={`url(#${uid}-sun)`} />
          <circle cx={at[0]} cy={at[1]} r={11} fill={m.sun?.[0] ?? "#ffffff"} />
        </g>
      )}
      {backdrop !== "none" && <Distance kind={backdrop} />}
      {children}
      {fade && <rect x={-188} y={96} width={376} height={54} fill={`url(#${uid}-fade)`} pointerEvents="none" />}
    </svg>
  );
}

/** Painted distance behind the diorama (soft silhouettes that fade into the sky). */
function Distance({ kind }: { kind: Exclude<Backdrop, "none"> }) {
  if (kind === "sea") {
    return (
      <g>
        <rect x={-188} y={-62} width={376} height={92} fill="url(#ill-sea)" />
        <path d="M-188,-62 H188" stroke="#ffffff" strokeWidth={1.2} opacity={0.8} />
        <path d="M-160,-50 h40 M-60,-44 h30 M60,-52 h50 M120,-40 h24" stroke="#ffffff" strokeWidth={1} opacity={0.7} />
      </g>
    );
  }
  if (kind === "city") {
    const towers: [number, number][] = [[-170, 30], [-150, 46], [-128, 26], [-104, 58], [-80, 38], [80, 44], [100, 62], [122, 36], [146, 54], [168, 30]];
    return (
      <g>
        <path d="M-188,-40 C-120,-70 -40,-62 0,-54 C60,-46 120,-72 188,-48 V30 H-188 Z" fill="url(#ill-city)" />
        {towers.map(([x, h], i) => (
          <g key={i}>
            <rect x={x} y={-40 - h} width={16} height={h + 70} rx={1.5} fill="url(#ill-tower)" />
            {Array.from({ length: Math.floor(h / 10) }, (_, j) => (
              <rect key={j} x={x + 4} y={-34 - h + j * 10} width={8} height={2} fill="#ffffff" opacity={0.7} />
            ))}
          </g>
        ))}
      </g>
    );
  }
  const far = kind === "hills" ? "M-188,-58 C-150,-110 -110,-112 -70,-74 C-40,-46 -10,-100 30,-104 C70,-108 100,-60 130,-70 C160,-80 175,-96 188,-90 V30 H-188 Z" : "M-188,-52 C-140,-72 -90,-70 -40,-58 C10,-46 60,-74 110,-70 C150,-66 170,-56 188,-60 V30 H-188 Z";
  const near = kind === "hills" ? "M-188,-34 C-140,-70 -100,-60 -60,-40 C-20,-20 20,-72 70,-66 C120,-60 150,-30 188,-44 V30 H-188 Z" : "M-188,-36 C-120,-52 -60,-40 0,-44 C70,-50 130,-34 188,-40 V30 H-188 Z";
  return (
    <g>
      <path d={far} fill="url(#ill-far)" />
      <path d={near} fill="url(#ill-near)" />
    </g>
  );
}

/* ── Lines, machines, places ───────────────────────────────────────────────── */
/** A straight line between two world points. */
export function Line3({ a, b, stroke = "#9aa9b4", width = 0.8, dash, className }: { a: P3; b: P3; stroke?: string; width?: number; dash?: string; className?: string }) {
  const [p, q] = [iso(...a), iso(...b)];
  return <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={stroke} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" className={className} />;
}

/** A tower crane: mast, jib, counter-jib and a load on the hook. */
export function Crane({ x, y, h = 11, jib = 7, load }: { x: number; y: number; h?: number; jib?: number; load?: ReactNode }) {
  const top: P3 = [x, y, h];
  return (
    <g>
      <Box x={x - 0.5} y={y - 0.5} w={1} d={1} h={0.4} tone={T.grey} />
      <Line3 a={[x, y, 0.4]} b={top} stroke="#f0b440" width={2.4} />
      <Line3 a={[x - 0.25, y, 0.4]} b={[x - 0.25, y, h]} stroke="#f7d27e" width={0.6} />
      <Line3 a={[x - 2.4, y, h]} b={[x + jib, y, h]} stroke="#f0b440" width={1.8} />
      <Line3 a={[x, y, h + 1.6]} b={[x + jib, y, h]} stroke="#c9a04f" width={0.5} />
      <Line3 a={[x, y, h + 1.6]} b={[x - 2.4, y, h]} stroke="#c9a04f" width={0.5} />
      <Box x={x - 2.6} y={y - 0.5} z={h - 0.8} w={1.2} d={1} h={0.8} tone={T.steel} shadow={false} />
      <Line3 a={[x + jib - 1.5, y, h]} b={[x + jib - 1.5, y, h - 4]} stroke="#5d7180" width={0.5} />
      {load}
    </g>
  );
}

/** A soft green hill (stepped, like terraces). */
export function Hill({ x, y, w, d, h, tone = T.mint }: { x: number; y: number; w: number; d: number; h: number; tone?: Tone }) {
  return (
    <g>
      <Box x={x} y={y} w={w} d={d} h={h * 0.5} tone={tone} edge={false} />
      <Box x={x + w * 0.15} y={y + d * 0.15} z={h * 0.5} w={w * 0.7} d={d * 0.7} h={h * 0.3} tone={tone} edge={false} shadow={false} />
      <Box x={x + w * 0.3} y={y + d * 0.3} z={h * 0.8} w={w * 0.4} d={d * 0.4} h={h * 0.2} tone={tone} edge={false} shadow={false} />
    </g>
  );
}

/** A pressure gauge, drawn in face units (use inside OnFace). */
export function Gauge({ cx, cy, r, angle = -30 }: { cx: number; cy: number; r: number; angle?: number }) {
  const a = (angle * Math.PI) / 180;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#ffffff" stroke="#9aa9b4" strokeWidth={r * 0.14} />
      {[-120, -80, -40, 0, 40, 80, 120].map((t) => {
        const ta = ((t - 90) * Math.PI) / 180;
        return <line key={t} x1={r3(cx + Math.cos(ta) * r * 0.62)} y1={r3(cy + Math.sin(ta) * r * 0.62)} x2={r3(cx + Math.cos(ta) * r * 0.8)} y2={r3(cy + Math.sin(ta) * r * 0.8)} stroke="#9aa9b4" strokeWidth={r * 0.07} />;
      })}
      <path d={`M${cx - r * 0.55},${cy + r * 0.2} A${r * 0.6},${r * 0.6} 0 0 1 ${cx + r * 0.55},${cy + r * 0.2}`} stroke={BRAND} strokeWidth={r * 0.1} fill="none" opacity={0.6} />
      <line x1={cx} y1={cy} x2={r3(cx + Math.sin(a) * r * 0.7)} y2={r3(cy - Math.cos(a) * r * 0.7)} stroke="#e0533d" strokeWidth={r * 0.1} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r * 0.1} fill={INK} />
    </g>
  );
}

/** A distribution transformer: tank, cooling fins and three bushings. */
export function Transformer({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Box x={x} y={y} w={2.6} d={2} h={0.3} tone={T.grey} />
      <Box x={x + 0.3} y={y + 0.2} z={0.3} w={2} d={1.6} h={2.4} tone={T.sky} />
      <OnFace face="left" at={[x + 0.3, y + 1.8, 2.7]}>
        {Array.from({ length: 6 }, (_, i) => (
          <rect key={i} x={0.15 + i * 0.3} y={0.3} width={0.12} height={1.9} fill="#8fc1e0" />
        ))}
      </OnFace>
      {[0.6, 1.3, 2].map((dx) => (
        <g key={dx}>
          <Line3 a={[x + dx, y + 1, 2.7]} b={[x + dx, y + 1, 3.6]} stroke="#e8eef2" width={2.2} />
          <Line3 a={[x + dx, y + 1, 2.9]} b={[x + dx, y + 1, 3.5]} stroke="#b9c7d1" width={2.2} dash="0.6 0.5" />
        </g>
      ))}
    </g>
  );
}

/** A wooden utility pole with a cross-arm; returns the attach point for wires. */
export function Pole({ x, y, h = 6 }: { x: number; y: number; h?: number }) {
  return (
    <g>
      <Line3 a={[x, y, 0]} b={[x, y, h]} stroke="#b48d64" width={1.6} />
      <Line3 a={[x - 0.9, y, h - 0.4]} b={[x + 0.9, y, h - 0.4]} stroke="#9c7650" width={1.1} />
    </g>
  );
}

/** A cargo ship facing +x with stacked containers. */
export function Ship({ x, y }: { x: number; y: number }) {
  const hullTop = 0.9;
  return (
    <g>
      <polygon
        points={pts([[x, y, 0], [x + 9, y, 0], [x + 10.5, y + 1.2, hullTop], [x + 9, y + 2.6, hullTop], [x + 9, y + 2.6, 0]])}
        fill={T.navy.right}
      />
      <Box x={x} y={y} w={9} d={2.6} h={hullTop} tone={{ top: "#e9eef2", left: T.navy.left, right: T.navy.right }} shadow={false} />
      <Line3 a={[x, y + 2.6, 0.35]} b={[x + 9, y + 2.6, 0.35]} stroke="#e0533d" width={1.2} />
      {[
        [x + 0.6, T.green],
        [x + 2.4, T.blue],
        [x + 4.2, T.white],
        [x + 6, T.green],
      ].map(([cx, tone], i) => (
        <g key={i}>
          <Box x={cx as number} y={y + 0.3} z={hullTop} w={1.6} d={2} h={0.9} tone={tone as Tone} shadow={false} />
          <Box x={cx as number} y={y + 0.3} z={hullTop + 0.9} w={1.6} d={2} h={0.9} tone={i % 2 ? T.white : T.sky} shadow={false} />
        </g>
      ))}
      <Box x={x + 7.8} y={y + 0.4} z={hullTop} w={1.2} d={1.8} h={2.2} tone={T.white} shadow={false} />
    </g>
  );
}
