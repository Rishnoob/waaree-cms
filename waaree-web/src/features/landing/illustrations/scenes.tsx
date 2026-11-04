/**
 * “Our legacy” as a storyboard: every year is its own shot (wide, close-up, macro, map, split
 * frame, diorama) with its own light (dawn, morning, golden hour, dusk, overcast), so the timeline
 * reads like a film rather than a template. What each shot shows is sourced in
 * docs/research/waaree.md (“Legacy scenes”).
 */
import type { ReactNode } from "react";

import { INDIA_DOTS, INDIA_OUTLINE, INDIA_VIEWBOX, projectIndia } from "../data/india-map";
import { Figure, Ground, Hut, PerspectiveRows, Ridge, Road, Skyline, Temple } from "./flat";
import {
  BRAND,
  Box,
  Cloud,
  Cylinder,
  Gable,
  Gauge,
  Line3,
  OnFace,
  PanelField,
  Patch,
  Person,
  Pole,
  RoofPanels,
  Scene,
  Ship,
  Slab,
  T,
  Transformer,
  Tree,
  Truck,
  Windows,
  iso,
} from "./iso";

const POPPINS = "Poppins, sans-serif";
const INK_TEXT = "#3d4f5c";
const WARM = "#ffd99a"; // lit windows at dusk

function WaareeSign({ x, y, w = 5.2, size = 1.05 }: { x: number; y: number; w?: number; size?: number }) {
  return (
    <>
      <rect x={x} y={y} width={w} height={size * 1.2} rx={0.2} fill="#ffffff" />
      <text x={x + 0.3} y={y + size * 0.95} fontSize={size} fontWeight={800} fill={BRAND} fontStyle="italic" fontFamily={POPPINS}>
        WAAREE
      </text>
    </>
  );
}

/** A tree, front view. */
function FlatTree({ x, y, s = 1, kind = "round", color = "#9ed8b0" }: { x: number; y: number; s?: number; kind?: "round" | "pine"; color?: string }) {
  return kind === "pine" ? (
    <g>
      <rect x={x - 1} y={y - 6 * s} width={2} height={6 * s} fill="#b48d64" />
      <path d={`M${x},${y - 30 * s} L${x + 9 * s},${y - 5 * s} L${x - 9 * s},${y - 5 * s} Z`} fill={color} />
    </g>
  ) : (
    <g>
      <rect x={x - 1.2} y={y - 10 * s} width={2.4} height={10 * s} fill="#b48d64" />
      <circle cx={x} cy={y - 16 * s} r={9 * s} fill={color} />
      <circle cx={x - 3 * s} cy={y - 19 * s} r={4.5 * s} fill="#ffffff" opacity={0.3} />
    </g>
  );
}

function Birds({ x, y }: { x: number; y: number }) {
  return (
    <g className="ill-drift-slow" stroke="#9aa9b4" strokeWidth={1} fill="none" strokeLinecap="round">
      <path d={`M${x},${y} q3,-3 6,0 q3,-3 6,0`} />
      <path d={`M${x + 16},${y - 8} q2.5,-2.5 5,0 q2.5,-2.5 5,0`} />
      <path d={`M${x - 14},${y - 4} q2,-2 4,0 q2,-2 4,0`} />
    </g>
  );
}

/* ── 1985 · Wide shot at dawn: a young man on the road out of his village, Mumbai on the horizon. */
function Village1985() {
  return (
    <Scene label="1985, dawn: a young man walks the road out of his village toward the city on the horizon; his mother waves from the doorway" mood="dawn" backdrop="none">
      <Ridge pts={[[-188, -18], [-110, -34], [-20, -20], [60, -28], [188, -16]]} fill="#f3ddd0" opacity={0.85} />
      <Skyline x={78} y={-12} w={78} color="#ecd3c8" seed={3} />
      <Ground y={-12} far="#efe5cf" near="#d8eac6" />
      <g stroke="#e3d8b8" strokeWidth={1.2}>
        {[-170, -140, -110, -80, -50].map((x0, i) => (
          <line key={i} x1={x0} y1={150} x2={10 + i * 12} y2={-10} />
        ))}
      </g>
      <Road vx={110} vy={-12} nearW={170} />
      <Temple x={-128} y={34} s={1.15} />
      <Hut x={-62} y={18} w={30} h={20} />
      <Hut x={-168} y={58} w={26} h={18} wall="#fbefe0" />
      <FlatTree x={-92} y={22} s={1.2} />
      <FlatTree x={-20} y={8} s={0.9} />
      <FlatTree x={-176} y={30} s={1} kind="pine" />
      {/* his mother, waving from the doorway */}
      <Figure x={-62} y={18} h={20} view="front" shirt="#ff9d6b" arms="up" hair="#2e2723" female />
      {/* him: back to us, bag on his shoulder, walking toward the sunrise */}
      <Figure x={92} y={138} h={78} view="back" shirt="#ffffff" pants="#6b7d89" bag="#c9a27a" />
      <Birds x={60} y={-80} />
    </Scene>
  );
}

