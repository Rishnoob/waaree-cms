import { GLOBE_DOTS, GLOBE_INDIA_MASK } from "../data/globe-dots";

/**
 * A locator for sites without a photo: the region around the site as dotted land (Natural Earth,
 * the same data as the globe) with a glowing pin at the real coordinates. Honest, and still visual;
 * swap in Waaree’s photo when one is published.
 */
export function Locator({ lat, lon, label }: { lat: number; lon: number; label: string }) {
  const W = 320;
  const H = 180;
  const spanLon = 64; // degrees shown across
  const spanLat = (spanLon * H) / W;
  const x = (lo: number) => ((lo - (lon - spanLon / 2)) / spanLon) * W;
  const y = (la: number) => ((lat + spanLat / 2 - la) / spanLat) * H;

  let d = "";
  let india = "";
  for (let i = 0; i < GLOBE_DOTS.length; i += 2) {
    const la = GLOBE_DOTS[i]!;
    const lo = GLOBE_DOTS[i + 1]!;
    if (Math.abs(la - lat) > spanLat / 2 + 2 || Math.abs(lo - lon) > spanLon / 2 + 2) continue;
    const px = x(lo);
    const py = y(la);
    const dot = `M${(px - 1.6).toFixed(1)},${py.toFixed(1)}a1.6,1.6 0 1,0 3.2,0a1.6,1.6 0 1,0 -3.2,0`;
    if (GLOBE_INDIA_MASK[i / 2] === "1") india += dot;
    else d += dot;
  }
  const cx = W / 2;
  const cy = H / 2;
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";

  return (
    <div className="absolute inset-0 bg-[linear-gradient(160deg,#f3faf6_0%,#eaf5fb_100%)]">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Map locating ${label}`} className="size-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id={`loc-glow-${label.replace(/\W/g, "")}`}>
            <stop offset="0" stopColor="#13b65c" stopOpacity={0.35} />
            <stop offset="1" stopColor="#13b65c" stopOpacity={0} />
          </radialGradient>
        </defs>
        <path d={d} fill="#8fbfa6" opacity={0.55} />
        {/* India, where it all began, in Waaree green */}
        <path d={india} fill="#3ccf7e" opacity={0.55} />
        <circle cx={cx} cy={cy} r={34} fill={`url(#loc-glow-${label.replace(/\W/g, "")})`} />
        <circle cx={cx} cy={cy} r={9} fill="none" stroke="#13b65c" strokeOpacity={0.45} className="motion-safe:animate-[ping_2.8s_ease-out_infinite] [transform-box:fill-box] [transform-origin:center]" />
        <circle cx={cx} cy={cy} r={4.5} fill="#13b65c" stroke="#ffffff" strokeWidth={2} />
      </svg>
      <span className="absolute bottom-3 left-4 font-mono text-[0.6875rem] tracking-wide text-muted tabular-nums">
        {Math.abs(lat).toFixed(2)}° {ns} · {Math.abs(lon).toFixed(2)}° {ew}
      </span>
    </div>
  );
}
