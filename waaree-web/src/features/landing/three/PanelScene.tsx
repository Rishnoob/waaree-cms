"use client";

import { Environment, Lightformer, PerformanceMonitor, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { anatomy } from "../story-state";
import { bridgeWidth } from "./bridge";
import { NO_SCROLL_MEASURE, setStyle, useStage, WarmUp } from "./useStage";

/*
 * Inside the panel: a studio-lit Waaree TOPCon module (144 half-cut cells under real refractive glass).
 * Scroll (anatomy.progress) runs one continuous camera move:
 *   0.00–0.03 hand-off frame · 0.03–0.16 a slow swing to three-quarters · 0.15–0.40 the seven layers part · 0.46–0.64 the lid lifts and one cell rises
 *   into a cross-section · 0.64–0.86 inside the cell: photons free electrons, which tunnel out the back
 *   · 0.86–1.00 pull back as light ripples across every cell.
 * DOM labels (in `labels`) are pinned to 3D anchors every frame: [data-anchor="glass"] etc.
 */

const W = 2.28; // module, metres-ish (long side on x)
const D = 1.14;
const COLS = 24; // half-cut: 2 × 12 columns, split down the middle
const ROWS = 6;
const SX = 0.09; // cell pitch
const SZ = 0.178;
const CW = 0.086; // cell size
const CD = 0.172;
const T = { c: 16, r: 3 }; // the cell we dive into
const cellX = (c: number) => (c - 11.5) * SX + (c < 12 ? -0.01 : 0.01);
const cellZ = (r: number) => (r - 2.5) * SZ;
const TX = cellX(T.c);
const TZ = cellZ(T.r);
const BLOCK_H = 0.05; // the cross-section, exaggerated so its strata read
const FACE = TZ + CD / 2; // the cut face the camera looks at

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const ease = (x: number) => x * x * (3 - 2 * x);
const lerp = THREE.MathUtils.lerp;

/** Layer stack: assembled y → exploded y (module space). */
const LAYERS = {
  glass: [0.013, 0.78],
  evaTop: [0.0085, 0.55],
  cells: [0.004, 0.32],
  evaBottom: [0.0, 0.12],
  frame: [0.0, -0.08],
  back: [-0.004, -0.27],
  jbox: [-0.024, -0.48],
} as const;

/** Camera keyframes over scroll: [progress, position, look-at]. The first and last (straight above, on the hand-off frame) are sized per screen. */
const KEYS: [number, THREE.Vector3Tuple, THREE.Vector3Tuple][] = [
  [0.0, [0.0, 2.6, 0.02], [0, 0, 0]],
  [0.03, [0.0, 2.6, 0.02], [0, 0, 0]], // a beat on the hand-off frame before the camera moves
  [0.16, [2.2, 1.45, 2.52], [0, -0.02, 0]], // a long, slow swing to the three-quarter view
  [0.36, [2.65, 1.2, 2.45], [0, 0.12, 0]],
  [0.46, [2.4, 0.95, 2.2], [0, 0.1, 0]],
  [0.56, [TX + 0.3, 0.42, TZ + 0.75], [TX, 0.01, TZ]],
  [0.64, [TX + 0.06, 0.04, FACE + 0.13], [TX, 0.024, FACE]],
  [0.84, [TX + 0.04, 0.034, FACE + 0.12], [TX, 0.024, FACE]],
  [0.92, [1.2, 2.2, 2.6], [0, 0, 0]],
  [0.98, [0.0, 2.6, 0.02], [0, 0, 0]],
  [1.0, [0.0, 2.6, 0.02], [0, 0, 0]],
];
const TOP = new THREE.Vector3();
const TOP_LOOK = new THREE.Vector3();

/** Camera height that puts the module (W wide) on the hand-off frame, for this screen and lens. */
function topHeight(width: number, height: number, fov: number) {
  return (W * height) / (bridgeWidth(width, height) * 2 * Math.tan(THREE.MathUtils.degToRad(fov / 2))) + 0.015;
}

const ARC = { a: new THREE.Vector3(), b: new THREE.Vector3(), y: new THREE.Vector3(0, 1, 0), qa: new THREE.Quaternion(), qb: new THREE.Quaternion() };

function cameraAt(p: number, pos: THREE.Vector3, look: THREE.Vector3) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1]![0]) i++;
  const [p0, a, la] = KEYS[i]!;
  const [p1, b, lb] = KEYS[i + 1]!;
  const t = ease(seg(p, p0, p1));
  look.set(lerp(la[0], lb[0], t), lerp(la[1], lb[1], t), lerp(la[2], lb[2], t));
  // move on an arc around what we look at (turn the direction, ease the distance): a straight line
  // between two views dips toward the module and makes it balloon mid-move
  ARC.a.set(a[0] - la[0], a[1] - la[1], a[2] - la[2]);
  ARC.b.set(b[0] - lb[0], b[1] - lb[1], b[2] - lb[2]);
  const d = lerp(ARC.a.length(), ARC.b.length(), t);
  ARC.qa.setFromUnitVectors(ARC.y, ARC.a.normalize());
  ARC.qb.setFromUnitVectors(ARC.y, ARC.b.normalize());
  ARC.qa.slerp(ARC.qb, t);
  pos.copy(ARC.y).applyQuaternion(ARC.qa).multiplyScalar(d).add(look);
}