/* ── 1989 · Close-up: behind the counter of a small Mumbai gauge shop. */
function Trading1989() {
  return (
    <Scene label="1989: inside a small Mumbai shop, the young trader stands behind his counter of pressure gauges" mood="morning" sun={null} backdrop="none">
      <rect x={-188} y={-150} width={376} height={300} fill="#fbf5ec" />
      <rect x={-172} y={-118} width={96} height={86} rx={4} fill="#dff0fa" />
      <Skyline x={-170} y={-34} w={92} color="#c4dcec" seed={5} />
      <path d="M-172,-75 H-76 M-124,-118 V-32" stroke="#ffffff" strokeWidth={3} />
      <rect x={-172} y={-118} width={96} height={86} rx={4} fill="none" stroke="#e8d3b4" strokeWidth={5} />
      <path d="M-160,-30 L-60,-30 L20,150 L-130,150 Z" fill="#fff6dc" opacity={0.55} />
      {[-86, -30].map((sy) => (
        <g key={sy}>
          <rect x={20} y={sy} width={160} height={4} rx={2} fill="#e3cba6" />
          {[40, 78, 116, 154].map((gx, i) => (
            <Gauge key={gx} cx={gx} cy={sy - 15} r={13} angle={-60 + ((i * 47 - sy) % 120)} />
          ))}
        </g>
      ))}
      <rect x={-40} y={-138} width={150} height={24} rx={4} fill="#ffffff" stroke="#e3cba6" strokeWidth={1.5} />
      <text x={35} y={-121} textAnchor="middle" fontSize={11} fontWeight={700} fill={INK_TEXT} fontFamily={POPPINS} letterSpacing={2}>
        INSTRUMENTS
      </text>
      <Figure x={-28} y={96} h={128} view="front" shirt="#ffffff" pants="#6b7d89" arms="carry" />
      <Gauge cx={-6} cy={4} r={15} angle={30} />
      <rect x={-188} y={58} width={376} height={92} fill="#e8d3b4" />
      <rect x={-188} y={52} width={376} height={10} rx={2} fill="#f3e4cc" />
      <rect x={70} y={26} width={58} height={28} rx={3} fill="#efdcbd" />
      <Gauge cx={86} cy={22} r={10} angle={-20} />
      <Gauge cx={110} cy={24} r={8} angle={50} />
      <Figure x={150} y={170} h={124} view="back" shirt="#7cc8f0" hair="#2e2723" female />
      <rect x={-140} y={38} width={44} height={16} rx={2} fill="#ffffff" />
      <path d="M-134,44 h32 M-134,49 h24" stroke="#c9d3da" strokeWidth={1.4} />
    </Scene>
  );
}

/* ── 1990 · Diorama, morning: the Waaree Instruments workshop. */
function Instruments1990() {
  return (
    <Scene label="1990: the Waaree Instruments workshop, making precision pressure gauges and valves">
      <Cloud cx={110} cy={-110} s={0.8} />
      <Slab />
      <Box x={-8} y={-7} w={9} d={6.5} h={4} tone={T.white} />
      <Gable x={-8} y={-7} z={4} w={9} d={6.5} rise={1.8} tone={T.sky} />
      <OnFace face="left" at={[-8, -0.5, 4]}>
        <WaareeSign x={0.6} y={0.4} w={5} size={0.95} />
        <text x={0.65} y={2.3} fontSize={0.55} fontWeight={600} fill={INK_TEXT} fontFamily={POPPINS} letterSpacing={0.08}>
          INSTRUMENTS
        </text>
        <Gauge cx={7.3} cy={1.6} r={1.05} angle={25} />
        <rect x={0.8} y={2.8} width={3.4} height={1.2} rx={0.1} fill="#dff0fa" />
      </OnFace>
      <Box x={2.5} y={-3} w={5} d={2.5} h={0.6} tone={T.grey} />
      <Line3 a={[3, -1.8, 1.2]} b={[7, -1.8, 1.2]} stroke="#9aa9b4" width={2.6} />
      <Line3 a={[5, -1.8, 1.2]} b={[5, -1.8, 3]} stroke="#9aa9b4" width={2.6} />
      <Cylinder x={4} y={-1.8} z={0.9} r={0.45} h={0.7} tone={T.green} />
      <Cylinder x={6.2} y={-1.8} z={0.9} r={0.45} h={0.7} tone={T.green} />
      {(() => {
        const [gx, gy] = iso(5, -1.8, 3.4);
        return (
          <g transform={`translate(${gx} ${gy}) scale(6)`}>
            <Gauge cx={0} cy={0} r={1} angle={10} />
          </g>
        );
      })()}
      <Person x={4.2} y={1.2} shirt="#3ea9e0" bob female />
      <Person x={6.4} y={1.6} shirt="#ffffff" />
      <Truck x={-7} y={3} cargo="box" />
      <Tree x={8.6} y={-8.4} s={1} kind="pine" />
      <Tree x={8.4} y={6.4} s={1.1} />
    </Scene>
  );
}

