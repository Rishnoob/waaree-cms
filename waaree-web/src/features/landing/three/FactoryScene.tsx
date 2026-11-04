"use client";

import { ContactShadows, Environment, Grid, Lightformer, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import type { TwinMode } from "../data/twin";
import { NO_SCROLL_MEASURE, useStage, WarmUp } from "./useStage";

/*
 * A Waaree plant as a living blueprint (illustrative, not the real layout). Every part exists first
 * as glowing blueprint lines; as the build advances (progress.current, 0 → 1) each one materialises
 * in its phase: slab → footings → columns → trusses → walls → sawtooth roof → solar roof → the line.
 * At 1 the plant runs: products glide down the belt, out of the dock, onto trucks. A tower crane
 * works while anything is still being built. Drag to orbit.
 */

const HALL = { w: 10, d: 5, h: 2.2 };
const BAYS = 6;
const BAY = HALL.w / BAYS;
const ITEMS = 9;
const LINE_BP = new THREE.Color("#2b8fe0");
const LINE_BUILT = new THREE.Color("#9fb0bb");
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => x * x * (3 - 2 * x);
let reducedCache: boolean | null = null;
const reducedMotion = () => (reducedCache ??= window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const MAT4 = new THREE.Matrix4();

const M = {
  slab: new THREE.MeshStandardMaterial({ color: "#e4ebee", roughness: 0.9 }),
  steel: new THREE.MeshStandardMaterial({ color: "#a9b8c2", metalness: 0.6, roughness: 0.35 }),
  wall: new THREE.MeshStandardMaterial({ color: "#f7f9fa", roughness: 0.7 }),
  roof: new THREE.MeshStandardMaterial({ color: "#eef2f4", roughness: 0.55 }),
  panel: new THREE.MeshStandardMaterial({ color: "#173d7a", metalness: 0.45, roughness: 0.18 }),
  green: new THREE.MeshStandardMaterial({ color: "#0db02b", roughness: 0.45 }),
  teal: new THREE.MeshStandardMaterial({ color: "#28a9e2", roughness: 0.45 }),
  belt: new THREE.MeshStandardMaterial({ color: "#6b7882", roughness: 0.6 }),
  cabinet: new THREE.MeshStandardMaterial({ color: "#e4e9ec", metalness: 0.2, roughness: 0.4 }),
  tree: new THREE.MeshStandardMaterial({ color: "#4fb062", roughness: 0.8 }),
  crane: new THREE.MeshStandardMaterial({ color: "#f2b31b", roughness: 0.5 }),
  ground: new THREE.MeshStandardMaterial({ color: "#eef3ee", roughness: 0.95 }),
  road: new THREE.MeshStandardMaterial({ color: "#c9d0d5", roughness: 0.9 }),
};

type Spec = { geo: THREE.BufferGeometry; pos: THREE.Vector3Tuple; rot?: THREE.Vector3Tuple; phase: [number, number]; mat: THREE.Material; kind: "grow" | "drop" | "fade" };

/** A rounded box with its base at y = 0 (so “grow” rises from the ground). */
const rbox = (w: number, h: number, d: number, r = 0.03) => {
  const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
  g.translate(0, h / 2, 0);
  g.userData.box = [w, h, d]; // the blueprint outline is drawn from a plain box (cheap; same look)
  return g;
};

/** Blueprint lines for a part: a plain box’s 12 edges for rounded boxes, real edges otherwise. */
function outline(geo: THREE.BufferGeometry) {
  const b = geo.userData.box as [number, number, number] | undefined;
  if (!b) return new THREE.EdgesGeometry(geo, 25);
  const box = new THREE.BoxGeometry(...b);
  box.translate(0, b[1] / 2, 0);
  const e = new THREE.EdgesGeometry(box);
  box.dispose();
  return e;
}

function sawtooth(w: number, h: number, d: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return g;
}

/** The plant as an ordered list of parts, each with the slice of the build it happens in. */
function buildSpecs(): Spec[] {
  const specs: Spec[] = [];
  const add = (geo: THREE.BufferGeometry, pos: THREE.Vector3Tuple, phase: [number, number], mat: THREE.Material, kind: Spec["kind"] = "grow", rot?: THREE.Vector3Tuple) =>
    specs.push({ geo, pos, phase, mat, kind, rot });

  add(rbox(HALL.w + 0.6, 0.12, HALL.d + 0.6, 0.05), [0, 0, 0], [0.0, 0.08], M.slab, "fade");
  const cols: [number, number][] = [];
  for (let i = 0; i <= BAYS; i++) for (const z of [-HALL.d / 2, 0, HALL.d / 2]) cols.push([-HALL.w / 2 + i * BAY, z]);
  cols.forEach(([x, z], k) => add(rbox(0.32, 0.12, 0.32, 0.03), [x, 0.12, z], [0.08 + (k / cols.length) * 0.08, 0.12 + (k / cols.length) * 0.08], M.slab, "fade"));
  cols.forEach(([x, z], k) => add(rbox(0.14, HALL.h, 0.14, 0.03), [x, 0.24, z], [0.2 + (k / cols.length) * 0.14, 0.26 + (k / cols.length) * 0.14], M.steel));
  for (const z of [-HALL.d / 2, 0, HALL.d / 2]) add(rbox(HALL.w + 0.14, 0.12, 0.12, 0.02), [0, 0.24 + HALL.h, z], [0.38, 0.46], M.steel, "drop");
  add(rbox(HALL.w, HALL.h, 0.12, 0.02), [0, 0.24, -HALL.d / 2], [0.46, 0.54], M.wall);
  add(rbox(0.12, HALL.h, HALL.d, 0.02), [-HALL.w / 2, 0.24, 0], [0.5, 0.58], M.wall);
  add(rbox(0.12, HALL.h, HALL.d, 0.02), [HALL.w / 2, 0.24, 0], [0.52, 0.6], M.wall);
  add(rbox(HALL.w + 0.14, 0.2, 0.14, 0.03), [0, 0.24 + HALL.h - 0.2, HALL.d / 2], [0.56, 0.62], M.green, "drop");
  const ang = Math.atan2(0.75, BAY);
  const len = Math.hypot(BAY, 0.75);
  for (let k = 0; k < BAYS; k++) {
    const x = -HALL.w / 2 + BAY / 2 + k * BAY;
    add(sawtooth(BAY, 0.75, HALL.d), [x, 0.24 + HALL.h + 0.06, 0], [0.58 + k * 0.02, 0.64 + k * 0.02], M.roof, "drop");
    add(rbox(len * 0.94, 0.04, HALL.d * 0.94, 0.015), [x, 0.24 + HALL.h + 0.06 + 0.36, 0], [0.7 + k * 0.018, 0.76 + k * 0.018], M.panel, "drop", [0, 0, ang]);
  }
  add(rbox(9.2, 0.4, 0.75, 0.05), [0, 0.24, 0.6], [0.82, 0.88], M.belt);
  for (const x of [-2.6, 0, 2.6]) add(rbox(0.4, 0.7, 0.4, 0.12), [x, 0.24, -0.5], [0.86, 0.92], M.teal);
  return specs;
}

function Part({ spec, progress }: { spec: Spec; progress: { current: number } }) {
  const mesh = useRef<THREE.Mesh>(null);
  const line = useRef<THREE.LineBasicMaterial>(null);
  const edges = useMemo(() => outline(spec.geo), [spec]);
  useFrame(() => {
    const k = sm(clamp((progress.current - spec.phase[0]) / (spec.phase[1] - spec.phase[0])));
    const m = mesh.current!;
    m.visible = k > 0.001;
    if (spec.kind === "grow") m.scale.set(1, Math.max(0.001, k), 1);
    else if (spec.kind === "drop") m.position.y = (1 - k) * 1.6;
    else m.scale.setScalar(Math.max(0.001, k));
    line.current!.color.copy(LINE_BP).lerp(LINE_BUILT, k);
    line.current!.opacity = 0.95 - k * 0.65;
  });
  return (
    <group position={spec.pos} rotation={spec.rot}>
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={line} transparent />
      </lineSegments>
      <mesh ref={mesh} geometry={spec.geo} material={spec.mat} castShadow receiveShadow />
    </group>
  );
}

/** What moves once the plant is live (and the crane while it is not). */
function Life({ mode, progress }: { mode: TwinMode; progress: { current: number } }) {
  const items = useRef<THREE.InstancedMesh>(null);
  const arms = useRef<THREE.Group>(null);
  const truck = useRef<THREE.Group>(null);
  const crane = useRef<THREE.Group>(null);
  const jib = useRef<THREE.Group>(null);
  const stack = useRef<THREE.Group>(null);
  const inverters = mode === "inverters";
  const geo = useMemo(() => (inverters ? rbox(0.42, 0.55, 0.32, 0.06) : rbox(0.75, 0.05, 0.45, 0.015)), [inverters]);
  const cab = useMemo(() => rbox(0.9, 0.8, 0.8, 0.1), []);
  const trailer = useMemo(() => rbox(2.2, 1.0, 0.9, 0.08), []);
  const itemH = inverters ? 0.55 : 0.05;

  useFrame((state) => {
    const t = reducedMotion() ? 2 : state.clock.elapsedTime;
    const live = clamp((progress.current - 0.95) / 0.05);
    items.current!.visible = live > 0;
    stack.current!.visible = live > 0;
    truck.current!.visible = live > 0;
    for (let i = 0; i < ITEMS; i++) {
      MAT4.makeTranslation(-4.4 + ((t * 0.09 + i / ITEMS) % 1) * 9.2, 0.64, 0.6);
      items.current!.setMatrixAt(i, MAT4);
    }
    items.current!.instanceMatrix.needsUpdate = true;
    arms.current!.visible = progress.current > 0.9;
    arms.current!.children.forEach((a, k) => (a.rotation.y = live ? Math.sin(t * 1.6 + k * 1.3) * 0.5 : 0));
    truck.current!.position.x = -8 + ((t * 0.06) % 1) * 16;
    // the crane works while anything is unbuilt
    crane.current!.visible = progress.current > 0.02 && progress.current < 0.97;
    jib.current!.rotation.y = Math.sin(t * 0.35) * 1.3;
  });

  return (
    <>
      <instancedMesh ref={items} args={[geo, inverters ? M.cabinet : M.panel, ITEMS]} castShadow frustumCulled={false} />
      <group ref={arms}>
        {[-2.6, 0, 2.6].map((x) => (
          <mesh key={x} position={[x + 0.4, 1.12, -0.5]} rotation={[0, 0, 0.45]} material={M.cabinet} castShadow>
            <boxGeometry args={[1.0, 0.13, 0.13]} />
          </mesh>
        ))}
      </group>
      <group ref={stack}>
        {Array.from({ length: 6 }, (_, k) => (
          <mesh key={k} geometry={geo} material={inverters ? M.cabinet : M.panel} position={[6.1, 0.12 + k * (itemH + 0.02), 1.6]} castShadow />
        ))}
      </group>
      <group ref={truck} position={[-8, 0, 4.6]}>
        <mesh position={[1.45, 0.1, 0]} material={M.green} castShadow geometry={cab} />
        <mesh position={[0, 0.1, 0]} material={M.wall} castShadow geometry={trailer} />
      </group>
      <group ref={crane} position={[6.4, 0, -2.2]}>
        <mesh position={[0, 3, 0]} material={M.crane} castShadow>
          <boxGeometry args={[0.3, 6, 0.3]} />
        </mesh>
        <group ref={jib} position={[0, 6, 0]}>
          <mesh position={[-2.4, 0, 0]} material={M.crane} castShadow>
            <boxGeometry args={[6.6, 0.22, 0.22]} />
          </mesh>
          <mesh position={[0.9, 0.3, 0]} material={M.steel}>
            <boxGeometry args={[0.8, 0.5, 0.5]} />
          </mesh>
          <mesh position={[-4.8, -1.4, 0]} material={M.steel}>
            <cylinderGeometry args={[0.015, 0.015, 2.8]} />
          </mesh>
        </group>
      </group>
    </>
  );
}

function Plant({ mode, progress }: { mode: TwinMode; progress: { current: number } }) {
  const specs = useMemo(() => buildSpecs(), []);
  const ground = useMemo(() => rbox(17, 0.3, 12, 0.15), []);
  const grid = useRef<THREE.Group>(null);
  useFrame(() => {
    // the blueprint grid goes once the plant is fully live
    grid.current!.visible = progress.current < 0.999;
  });
  return (
    <group position={[0, -0.7, 0]}>
      <mesh position={[0, -0.16, 0.6]} material={M.ground} receiveShadow geometry={ground} />
      <mesh position={[0, 0.15, 4.6]} material={M.road} receiveShadow>
        <boxGeometry args={[17, 0.02, 1.4]} />
      </mesh>
      {Array.from({ length: 9 }, (_, k) => (
        <mesh key={k} position={[-7 + k * 1.75, 0.65, -3.8 + (k % 2) * 0.5]} material={M.tree} castShadow>
          <icosahedronGeometry args={[0.5, 2]} />
        </mesh>
      ))}
      <group ref={grid}>
        <Grid position={[0, 0.15, 0]} args={[16, 10]} cellSize={0.5} cellThickness={0.7} cellColor="#9cc9ee" sectionSize={2.5} sectionThickness={1.2} sectionColor="#5aa8e8" fadeDistance={30} />
      </group>
      <group position={[0, 0.14, 0]}>
        {specs.map((s, i) => (
          <Part key={i} spec={s} progress={progress} />
        ))}
        <Life mode={mode} progress={progress} />
      </group>
    </group>
  );
}

export default function FactoryScene({ mode, progress }: { mode: TwinMode; progress: { current: number } }) {
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
                camera={{ position: [10.5, 8.5, 13.5], fov: 32 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <Environment resolution={128} frames={1}>
          <color attach="background" args={["#c9d3da"]} />
          <Lightformer form="rect" intensity={2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
          <Lightformer form="rect" intensity={1.2} color="#fff1d6" position={[6, 3, 6]} scale={[6, 3, 1]} />
        </Environment>
        <directionalLight position={[7, 12, 7]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-bias={-0.0004} />
        <ambientLight intensity={0.35} />
        <Plant mode={mode} progress={progress} />
        <ContactShadows position={[0, -0.86, 0.6]} opacity={0.25} scale={24} blur={2.4} far={4} />
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.5} maxPolarAngle={1.2} minAzimuthAngle={-0.5} maxAzimuthAngle={1.5} target={[0, 0.4, 0.4]} />
        <WarmUp onReady={onWarm} />
      </Canvas>
      )}
    </div>
  );
}
