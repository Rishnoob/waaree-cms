import "./sun-motes.css";

// Fixed positions/timings (no randomness at render, so server and browser HTML match).
const MOTES = Array.from({ length: 34 }, (_, i) => {
  // well-scattered pseudo-random values (rounded below, so server and browser agree)
  const r = (n: number) => {
    const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: Math.round(r(1) * 1000) / 10,
    top: Math.round((10 + r(2) * 95) * 10) / 10,
    size: Math.round((6 + r(3) * 16) * 10) / 10,
    dur: Math.round((14 + r(4) * 16) * 10) / 10,
    delay: -Math.round(r(5) * 30 * 10) / 10,
    drift: Math.round((r(6) * 60 - 30) * 10) / 10,
    glow: r(7) > 0.7,
  };
});

/** Warm motes of sunlight drifting up through the hero, echoing the sun beside the Earth. */
export function SunMotes() {
  return (
    <div aria-hidden className="sun-motes pointer-events-none absolute inset-0 overflow-hidden">
      {MOTES.map((m, i) => (
        <span
          key={i}
          className={m.glow ? "mote mote-glow" : "mote"}
          style={
            {
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              animationDuration: `${m.dur}s`,
              animationDelay: `${m.delay}s`,
              "--drift": `${m.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