/* ── 2007 · Split frame: grey Hamburg, where the question was asked, and the Indian sun that answered it. */
function Solar2007() {
  return (
    <Scene label="2007: on the left, a grey Hamburg exhibition where a visitor studies a solar panel; on the right, India’s bright sun over Waaree’s first solar factory" mood="overcast" backdrop="none">
      <defs>
        <linearGradient id="s07-warm" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ffe9c9" />
          <stop offset="1" stopColor="#fffaf3" />
        </linearGradient>
        <radialGradient id="s07-sun">
          <stop offset="0" stopColor="#fff6e6" />
          <stop offset="0.3" stopColor="#ffd08a" />
          <stop offset="1" stopColor="#ffd08a" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* left: Hamburg, overcast */}
      <Skyline x={-186} y={-10} w={180} color="#d5dde4" seed={8} />
      <rect x={-188} y={-10} width={188} height={160} fill="#e9edf0" />
      <g stroke="#c9d3da" strokeWidth={0.8} opacity={0.7}>
        {[-170, -140, -110, -80, -50, -20].map((x) => (
          <line key={x} x1={x} y1={-120} x2={x - 6} y2={-100} />
        ))}
      </g>
      <ellipse cx={-120} cy={-110} rx={46} ry={14} fill="#f4f6f8" />
      <ellipse cx={-60} cy={-96} rx={36} ry={11} fill="#f4f6f8" />
      <rect x={-150} y={-40} width={110} height={90} rx={3} fill="#ffffff" stroke="#d5dde4" />
      <text x={-95} y={-26} textAnchor="middle" fontSize={8} fontWeight={700} fill="#7d8c97" fontFamily={POPPINS} letterSpacing={1.5}>
        SOLAR
      </text>
      <path d="M-126,-16 L-64,-16 L-58,36 L-132,36 Z" fill="url(#ill-panel)" stroke="#f4f8fb" strokeWidth={1.2} />
      <g stroke="rgb(190 215 245 / 0.5)" strokeWidth={0.6}>
        {[1, 2, 3, 4, 5].map((k) => (
          <line key={k} x1={-126 + k * 10.3} y1={-16} x2={-132 + k * 12.3} y2={36} />
        ))}
        {[1, 2, 3].map((k) => (
          <line key={k} x1={-127.5} y1={-16 + k * 13} x2={-62 + k * 1.5} y2={-16 + k * 13} />
        ))}
      </g>
      <Figure x={-60} y={130} h={84} view="back" shirt="#7d8c97" pants="#4a5c69" />
      <text x={-176} y={-128} fontSize={8} fontWeight={600} fill="#7d8c97" fontFamily={POPPINS} letterSpacing={1}>
        HAMBURG
      </text>
      {/* right: India, the answer */}
      <rect x={0} y={-150} width={188} height={300} fill="url(#s07-warm)" />
      <circle cx={104} cy={-86} r={62} fill="url(#s07-sun)" className="ill-glow" style={{ transformOrigin: "104px -86px" }} />
      <circle cx={104} cy={-86} r={13} fill="#fff6e6" />
      <rect x={0} y={-6} width={188} height={156} fill="#d8eecf" />
      <path d="M12,-6 V-34 L40,-50 V-34 L68,-50 V-34 L96,-50 V-34 L124,-50 V-6 Z" fill="#ffffff" />
      <path d="M40,-50 V-34 M68,-50 V-34 M96,-50 V-34 M124,-50 V-34" stroke="#bfe2f5" strokeWidth={3} />
      <rect x={24} y={-30} width={56} height={13} rx={2} fill="#ffffff" stroke="#e3ece9" />
      <text x={29} y={-20} fontSize={9.5} fontWeight={800} fontStyle="italic" fill={BRAND} fontFamily={POPPINS}>
        WAAREE
      </text>
      <PerspectiveRows vx={96} vy={-4} rows={4} nearY={120} left={10} right={190} />
      <text x={176} y={-128} textAnchor="end" fontSize={8} fontWeight={600} fill="#c08a3e" fontFamily={POPPINS} letterSpacing={1}>
        SURAT
      </text>
      <line x1={0} y1={-150} x2={0} y2={150} stroke="#ffffff" strokeWidth={3} />
    </Scene>
  );
}

