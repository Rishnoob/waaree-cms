/**
 * Flat (front-view) pieces for the storyboard shots that aren’t dioramas: wide landscapes,
 * close-ups and macros. Same palette and soft light as the iso kit, so the story stays one film.
 * All coordinates are in the Scene’s viewBox (−188…188 × −150…150).
 */
import type { ReactNode } from "react";

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Ground from the horizon down, near ground slightly richer. */
export function Ground({ y, far = "#e3f1df", near = "#cfe9cf" }: { y: number; far?: string; near?: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`ground-${y}-${far.slice(1)}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={far} />
          <stop offset="1" stopColor={near} />
        </linearGradient>
      </defs>
      <rect x={-188} y={y} width={376} height={150 - y} fill={`url(#ground-${y}-${far.slice(1)})`} />
    </g>
  );
}

/** A soft ridge line (hills, mist layers). `pts` are [x, y] knots from left to right. */
export function Ridge({ pts, fill, opacity = 1 }: { pts: [number, number][]; fill: string; opacity?: number }) {
  let d = `M-188,${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]!;
    const [x1, y1] = pts[i + 1]!;
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  d += " V150 H-188 Z";
  return <path d={d} fill={fill} opacity={opacity} />;
}

/** A road running to a vanishing point, with a soft centre line. */
export function Road({ vx, vy, nearW = 120, fill = "#efe2cb", line = "#ffffff" }: { vx: number; vy: number; nearW?: number; fill?: string; line?: string }) {
  return (
    <g>
      <path d={`M${vx - 1.5},${vy} L${vx + 1.5},${vy} L${vx + nearW / 2},150 L${vx - nearW / 2},150 Z`} fill={fill} />
      <path d={`M${vx},${vy + 4} L${vx},150`} stroke={line} strokeWidth={2} strokeDasharray="6 9" opacity={0.7} />
    </g>
  );
}

/** Rows of solar panels receding to the horizon (one-point perspective). */
export function PerspectiveRows({ vx, vy, rows = 6, nearY = 140, left = -188, right = 188 }: { vx: number; vy: number; rows?: number; nearY?: number; left?: number; right?: number }) {
  const out: ReactNode[] = [];
  const at = (x: number, y: number) => vx + (x - vx) * ((y - vy) / (nearY - vy));
  for (let i = rows - 1; i >= 0; i--) {
    // rows bunch up toward the horizon
    const t0 = Math.pow(i / rows, 1.8);
    const t1 = Math.pow((i + 0.55) / rows, 1.8);
    const y0 = r1(vy + (nearY - vy) * t0 + 2);
    const y1 = r1(vy + (nearY - vy) * t1 + 2);
    const [a, b, c, d] = [at(left, y0), at(right, y0), at(right, y1), at(left, y1)];
    out.push(
      <g key={i}>
        <path d={`M${r1(a)},${y0} L${r1(b)},${y0} L${r1(c)},${y1} L${r1(d)},${y1} Z`} fill="url(#ill-panel)" />
        <path d={`M${r1(a)},${y0} L${r1(b)},${y0}`} stroke="#f4f8fb" strokeWidth={0.8} />
        {Array.from({ length: 9 }, (_, k) => {
          const x = left + ((right - left) * (k + 1)) / 10;
          return <line key={k} x1={r1(at(x, y0))} y1={y0} x2={r1(at(x, y1))} y2={y1} stroke="rgb(190 215 245 / 0.45)" strokeWidth={0.6} />;
        })}
        <path className="ill-sweep" d={`M${r1(a)},${y0} L${r1(b)},${y0} L${r1(c)},${y1} L${r1(d)},${y1} Z`} fill="url(#ill-sweep)" style={{ animationDelay: `${i * 0.35}s` }} />
      </g>,
    );
  }
  return <g>{out}</g>;
}

/**
 * A person, simply drawn (no faces: everyone can see themselves in them).
 * `view`: back (looking into the scene), front, or side (walking / carrying, facing right).
 */
export function Figure({
  x,
  y,
  h = 60,
  view = "back",
  shirt = "#ffffff",
  pants = "#4a5c69",
  skin = "#e2ad84",
  hair = "#3a3330",
  hat,
  bag,
  arms = "down",
  female = false,
  dress,
}: {
  x: number;
  y: number;
  h?: number;
  view?: "back" | "front" | "side";
  shirt?: string;
  pants?: string;
  skin?: string;
  hair?: string;
  hat?: string;
  bag?: string;
  arms?: "down" | "up" | "carry";
  /** Long hair (and, by default, a kurta-length top). */
  female?: boolean;
  /** A dress / kurta silhouette over the legs (defaults to on for women not in work gear). */
  dress?: boolean;
}) {
  const wearsDress = dress ?? (female && !hat);
  const u = h / 60; // drawn at 60 units tall
  const head = 6.5 * u;
  const cx = x;
  const top = y - h;
  const shoulderY = top + head * 2 + 2 * u;
  const hipY = top + h * 0.56;
  const sw = view === "side" ? 7 * u : 10 * u;
  return (
    <g>
      <ellipse cx={cx} cy={y} rx={12 * u} ry={2.6 * u} fill="rgb(40 60 70 / 0.14)" />
      {/* legs */}
      <rect x={cx - 4.6 * u} y={hipY} width={4 * u} height={y - hipY} rx={1.8 * u} fill={pants} />
      <rect x={cx + 0.6 * u} y={hipY} width={4 * u} height={y - hipY} rx={1.8 * u} fill={pants} opacity={0.9} />
      {/* arms */}
      {arms === "up" ? (
        <>
          <rect x={cx - sw - 2 * u} y={top + head * 0.4} width={3.6 * u} height={shoulderY - top} rx={1.8 * u} fill={shirt} transform={`rotate(-12 ${cx - sw} ${shoulderY})`} />
          <rect x={cx + sw - 1.6 * u} y={top + head * 0.4} width={3.6 * u} height={shoulderY - top} rx={1.8 * u} fill={shirt} transform={`rotate(12 ${cx + sw} ${shoulderY})`} />
        </>
      ) : arms === "carry" ? (
        <rect x={cx - 2 * u} y={shoulderY + 2 * u} width={14 * u} height={3.6 * u} rx={1.8 * u} fill={shirt} />
      ) : (
        <>
          <rect x={cx - sw - 1.2 * u} y={shoulderY + 1 * u} width={3.6 * u} height={h * 0.33} rx={1.8 * u} fill={shirt} />
          <rect x={cx + sw - 2.4 * u} y={shoulderY + 1 * u} width={3.6 * u} height={h * 0.33} rx={1.8 * u} fill={shirt} />
        </>
      )}
      {/* torso */}
      <path
        d={`M${cx - sw},${shoulderY + 3 * u} Q${cx - sw},${shoulderY} ${cx - sw + 3 * u},${shoulderY} L${cx + sw - 3 * u},${shoulderY} Q${cx + sw},${shoulderY} ${cx + sw},${shoulderY + 3 * u} L${cx + sw * 0.8},${hipY + 2 * u} L${cx - sw * 0.8},${hipY + 2 * u} Z`}
        fill={shirt}
      />
      {wearsDress && (
        <path d={`M${cx - sw * 0.8},${hipY} L${cx + sw * 0.8},${hipY} L${cx + sw * 1.15},${y - (y - hipY) * 0.28} L${cx - sw * 1.15},${y - (y - hipY) * 0.28} Z`} fill={shirt} />
      )}
      {bag && <rect x={cx - sw * 0.7} y={shoulderY + 3 * u} width={sw * 1.4} height={h * 0.26} rx={2 * u} fill={bag} />}
      {female && hat && (
        <path d={`M${cx + head * 0.3},${top + head * 1.4} q${head * 0.9},${head * 0.5} ${head * 0.5},${head * 1.9} q-${head * 0.5},-${head * 0.4} -${head * 0.7},-${head * 1.4} z`} fill={hair} />
      )}
      {/* long hair falls behind the shoulders */}
      {female && !hat && (
        <path
          d={`M${cx - head * 1.05},${top + head} Q${cx - head * 1.2},${top + head * 3.2} ${cx - head * 0.4},${top + head * 3.7} L${cx + head * 0.4},${top + head * 3.7} Q${cx + head * 1.2},${top + head * 3.2} ${cx + head * 1.05},${top + head} Z`}
          fill={hair}
        />
      )}
      {/* head */}
      <rect x={cx - 2 * u} y={top + head * 1.7} width={4 * u} height={3 * u} fill={skin} />
      <circle cx={cx} cy={top + head} r={head} fill={view === "back" ? hair : skin} />
      {view !== "back" && <path d={`M${cx - head},${top + head * 0.95} A${head},${head} 0 0 1 ${cx + head},${top + head * 0.95} Q${cx},${top + head * 0.55} ${cx - head},${top + head * 0.95} Z`} fill={hair} />}
      {hat && <path d={`M${cx - head * 1.15},${top + head * 0.9} A${head * 1.15},${head * 1.05} 0 0 1 ${cx + head * 1.15},${top + head * 0.9} Z`} fill={hat} />}
    </g>
  );
}

/** A distant city skyline. */
export function Skyline({ x, y, w, color = "#cfe1ee", seed = 1 }: { x: number; y: number; w: number; color?: string; seed?: number }) {
  const n = Math.max(4, Math.round(w / 9));
  const bars: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const hh = 8 + (((i * 37 + seed * 13) % 23) / 23) * 26;
    bars.push(<rect key={i} x={r1(x + (i * w) / n)} y={r1(y - hh)} width={r1(w / n - 1.2)} height={r1(hh)} rx={0.8} fill={color} />);
  }
  return <g>{bars}</g>;
}

/** A small village house, front view. */
export function Hut({ x, y, w = 26, h = 18, wall = "#f6e8d2", roof = "#f2b783" }: { x: number; y: number; w?: number; h?: number; wall?: string; roof?: string }) {
  return (
    <g>
      <rect x={x - w / 2} y={y - h} width={w} height={h} fill={wall} />
      <path d={`M${x - w / 2 - 3},${y - h} L${x},${y - h - h * 0.7} L${x + w / 2 + 3},${y - h} Z`} fill={roof} />
      <rect x={x - 3.5} y={y - h * 0.62} width={7} height={h * 0.62} rx={1} fill="#c99c74" />
    </g>
  );
}

/** A village temple with its flag (front view). */
export function Temple({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g>
      <rect x={x - 16 * s} y={y - 14 * s} width={32 * s} height={14 * s} fill="#ffe3c4" />
      <rect x={x - 11 * s} y={y - 24 * s} width={22 * s} height={10 * s} fill="#ffd9b0" />
      <path d={`M${x - 8 * s},${y - 24 * s} Q${x},${y - 46 * s} ${x + 8 * s},${y - 24 * s} Z`} fill="#ffcf9a" />
      <line x1={x} y1={y - 44 * s} x2={x} y2={y - 58 * s} stroke="#b48d64" strokeWidth={1.2} />
      <path className="ill-bob" d={`M${x},${y - 58 * s} l10,3 l-10,3 z`} fill="#ff9d4d" />
      <rect x={x - 3 * s} y={y - 9 * s} width={6 * s} height={9 * s} rx={3 * s} fill="#e8b98a" />
    </g>
  );
}