/** Monocrystalline half-cell: deep blue silicon, fine fingers, 10 thin busbars (string direction = x). */
function cellTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, 256, 512);
  bg.addColorStop(0, "#132a52");
  bg.addColorStop(0.5, "#0b1c3b");
  bg.addColorStop(1, "#16336a");
  g.fillStyle = bg;
  g.fillRect(0, 0, 256, 512);
  // faint crystalline texture
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(${90 + ((i * 37) % 60)},${120 + ((i * 53) % 70)},210,${0.03 + ((i * 7) % 10) / 300})`;
    g.fillRect((i * 97) % 256, (i * 211) % 512, 2, 2);
  }
  // fingers (perpendicular to the busbars)
  g.strokeStyle = "rgba(200,215,235,0.28)";
  g.lineWidth = 1;
  for (let x = 3; x < 256; x += 5) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 512);
    g.stroke();
  }
  // busbars / wires
  g.fillStyle = "rgba(236,240,245,0.92)";
  for (let k = 0; k < 10; k++) g.fillRect(0, 24 + k * 51.5, 256, 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Off-white backsheet with a faint weave. */
function weaveTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f4f6f7";
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(160,175,185,0.18)";
  for (let i = 0; i < 128; i += 4) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 128);
    g.moveTo(0, i);
    g.lineTo(128, i);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 4);
  return t;
}

type Anchors = Record<string, THREE.Object3D | null>;

/** Carrier pairs in the cross-section (seeded, so every visit looks the same). */
const N = 44;
const SEEDS = (() => {
  let s = 7;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: N }, () => ({ x: (r() - 0.5) * 0.074, depth: 0.009 + r() * 0.03, period: 1.5 + r() * 1.1, phase: r(), wob: r() * 6 }));
})();
const LAYER_KEYS = Object.keys(LAYERS) as (keyof typeof LAYERS)[];

// Per-frame scratch objects (module level: never mutate useMemo values in useFrame).
const SCRATCH = { m: new THREE.Matrix4(), v: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), c: new THREE.Color(), teal: new THREE.Color("#2fe0c4") };
const BG = { white: new THREE.Color("#ffffff"), inside: new THREE.Color("#e7eefb"), cur: new THREE.Color("#ffffff") };
let reducedCache: boolean | null = null;
const reducedMotion = () => (reducedCache ??= window.matchMedia("(prefers-reduced-motion: reduce)").matches);

function Module({ labels }: { labels: React.RefObject<HTMLDivElement | null> }) {
  const group = useRef<THREE.Group>(null);
  const layers = useRef<Record<keyof typeof LAYERS, THREE.Object3D> | null>(null);
  const cells = useRef<THREE.InstancedMesh>(null);
  const glow = useRef<THREE.InstancedMesh>(null);
  const block = useRef<THREE.Group>(null);
  const photons = useRef<THREE.InstancedMesh>(null);
  const electrons = useRef<THREE.InstancedMesh>(null);
  const holes = useRef<THREE.InstancedMesh>(null);
  const oxide = useRef<THREE.MeshStandardMaterial>(null);
  const current = useRef<THREE.Mesh>(null);
  const anchors = useRef<Anchors>({});
  const labelEls = useRef<{ el: HTMLElement; key: string }[] | null>(null);
  const look = useRef(new THREE.Vector3());

  const tex = useMemo(() => ({ cell: cellTexture(), weave: weaveTexture() }), []);
  const cellList = useMemo(() => {
    const out: { x: number; z: number; d: number }[] = [];
    for (let c = 0; c < COLS; c++)
      for (let r = 0; r < ROWS; r++) out.push({ x: cellX(c), z: cellZ(r), d: Math.hypot(cellX(c) - TX, cellZ(r) - TZ) });
    return out;
  }, []);
  const targetIndex = T.c * ROWS + T.r;

  // place the cells once
  useEffect(() => {
    const m = new THREE.Matrix4();
    cellList.forEach((c, i) => {
      m.makeTranslation(c.x, 0, c.z);
      cells.current!.setMatrixAt(i, m);
      m.makeTranslation(c.x, 0.0026, c.z);
      glow.current!.setMatrixAt(i, m);
      glow.current!.setColorAt(i, new THREE.Color(0, 0, 0));
    });
    cells.current!.instanceMatrix.needsUpdate = true;
    glow.current!.instanceMatrix.needsUpdate = true;
  }, [cellList]);

  useFrame((state) => {
    const { camera, size } = state;
    const p = anatomy.progress;
    const time = state.clock.elapsedTime;
    const L = layers.current ?? (layers.current = Object.fromEntries(LAYER_KEYS.map((k) => [k, group.current!.getObjectByName(k)!])) as Record<keyof typeof LAYERS, THREE.Object3D>);
    const still = reducedMotion();
    const { m, v, q, s, c } = SCRATCH;

    // camera (+ a little pointer parallax while the whole module is in view)
    const away = 1 - seg(p, 0.46, 0.54) + seg(p, 0.9, 1);
    const narrow = size.width < size.height;
    const fov = narrow ? 52 : 34;
    // the hand-offs (from the globe, to the India map) are the exact frame: straight above, centred, still
    const top = topHeight(size.width, size.height, fov);
    KEYS[0]![1][1] = KEYS[1]![1][1] = KEYS[KEYS.length - 1]![1][1] = KEYS[KEYS.length - 2]![1][1] = top;
    const live = ease(seg(p, 0.03, 0.16)) * (1 - seg(p, 0.94, 0.98)) * (1 - anatomy.out);
    cameraAt(p, camera.position, look.current);
    camera.position.x += anatomy.px * 0.25 * clamp(away) * live;
    camera.position.y += anatomy.py * 0.15 * clamp(away) * live;
    // phones: step back so the whole module (and its layers) fits the narrow frame
    if (narrow) camera.position.sub(look.current).multiplyScalar(1 + 0.75 * clamp(away) * live).add(look.current);
    // the exit: settle on the frame with no scrub lag, however fast the visitor scrolls
    const out = ease(anatomy.out);
    if (out > 0) {
      camera.position.lerp(TOP.set(0, top, 0.02), out);
      look.current.lerp(TOP_LOOK.set(0, 0, 0), out);
    }
    // straight above, "up" must lie along the module or the slightest drift rolls the view
    const above = THREE.MathUtils.smoothstep(TOP.subVectors(camera.position, look.current).normalize().y, 0.96, 0.995);
    camera.up.set(0, 1 - above, -above).normalize();
    camera.lookAt(look.current);
    const pc = camera as THREE.PerspectiveCamera;
    if (pc.fov !== fov) pc.fov = fov;
    // make room for the copy: the module sits right of it (below it on phones), centred for the dive
    // and at the hand-offs
    const room = narrow ? clamp(away) * live : live;
    if (narrow) pc.setViewOffset(size.width, size.height, 0, -0.16 * room * size.height, size.width, size.height);
    else pc.setViewOffset(size.width, size.height, -0.15 * room * size.width, 0, size.width, size.height);

    // idle sway of the whole module, damped out for the dive and the hand-offs
    const sway = still ? 0 : Math.sin(time * 0.35) * 0.05 * clamp(away) * live;
    group.current!.rotation.y = sway;
    // explode
    const x = ease(seg(p, 0.15, 0.37)) * (1 - ease(seg(p, 0.42, 0.52)));
    for (const k of LAYER_KEYS) L[k].position.y = lerp(LAYERS[k][0], LAYERS[k][1], x);
    // the frame steps outward as it drops
    L.frame.children.forEach((bar) => bar.userData.x !== undefined && bar.position.set(bar.userData.x * (1 + x * 0.09), 0, bar.userData.z * (1 + x * 0.16)));
    // the lid (glass + top EVA) lifts away for the dive, returns at the end
    const lid = ease(seg(p, 0.46, 0.56)) * (1 - ease(seg(p, 0.88, 0.97)));
    for (const k of ["glass", "evaTop"] as const) {
      const o = L[k];
      o.position.y += lid * 2.4;
      o.visible = lid < 0.98;
    }

    // the chosen cell rises into a cross-section block
    const rise = ease(seg(p, 0.53, 0.62)) * (1 - ease(seg(p, 0.86, 0.92)));
    block.current!.visible = rise > 0.001;
    block.current!.scale.set(1, Math.max(0.001, rise), 1);
    m.makeTranslation(TX, 0, TZ);
    if (rise > 0.001) m.scale(v.set(0, 0, 0));
    cells.current!.setMatrixAt(targetIndex, m);
    cells.current!.instanceMatrix.needsUpdate = true;

    // carriers inside the cell: photon falls, frees an electron (down through the oxide) and a hole (up)
    const inside = seg(p, 0.6, 0.66) * (1 - seg(p, 0.84, 0.88));
    let oxideFlash = 0;
    SEEDS.forEach((sd, i) => {
      const t = still ? (sd.phase * 0.9 + 0.05) % 1 : (time / sd.period + sd.phase) % 1;
      const fall = clamp(t / 0.3);
      const after = seg(t, 0.3, 0.95);
      // photon
      const photonOn = t < 0.3 ? inside : 0;
      v.set(sd.x + (1 - fall) * 0.012, lerp(BLOCK_H + 0.05, sd.depth + 0.006, fall), 0);
      s.set(0.00045, 0.0045, 0.00045).multiplyScalar(photonOn);
      m.compose(v, q.identity(), s);
      photons.current!.setMatrixAt(i, m);
      // electron: down to the rear contact, through the tunnel oxide
      const eOn = t >= 0.3 ? inside * (1 - seg(t, 0.9, 1)) : 0;
      const ey = lerp(sd.depth + 0.006, 0.0012, ease(after));
      if (eOn > 0 && Math.abs(ey - 0.0054) < 0.002) oxideFlash = 1;
      v.set(sd.x + Math.sin(after * 9 + sd.wob) * 0.002 + ease(seg(after, 0.8, 1)) * 0.02, ey, 0);
      s.setScalar(0.00065 * eOn);
      m.compose(v, q, s);
      electrons.current!.setMatrixAt(i, m);
      // hole: up to the front emitter / fingers
      const hy = lerp(sd.depth + 0.006, BLOCK_H - 0.004, ease(after));
      v.set(sd.x + Math.cos(after * 7 + sd.wob) * 0.002, hy, 0);
      s.setScalar(0.00052 * eOn);
      m.compose(v, q, s);
      holes.current!.setMatrixAt(i, m);
    });
    for (const im of [photons, electrons, holes]) im.current!.instanceMatrix.needsUpdate = true;
    if (oxide.current) oxide.current.emissiveIntensity = lerp(oxide.current.emissiveIntensity, 1.4 + oxideFlash * 2.5, 0.15);
    if (current.current) {
      const cm = current.current.material as THREE.MeshBasicMaterial;
      cm.opacity = inside * (0.55 + 0.45 * Math.sin(time * 6));
      current.current.position.x = still ? 0 : ((time * 0.05) % 0.09) - 0.045;
    }

    // the finale: light ripples out from the cell across all 144
    const wave = seg(p, 0.86, 1) * 3.2;
    cellList.forEach((cl, i) => {
      // (the afterglow dims for the hand-off, so the module meets the map as it left the globe)
      const k = (clamp(1 - Math.abs(wave - cl.d) * 2.2) * 0.9 + clamp(wave - cl.d) * 0.28 * (1 - anatomy.out)) * clamp(wave * 8);
      c.copy(SCRATCH.teal).multiplyScalar(k);
      glow.current!.setColorAt(i, c);
    });
    glow.current!.instanceColor!.needsUpdate = true;

    // pin the DOM labels to their anchors
    const root = labels.current;
    if (root) {
      labelEls.current ??= Array.from(root.querySelectorAll<HTMLElement>("[data-anchor]")).map((el) => ({ el, key: el.dataset.anchor! }));
      const show: Record<string, number> = {
        glass: seg(p, 0.19, 0.23), evaTop: seg(p, 0.21, 0.25), cells: seg(p, 0.23, 0.27), evaBottom: seg(p, 0.25, 0.29),
        back: seg(p, 0.27, 0.31), frame: seg(p, 0.29, 0.33), jbox: seg(p, 0.31, 0.35),
        photon: seg(p, 0.66, 0.69), silicon: seg(p, 0.68, 0.71), oxide: seg(p, 0.7, 0.73), rear: seg(p, 0.72, 0.75),
      };
      const hideExplode = 1 - seg(p, 0.41, 0.45);
      const hideMacro = 1 - seg(p, 0.83, 0.86);
      for (const { el, key } of labelEls.current) {
        const o = anchors.current[key];
        const macro = ["photon", "silicon", "oxide", "rear"].includes(key);
        const a = (show[key] ?? 0) * (macro ? hideMacro : hideExplode);
        if (!o || a <= 0.001) {
          setStyle(el, "opacity", "0");
          continue;
        }
        o.getWorldPosition(v).project(camera);
        setStyle(el, "opacity", a.toFixed(3));
        setStyle(el, "transform", `translate(${(((v.x + 1) / 2) * size.width).toFixed(1)}px, ${(((1 - v.y) / 2) * size.height).toFixed(1)}px)`);
      }
    }
  });

  const anchor = (key: string, pos: THREE.Vector3Tuple) => (
    <object3D
      position={pos}
      ref={(o) => {
        anchors.current[key] = o;
      }}
    />
  );

  const frameBars = [
    { size: [W + 0.06, 0.04, 0.035], x: 0, z: D / 2 + 0.015 },
    { size: [W + 0.06, 0.04, 0.035], x: 0, z: -D / 2 - 0.015 },
    { size: [0.035, 0.04, D], x: W / 2 + 0.015, z: 0 },
    { size: [0.035, 0.04, D], x: -W / 2 - 0.015, z: 0 },
  ] as const;

  return (
    <group ref={group}>
      {/* 1 · tempered, anti-reflective glass (real refraction) */}
      <group name="glass">
        <RoundedBox args={[W, 0.008, D]} radius={0.003} smoothness={2}>
          <meshPhysicalMaterial transmission={1} thickness={0.02} roughness={0.035} ior={1.5} specularIntensity={0.55} clearcoat={0.45} clearcoatRoughness={0.04} color="#f4fbff" attenuationColor="#dff3ff" attenuationDistance={0.6} />
        </RoundedBox>
        {anchor("glass", [-W / 2, 0.004, D / 2])}
      </group>
      {/* 2 · EVA encapsulant */}
      <group name="evaTop">
        <mesh>
          <boxGeometry args={[W - 0.01, 0.003, D - 0.01]} />
          <meshPhysicalMaterial transmission={0.85} roughness={0.55} thickness={0.01} color="#ffffff" />
        </mesh>
        {anchor("evaTop", [-W / 2 + 0.005, 0, D / 2 - 0.005])}
      </group>
      {/* 3 · TOPCon half-cut cells, the ribbons, the glow overlay, and the cross-section block */}
      <group name="cells">
        <instancedMesh ref={cells} args={[undefined, undefined, COLS * ROWS]} frustumCulled={false}>
          <boxGeometry args={[CW, 0.002, CD]} />
          <meshPhysicalMaterial map={tex.cell} metalness={0.12} roughness={0.42} iridescence={0.45} iridescenceIOR={1.9} iridescenceThicknessRange={[180, 520]} clearcoat={0.3} />
        </instancedMesh>
        <instancedMesh ref={glow} args={[undefined, undefined, COLS * ROWS]} frustumCulled={false}>
          <boxGeometry args={[CW, 0.0004, CD]} />
          <meshBasicMaterial blending={THREE.AdditiveBlending} transparent depthWrite={false} toneMapped={false} />
        </instancedMesh>
        {Array.from({ length: ROWS }, (_, r) => (
          <mesh key={r} position={[0, 0.0012, cellZ(r)]}>
            <boxGeometry args={[COLS * SX + 0.03, 0.0008, 0.004]} />
            <meshStandardMaterial color="#dfe5ea" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
        {anchor("cells", [-W / 2 + 0.04, 0, D / 2 - 0.05])}

        <group ref={block} position={[TX, 0.001, TZ]}>
          <CrossSection oxide={oxide} current={current} anchors={anchors} />
          <instancedMesh ref={photons} args={[undefined, undefined, N]} frustumCulled={false} position={[0, 0, CD / 2 + 0.0012]}>
            <capsuleGeometry args={[0.5, 1, 4, 8]} />
            <meshBasicMaterial color={[2.6, 2, 0.7]} toneMapped={false} />
          </instancedMesh>
          <instancedMesh ref={electrons} args={[undefined, undefined, N]} frustumCulled={false} position={[0, 0, CD / 2 + 0.0012]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color={[0.25, 1.9, 2.2]} toneMapped={false} />
          </instancedMesh>
          <instancedMesh ref={holes} args={[undefined, undefined, N]} frustumCulled={false} position={[0, 0, CD / 2 + 0.0012]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color={[2.1, 0.55, 1.35]} toneMapped={false} />
          </instancedMesh>
        </group>
      </group>
      {/* 4 · EVA below the cells */}
      <group name="evaBottom">
        <mesh position={[0, -0.002, 0]}>
          <boxGeometry args={[W - 0.01, 0.003, D - 0.01]} />
          <meshPhysicalMaterial transmission={0.8} roughness={0.6} thickness={0.01} color="#ffffff" />
        </mesh>
        {anchor("evaBottom", [-W / 2 + 0.005, -0.002, D / 2 - 0.005])}
      </group>
      {/* 5 · backsheet */}
      <group name="back">
        <mesh>
          <boxGeometry args={[W, 0.004, D]} />
          <meshStandardMaterial map={tex.weave} roughness={0.75} />
        </mesh>
        {anchor("back", [-W / 2, 0, D / 2])}
      </group>
      {/* 6 · anodised aluminium frame */}
      <group name="frame">
        {frameBars.map((b, i) => (
          <RoundedBox key={i} args={b.size as unknown as [number, number, number]} radius={0.006} smoothness={3} userData={{ x: b.x, z: b.z }} position={[b.x, 0, b.z]}>
            <meshStandardMaterial color="#c7cfd5" metalness={1} roughness={0.22} />
          </RoundedBox>
        ))}
        {anchor("frame", [-W / 2 - 0.03, 0.02, D / 2 + 0.03])}
      </group>
      {/* 7 · junction box + cables */}
      <group name="jbox">
        <RoundedBox args={[0.22, 0.03, 0.12]} radius={0.008} position={[-0.55, 0, -0.3]}>
          <meshStandardMaterial color="#1d262e" roughness={0.55} />
        </RoundedBox>
        <Cable from={[-0.66, 0, -0.3]} to={[-0.98, -0.01, -0.1]} />
        <Cable from={[-0.44, 0, -0.3]} to={[-0.12, -0.01, -0.12]} />
        {anchor("jbox", [-0.66, 0, -0.24])}
      </group>
    </group>
  );
}

function Cable({ from, to }: { from: THREE.Vector3Tuple; to: THREE.Vector3Tuple }) {
  const geo = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -0.06, 0));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, mid, b]), 32, 0.007, 8, false);
  }, [from, to]);
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial color="#20262b" roughness={0.5} />
      </mesh>
      <mesh position={to} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, 0.06, 16]} />
        <meshStandardMaterial color="#2a3036" roughness={0.4} />
      </mesh>
    </group>
  );
}

/** One TOPCon cell, cut open (block-local: y = 0 rear → BLOCK_H front). Strata exaggerated. */
function CrossSection({
  oxide,
  current,
  anchors,
}: {
  oxide: React.RefObject<THREE.MeshStandardMaterial | null>;
  current: React.RefObject<THREE.Mesh | null>;
  anchors: React.RefObject<Anchors>;
}) {
  const strata: { y0: number; y1: number; color: string; key?: string; emissive?: string; metal?: boolean; irid?: boolean }[] = [
    { y0: 0, y1: 0.0024, color: "#d9e0e6", metal: true }, // rear contact
    { y0: 0.0024, y1: 0.005, color: "#7f97b8" }, // n+ poly-Si
    { y0: 0.005, y1: 0.0058, color: "#9ff3ff", emissive: "#2fd6ff", key: "oxide" }, // tunnel oxide
    { y0: 0.0058, y1: 0.0435, color: "#33507f" }, // n-type wafer
    { y0: 0.0435, y1: 0.0475, color: "#6a62d6" }, // p+ emitter
    { y0: 0.0475, y1: 0.05, color: "#24348a", irid: true }, // anti-reflective coating
  ];
  const fingers = [-0.03, -0.01, 0.01, 0.03];
  return (
    <group>
      {strata.map((s, i) => (
        <mesh key={i} position={[0, (s.y0 + s.y1) / 2, 0]}>
          <boxGeometry args={[CW, s.y1 - s.y0, CD]} />
          {s.emissive ? (
            <meshStandardMaterial ref={oxide} color={s.color} emissive={s.emissive} emissiveIntensity={1.4} toneMapped={false} />
          ) : s.irid ? (
            <meshPhysicalMaterial color={s.color} roughness={0.2} iridescence={0.7} iridescenceIOR={1.9} iridescenceThicknessRange={[200, 600]} />
          ) : (
            <meshStandardMaterial color={s.color} metalness={s.metal ? 1 : 0.15} roughness={s.metal ? 0.25 : 0.55} />
          )}
        </mesh>
      ))}
      {fingers.map((x) => (
        <mesh key={x} position={[x, BLOCK_H + 0.0016, 0]}>
          <boxGeometry args={[0.0036, 0.0032, CD]} />
          <meshStandardMaterial color="#eef2f5" metalness={1} roughness={0.18} />
        </mesh>
      ))}
      {/* current streak along the rear contact */}
      <mesh ref={current} position={[0, 0.0012, CD / 2 + 0.0008]}>
        <boxGeometry args={[0.03, 0.0016, 0.0005]} />
        <meshBasicMaterial color={[0.4, 3, 3.4]} transparent toneMapped={false} />
      </mesh>
      {(
        [
          ["photon", [0.02, BLOCK_H + 0.03, CD / 2]],
          ["silicon", [-CW / 2, 0.026, CD / 2]],
          ["oxide", [CW / 2, 0.0054, CD / 2]],
          ["rear", [-CW / 2, 0.0012, CD / 2]],
        ] as const
      ).map(([key, pos]) => (
        <object3D
          key={key}
          position={pos as unknown as THREE.Vector3Tuple}
          ref={(o) => {
            anchors.current[key] = o;
          }}
        />
      ))}
    </group>
  );
}

/** The studio: soft boxes and strips, rendered once into the environment (no downloads). */
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#aab6bf"]} />
      {/* key light off the vertical, so a top-down view doesn’t mirror it across the glass */}
      <Lightformer form="rect" intensity={2.2} position={[4, 5, -3]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
      <Lightformer form="rect" intensity={2} position={[-5, 2, 1]} rotation-y={Math.PI / 2} scale={[6, 1.2, 1]} />
      <Lightformer form="rect" intensity={1.5} color="#cfe9ff" position={[5, 1, -2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      <Lightformer form="ring" intensity={2.5} color="#fff1d6" position={[2, 3, 4]} scale={2} />
      <Lightformer form="rect" intensity={0.8} color="#b9f0cf" position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[8, 8, 1]} />
    </Environment>
  );
}

/** Backdrop: white at rest, a soft silicon blue while we are inside the cell. */
function Backdrop() {
  useFrame((state) => {
    state.scene.background = BG.cur;
    const p = anatomy.progress;
    BG.cur.copy(BG.white).lerp(BG.inside, seg(p, 0.55, 0.64) * (1 - seg(p, 0.86, 0.93)));
  });
  return null;
}

export default function PanelScene({ labels }: { labels: React.RefObject<HTMLDivElement | null> }) {
  const { wrap, mounted, frameloop, onWarm, dpr: stageDpr } = useStage();
  const [dpr, setDpr] = useState(1.5);


  return (
    <div ref={wrap} className="absolute inset-0">
      {/* mounted only near the viewport: frees its WebGL context when far away (browsers cap live contexts) */}
      {mounted && (
      <Canvas
        resize={NO_SCROLL_MEASURE}
        aria-hidden
        frameloop={frameloop}
        dpr={stageDpr(dpr)}
                camera={{ position: [0, 2.6, 0.02], fov: 34, near: 0.004, far: 40 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <Backdrop />
        <Studio />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <ambientLight intensity={0.25} />
        <Module labels={labels} />
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={1.15} luminanceSmoothing={0.15} intensity={0.9} radius={0.7} />
        </EffectComposer>
        <WarmUp onReady={onWarm} />
      </Canvas>
      )}
    </div>
  );
}