/* ── 2011 · Wide, golden hour: the first EPC plant, rows to the horizon, a crew lifting a module into place. */
function Epc2011() {
  return (
    <Scene label="2011, golden hour: rows of solar panels stretch to the horizon as two workers carry a module to the next row" mood="golden" backdrop="none">
      <Ridge pts={[[-188, -24], [-80, -32], [40, -22], [188, -30]]} fill="#f2e4c8" />
      <Ground y={-20} far="#f4e8cf" near="#ebd9b4" />
      <PerspectiveRows vx={40} vy={-20} rows={7} nearY={112} left={-300} right={60} />
      <path d="M78,58 L170,48 L174,60 L82,70 Z" fill="url(#ill-panel)" stroke="#f4f8fb" strokeWidth={1.2} />
      <Figure x={96} y={140} h={74} view="back" shirt="#ff9d4d" pants="#4a5c69" hat="#ffd25e" arms="up" />
      <Figure x={152} y={136} h={72} view="back" shirt="#ff9d4d" pants="#4a5c69" hat="#ffd25e" arms="up" female />
      <Figure x={-30} y={70} h={34} view="front" shirt="#3ea9e0" hat="#ffffff" female />
      <Birds x={-120} y={-90} />
    </Scene>
  );
}

/* ── 2014 · Painterly landscape: the green hills and rivers of India’s northeast. */
function Neepco2014() {
  return (
    <Scene label="2014: misty green hills of India’s northeast, a river winding through, and a solar plant on a terrace" mood="morning" backdrop="none">
      <Ridge pts={[[-188, -40], [-120, -78], [-40, -52], [40, -86], [120, -58], [188, -70]]} fill="#dcece4" />
      <rect x={-188} y={-56} width={376} height={30} fill="#ffffff" opacity={0.5} />
      <Ridge pts={[[-188, -10], [-100, -44], [-10, -18], [90, -48], [188, -20]]} fill="#c9e5d3" />
      {[[-130, -30], [-112, -36], [70, -36], [92, -42], [110, -36]].map(([x, y], i) => (
        <FlatTree key={i} x={x!} y={y!} s={0.7} kind="pine" color="#a9d9ba" />
      ))}
      <rect x={-188} y={-20} width={376} height={22} fill="#ffffff" opacity={0.45} />
      <Ridge pts={[[-188, 30], [-60, 6], [60, 22], [188, 4]]} fill="#b6dcc2" />
      <path d="M-30,10 C-10,40 -90,60 -40,90 C0,114 -60,130 -40,150 L20,150 C0,130 60,110 20,88 C-20,64 40,40 -10,10 Z" fill="#cfeaf8" />
      <path d="M-24,40 q8,4 16,0 M-30,96 q10,5 20,0" stroke="#ffffff" strokeWidth={1.4} fill="none" opacity={0.8} />
      <g transform="translate(92 50) scale(0.62)">
        <PanelField x={-8} y={-4} cols={5} rows={2} />
      </g>
      {[[-150, 40], [-120, 52], [160, 30], [150, 70]].map(([x, y], i) => (
        <FlatTree key={i} x={x!} y={y!} s={1} kind={i % 2 ? "round" : "pine"} />
      ))}
      <Cloud cx={-80} cy={-118} s={0.8} slow />
    </Scene>
  );
}

/* ── 2017 · Diorama at dusk: a Waaree store lights up a small-town street. */
function Franchise2017() {
  return (
    <Scene label="2017, dusk: a Waaree solar store glows on a small-town street; homes around it carry rooftop solar" mood="dusk">
      <Slab />
      <Patch x={-10} y={1.2} w={20} d={2.2} fill="#eceff1" />
      <Box x={-9} y={-8.5} w={4} d={4} h={2.4} tone={T.sand} />
      <RoofPanels x={-8.6} y={-7.8} z={2.4} cols={2} />
      <OnFace face="left" at={[-9, -4.5, 2.4]}>
        <Windows x={0.6} y={0.6} w={1} h={0.9} n={2} gap={0.8} fill={WARM} />
      </OnFace>
      <Box x={-4} y={-8.5} w={4} d={4} h={3} tone={T.white} />
      <RoofPanels x={-3.6} y={-7.8} z={3} cols={2} />
      <OnFace face="left" at={[-4, -4.5, 3]}>
        <Windows x={0.6} y={0.8} w={1} h={1} n={2} gap={0.8} fill={WARM} />
      </OnFace>
      <Box x={1} y={-8.5} w={3.6} d={4} h={2.2} tone={T.peach} />
      <Gable x={1} y={-8.5} z={2.2} w={3.6} d={4} rise={1.4} tone={T.sky} wall={T.peach} />
      <Box x={-6} y={-3.8} w={7} d={4} h={3.2} tone={T.white} />
      <OnFace face="left" at={[-6, 0.2, 3.2]}>
        <rect x={0} y={0} width={7} height={1.1} fill={BRAND} />
        <text x={0.5} y={0.82} fontSize={0.75} fontWeight={800} fill="#ffffff" fontStyle="italic" fontFamily={POPPINS}>
          WAAREE
        </text>
        <text x={3.4} y={0.8} fontSize={0.42} fontWeight={600} fill="#e9fff0" fontFamily={POPPINS} letterSpacing={0.05}>
          SOLAR STORE
        </text>
        <rect x={0.5} y={1.5} width={3.8} height={1.5} rx={0.1} fill={WARM} />
        <rect x={4.8} y={1.5} width={1.6} height={1.7} rx={0.1} fill="#ffe7bf" />
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={i} cx={0.4 + i * 0.9} cy={1.25} r={0.12} fill="#fff1c9" className="ill-blink" style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
      </OnFace>
      <RoofPanels x={-5.4} y={-3.2} z={3.2} cols={4} />
      <Person x={-1} y={1.8} shirt="#ff9d4d" bob />
      <Person x={0.4} y={2.2} shirt="#7cc8f0" female />
      <Person x={-2.2} y={2.6} shirt="#ffffff" />
      <g className="ill-drive">
        <Truck x={2.6} y={1.6} />
      </g>
      <Tree x={7.8} y={-7.2} s={1.1} />
      <Tree x={-8.8} y={7.6} s={1} />
      <Tree x={8.6} y={6.4} s={0.8} kind="pine" />
    </Scene>
  );
}

/* ── 2018–19 · Wide seascape: the first global EPC, modules crossing the sea to Vietnam. */
function Global2018() {
  return (
    <Scene label="2018: a cargo ship carries Waaree modules across open sea toward a palm-lined coast with a solar plant" mood="morning" backdrop="none">
      <rect x={-188} y={-30} width={376} height={180} fill="#d2ecf9" />
      <rect x={-188} y={-30} width={376} height={60} fill="#e6f5fc" />
      <path d="M60,-30 C90,-44 140,-46 188,-40 V-30 Z" fill="#cfe8d4" />
      <path d="M92,-36 L170,-40 L172,-35 L94,-31 Z" fill="url(#ill-panel)" />
      {[[80, -32], [176, -40], [150, -42]].map(([x, y], i) => (
        <g key={i} stroke="#7fc79a" strokeWidth={1.6} fill="none" strokeLinecap="round">
          <path d={`M${x},${y} q1,-8 0,-14`} stroke="#b89a74" strokeWidth={1.2} />
          <path d={`M${x},${y! - 14} q-6,0 -9,4 M${x},${y! - 14} q6,0 9,4 M${x},${y! - 14} q-3,-5 -7,-6 M${x},${y! - 14} q3,-5 7,-6`} />
        </g>
      ))}
      <g stroke="#ffffff" strokeWidth={1.2} opacity={0.8} fill="none">
        <path d="M-170,0 q8,-3 16,0 M-60,-12 q8,-3 16,0 M120,20 q8,-3 16,0 M-120,80 q10,-4 20,0 M70,110 q10,-4 20,0" />
      </g>
      <g className="ill-sail">
        <g transform="translate(-30 40) scale(1.7)">
          <Ship x={-5} y={-1} />
        </g>
        <path d="M-150,96 q40,10 90,-4" stroke="#ffffff" strokeWidth={2} fill="none" opacity={0.85} />
      </g>
      <Birds x={40} y={-92} />
      <Cloud cx={-40} cy={-110} s={0.9} />
    </Scene>
  );
}

/* ── 2019–21 · Map: India lights up as the franchise network spreads from Gujarat. */
const MAP_SCALE = 0.255;
const NETWORK = (() => {
  const pts: [number, number][] = [];
  for (let i = 0; i < INDIA_DOTS.length / 2; i += 19) pts.push([INDIA_DOTS[i * 2]!, INDIA_DOTS[i * 2 + 1]!]);
  return pts;
})();
function Network2019() {
  const hub = projectIndia(72.9, 21);
  const ox = -(INDIA_VIEWBOX.width * MAP_SCALE) / 2;
  const oy = -(INDIA_VIEWBOX.height * MAP_SCALE) / 2 + 4;
  return (
    <Scene label="2019: a map of India lighting up with Waaree partners, lines reaching out from the factories in Gujarat" mood="clean" backdrop="none" fade={false}>
      <g transform={`translate(${ox} ${oy}) scale(${MAP_SCALE})`}>
        <path d={INDIA_OUTLINE} fill="#e6f4ec" stroke="#ffffff" strokeWidth={6} />
        {NETWORK.filter((_, i) => i % 7 === 0).map(([x, y], i) => (
          <line key={i} x1={hub.x} y1={hub.y} x2={x} y2={y} stroke="#6bd897" strokeWidth={2.4} opacity={0.5} />
        ))}
        {NETWORK.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={7} fill={i % 3 ? "#2fb46a" : "#3ea9e0"} className="ill-blink" style={{ animationDelay: `${(i % 11) * 0.25}s` }} />
        ))}
        <circle cx={hub.x} cy={hub.y} r={28} fill="#0db02b" opacity={0.18} className="ill-glow" style={{ transformOrigin: `${hub.x}px ${hub.y}px` }} />
        <circle cx={hub.x} cy={hub.y} r={12} fill="#0db02b" />
      </g>
    </Scene>
  );
}

/* ── 2022–24 · Close-up: listing day. The board climbs; the crowd celebrates. */
function Listed2022() {
  const chart = "M-110,-6 L-80,-14 L-56,-8 L-30,-34 L-6,-28 L24,-58 L52,-50 L84,-86 L110,-96";
  const confetti: [number, number, string][] = [[-150, -120, "#0db02b"], [-96, -136, "#28a9e2"], [-40, -116, "#ffb02e"], [20, -138, "#0db02b"], [70, -122, "#ff9d4d"], [130, -132, "#28a9e2"], [160, -108, "#0db02b"], [-170, -96, "#ff9d4d"]];
  return (
    <Scene label="2024, listing day: a big board shows Waaree’s share price climbing as a crowd cheers below, confetti in the air" mood="golden" sun={null} backdrop="none">
      <rect x={-150} y={-120} width={300} height={150} rx={8} fill="#ffffff" stroke="#e7ece9" strokeWidth={2} />
      <text x={-130} y={-96} fontSize={14} fontWeight={800} fontStyle="italic" fill={BRAND} fontFamily={POPPINS}>
        WAAREE
      </text>
      <text x={130} y={-96} textAnchor="end" fontSize={11} fontWeight={700} fill="#1fa463" fontFamily={POPPINS}>
        ▲ LISTED · NSE · BSE
      </text>
      <path d={`${chart} L110,20 L-110,20 Z`} fill="rgb(13 176 43 / 0.1)" />
      <path d={chart} stroke={BRAND} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={110} cy={-96} r={5} fill={BRAND} className="ill-blink" />
      {confetti.map(([x, y, c], i) => (
        <rect key={i} x={x} y={y} width={7} height={3.5} rx={1} fill={c} className="ill-rise" style={{ animationDelay: `${i * 0.4}s` }} transform={`rotate(${i * 37} ${x} ${y})`} />
      ))}
      <rect x={-188} y={96} width={376} height={54} fill="#f7efe2" />
      <Figure x={-140} y={150} h={96} view="back" shirt="#3ea9e0" arms="up" />
      <Figure x={-78} y={150} h={88} view="back" shirt="#ffffff" female dress={false} />
      <Figure x={-14} y={150} h={100} view="back" shirt="#ff9d4d" arms="up" hair="#5a4636" />
      <Figure x={52} y={150} h={90} view="back" shirt="#6bd897" female dress={false} hair="#5a4636" />
      <Figure x={118} y={150} h={98} view="back" shirt="#ffffff" arms="up" />
      <Figure x={172} y={150} h={84} view="back" shirt="#7cc8f0" female dress={false} />
    </Scene>
  );
}

/* ── 2024–25 · Macro: one blue solar cell in gloved hands, light sweeping across it. */
function Cells2024() {
  return (
    <Scene label="2025: a close-up of a single blue solar cell held in gloved hands in a clean room" mood="clean" backdrop="none">
      <defs>
        <linearGradient id="c24-cell" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#4a7ac4" />
          <stop offset="1" stopColor="#1d3d72" />
        </linearGradient>
      </defs>
      {[[-140, -100, 18], [150, -80, 26], [-120, 60, 14], [130, 90, 20], [40, -120, 12]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" opacity={0.6} />
      ))}
      <ellipse cx={8} cy={118} rx={92} ry={10} fill="rgb(30 60 110 / 0.12)" filter="url(#ill-soft)" />
      <g transform="rotate(-8)" className="ill-bob">
        <path d="M-78,-90 H78 L90,-78 V78 L78,90 H-78 L-90,78 V-78 Z" fill="url(#c24-cell)" stroke="#e9f1f8" strokeWidth={2} />
        <g stroke="rgb(220 232 245 / 0.45)" strokeWidth={0.7}>
          {Array.from({ length: 30 }, (_, i) => (
            <line key={i} x1={-88} y1={-84 + i * 5.8} x2={88} y2={-84 + i * 5.8} />
          ))}
        </g>
        {[-54, -18, 18, 54].map((x) => (
          <rect key={x} x={x - 1.6} y={-88} width={3.2} height={176} fill="#e6edf3" />
        ))}
        <path className="ill-sweep" d="M-78,-90 H78 L90,-78 V78 L78,90 H-78 L-90,78 V-78 Z" fill="url(#ill-sweep)" />
      </g>
    </Scene>
  );
}

/* ── 2025 · Diorama at dusk: power flows from a transformer, along the lines, into a home that lights up. */
function Grid2025() {
  return (
    <Scene label="2025, dusk: a transformer feeds power along the lines to a home whose windows glow, its smart meter blinking green" mood="dusk">
      <Slab />
      <Transformer x={-8} y={-7} />
      <Box x={-8.6} y={-7.6} w={4} d={0.15} h={2.2} tone={T.grey} shadow={false} />
      <Pole x={-2} y={-4} />
      <Pole x={3} y={-1} />
      <Line3 a={[-6.7, -6, 3.6]} b={[-2.9, -4, 5.6]} stroke="#6b7d89" width={0.5} />
      <Line3 a={[-1.1, -4, 5.6]} b={[2.1, -1, 5.6]} stroke="#6b7d89" width={0.5} />
      <Line3 a={[-2.9, -4, 5.6]} b={[2.1, -1, 5.6]} stroke="#6b7d89" width={0.5} />
      <Line3 a={[-1.1, -4, 5.6]} b={[3.9, -1, 5.6]} stroke="#6b7d89" width={0.5} />
      <Line3 a={[-1.1, -4, 5.6]} b={[3.9, -1, 5.6]} stroke="#ffd25e" width={1.4} dash="1 9" className="ill-roll" />
      <Line3 a={[-6.7, -6, 3.6]} b={[-2.9, -4, 5.6]} stroke="#ffd25e" width={1.4} dash="1 9" className="ill-roll" />
      <Box x={2} y={2} w={6} d={5} h={3} tone={T.white} />
      <Gable x={2} y={2} z={3} w={6} d={5} rise={2} tone={T.peach} />
      <RoofPanels x={2.4} y={4.6} z={3.4} cols={3} w={1.6} />
      <Line3 a={[3.9, -1, 5.6]} b={[5, 2, 3.4]} stroke="#6b7d89" width={0.5} />
      <OnFace face="left" at={[2, 7, 3]}>
        <rect x={0.6} y={0.6} width={1.2} height={1.6} rx={0.15} fill="#ffffff" stroke="#c5d0d7" strokeWidth={0.08} />
        <rect x={0.8} y={0.85} width={0.8} height={0.45} rx={0.05} fill="#6bd897" className="ill-blink" />
        <Windows x={2.6} y={0.7} w={1.1} h={1.1} n={2} gap={0.5} fill={WARM} />
        <rect x={2.8} y={2.1} width={1} height={0.9} rx={0.1} fill="#e8d6bd" />
      </OnFace>
      <OnFace face="right" at={[8, 7, 3]}>
        <Windows x={1} y={0.7} w={1.1} h={1.1} n={2} gap={1.2} fill={WARM} />
      </OnFace>
      <Tree x={8.4} y={-8} s={1.1} />
      <Tree x={-8.6} y={6.6} s={1} kind="pine" />
      <Person x={0} y={6} shirt="#ff9d4d" female />
    </Scene>
  );
}

/* ── 2025–26 · Wide, sunrise: cranes over the Nagpur ingot-wafer site. */
function Scale2025() {
  return (
    <Scene label="2026, sunrise: cranes and rising steel frames across a vast construction site, silicon ingots in the foreground" mood="dawn" backdrop="none">
      <Ridge pts={[[-188, -14], [-60, -26], [60, -16], [188, -24]]} fill="#f3ddd0" opacity={0.8} />
      <Ground y={-10} far="#f1e7d4" near="#e7dcc4" />
      <g stroke="#b9c3cb" strokeWidth={1.4} fill="none">
        {[[-170, 34], [-120, 26], [-76, 20], [-38, 15], [-6, 12]].map(([x, hh], i) => (
          <path key={i} d={`M${x},-6 V${-6 - hh!} H${x! + 30 - i * 4} V-6`} />
        ))}
        <path d="M-170,-40 L-6,-18" />
      </g>
      {[[-90, 120, 1], [40, 110, 0.75], [140, 96, 0.55]].map(([x, h, s], i) => (
        <g key={i} stroke="#f0b440" strokeLinecap="round" fill="none">
          <line x1={x} y1={-6} x2={x} y2={-6 - h!} strokeWidth={3 * s!} />
          <line x1={x! - 24 * s!} y1={-6 - h!} x2={x! + 70 * s!} y2={-6 - h!} strokeWidth={2.4 * s!} />
          <line x1={x} y1={-20 - h!} x2={x! + 70 * s!} y2={-6 - h!} strokeWidth={0.8} stroke="#d9a63f" />
          <line x1={x! + 52 * s!} y1={-6 - h!} x2={x! + 52 * s!} y2={-6 - h! + 40 * s!} strokeWidth={0.8} stroke="#7d8c97" />
        </g>
      ))}
      {[[-150, 120, 34], [-124, 132, 40], [-98, 124, 36]].map(([x, y, hh], i) => (
        <g key={i}>
          <rect x={x! - 10} y={y! - hh!} width={20} height={hh} rx={3} fill="#c9d4dc" />
          <rect x={x! - 10} y={y! - hh!} width={8} height={hh} rx={3} fill="#e6edf2" />
          <ellipse cx={x} cy={y! - hh!} rx={10} ry={3.6} fill="#eef3f6" />
        </g>
      ))}
      <Figure x={20} y={128} h={52} view="side" shirt="#ff9d4d" hat="#ffd25e" />
      <Figure x={64} y={120} h={44} view="front" shirt="#3ea9e0" hat="#ffffff" female />
      <Birds x={-40} y={-100} />
    </Scene>
  );
}

/* ── Today · Wide, bright midday: Waaree’s largest factory, a sawtooth roof of panels, solar rows to the horizon. */
function Today2026() {
  return (
    <Scene label="Today: Waaree’s largest factory under a bright sun, its sawtooth roof lined with panels, solar rows running to the horizon" mood="morning" backdrop="none">
      <Ridge pts={[[-188, -20], [-70, -30], [50, -22], [188, -28]]} fill="#e3efe6" />
      <Ground y={-14} far="#e6f2e8" near="#d4ead8" />
      <path d="M-176,-14 V-50 L-146,-68 V-50 L-116,-68 V-50 L-86,-68 V-50 L-56,-68 V-50 L-26,-68 V-50 L4,-68 V-50 L34,-68 V-50 L64,-68 V-14 Z" fill="#ffffff" />
      <path d="M-146,-68 V-50 M-116,-68 V-50 M-86,-68 V-50 M-56,-68 V-50 M-26,-68 V-50 M4,-68 V-50 M34,-68 V-50 M64,-68 V-50" stroke="#9fd2f0" strokeWidth={3} />
      <rect x={-176} y={-24} width={240} height={4} fill="#e3ece9" />
      <rect x={-150} y={-46} width={64} height={14} rx={2} fill="#ffffff" stroke="#e3ece9" />
      <text x={-144} y={-35.5} fontSize={10} fontWeight={800} fontStyle="italic" fill={BRAND} fontFamily={POPPINS}>
        WAAREE
      </text>
      {[-60, -40, -20, 0, 20, 40].map((x) => (
        <rect key={x} x={x} y={-44} width={12} height={8} rx={1} fill="#cfe6f5" />
      ))}
      <PerspectiveRows vx={60} vy={-10} rows={6} nearY={132} left={-120} right={220} />
      <Figure x={-120} y={120} h={54} view="front" shirt="#3ea9e0" hat="#ffffff" female />
      <Figure x={-92} y={124} h={58} view="side" shirt="#ff9d4d" hat="#ffd25e" />
      <text x={176} y={-128} textAnchor="end" fontSize={8} fontWeight={600} fill="#2a8a4e" fontFamily={POPPINS} letterSpacing={1}>
        CHIKHLI · TODAY
      </text>
      <Birds x={60} y={-104} />
    </Scene>
  );
}

export const LEGACY_SCENES: Record<string, () => ReactNode> = {
  "1985": Village1985,
  "1989": Trading1989,
  "1990": Instruments1990,
  "2007": Solar2007,
  "2011": Epc2011,
  "2014": Neepco2014,
  "2017": Franchise2017,
  "2018–19": Global2018,
  "2019–21": Network2019,
  "2022–24": Listed2022,
  "2024–25": Cells2024,
  "2025": Grid2025,
  "2025–26": Scale2025,
  Today: Today2026,
};
