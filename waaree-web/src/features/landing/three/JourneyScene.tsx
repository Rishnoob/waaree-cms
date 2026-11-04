"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, type RootState, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

import { stageAt } from "../data/journey";
import { journey } from "../story-state";
import { bridgeWidth } from "./bridge";
import { NO_SCROLL_MEASURE, useStage, WarmUp } from "./useStage";

/*
 * Every panel begins as sand. 9,000 points that are, in turn, a mound of sand, a silicon ingot, wafers, a
 * cell, a module, an inverter, a battery container, a transformer, a smart meter and an electrolyser.
 * Scroll flows them from one shape to the next (each point on its own arc and delay); between flows
 * they hold the shape and the whole thing turns slowly. Morphing runs on the CPU (cheap at 9k).
 */

const N = 14000;
const FOV = 34;

const COLORS = [
  "#2fd6bf", // prelude: the lit module from Inside the panel
  "#c39a5c",
  "#7d8aa0",
  "#4a5d92",
  "#1f3f8c",
  "#1d4ea8",
  "#0a9a3a",
  "#1e9fd6",
  "#3a4f66",
  "#12a150",
  "#19b3c9",
];

/* ── shapes (merged primitives, sampled on their surface) ─────────────────── */
const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0, ry = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  if (ry) g.rotateY(ry);
  return g.translate(x, y, z);
};
const cyl = (
  r1: number,
  r2: number,
  h: number,
  x = 0,
  y = 0,
  z = 0,
  seg = 32,
) => new THREE.CylinderGeometry(r1, r2, h, seg).translate(x, y, z);

function merge(parts: THREE.BufferGeometry[], tiltX = 0) {
  const g = mergeGeometries(parts.map((p) => p.toNonIndexed()))!;
  if (tiltX) g.rotateX(tiltX);
  g.computeBoundingBox();
  const s = g.boundingBox!.getSize(new THREE.Vector3());
  g.center();
  const k = 2.6 / Math.max(s.x, s.y, s.z);
  g.scale(k, k, k);
  return g;
}

const SHAPES: (() => THREE.BufferGeometry | null)[] = [
  // prelude: the module, seen from above as the panel chapter left it (2:1, like the hand-off frame)
  () =>
    merge(
      [
        box(2.6, 0.03, 1.3),
        ...Array.from({ length: 23 }, (_, k) =>
          box(0.012, 0.05, 1.3, -1.19 + k * 0.108, 0.02),
        ),
        ...Array.from({ length: 5 }, (_, k) =>
          box(2.6, 0.05, 0.012, 0, 0.02, -0.43 + k * 0.215),
        ),
        box(2.7, 0.07, 0.05, 0, 0.02, 0.65),
        box(2.7, 0.07, 0.05, 0, 0.02, -0.65),
      ],
    ),
  () => null, // sand: generated directly
  () =>
    merge([
      cyl(0.55, 0.55, 2.2),
      cyl(0.08, 0.55, 0.5, 0, 1.35),
      cyl(0.05, 0.05, 0.6, 0, 1.9, 0, 12),
      cyl(0.55, 0.15, 0.4, 0, -1.3),
    ]),
  () =>
    merge(
      Array.from({ length: 7 }, (_, i) =>
        box(1.5, 0.02, 1.5, i * 0.06, i * 0.24, 0, i * 0.09),
      ),
    ),
  () =>
    merge(
      [
        box(2, 0.03, 2),
        ...Array.from({ length: 10 }, (_, k) =>
          box(2, 0.012, 0.025, 0, 0.022, -0.9 + k * 0.2),
        ),
      ],
      -0.5,
    ),
  () =>
    merge(
      [
        box(2.6, 0.04, 1.5),
        box(2.7, 0.08, 0.05, 0, 0.02, 0.77),
        box(2.7, 0.08, 0.05, 0, 0.02, -0.77),
        box(0.05, 0.08, 1.55, 1.33, 0.02),
        box(0.05, 0.08, 1.55, -1.33, 0.02),
        ...Array.from({ length: 11 }, (_, k) =>
          box(0.012, 0.05, 1.5, -1.08 + k * 0.216, 0.01),
        ),
        ...Array.from({ length: 5 }, (_, k) =>
          box(2.6, 0.05, 0.012, 0, 0.01, -0.5 + k * 0.25),
        ),
      ],
      -0.5,
    ),
  () =>
    merge([
      box(1.3, 1.7, 0.55),
      ...Array.from({ length: 9 }, (_, k) =>
        box(0.035, 1.5, 0.28, -0.56 + k * 0.14, 0, -0.4),
      ),
      box(0.5, 0.3, 0.03, 0, 0.45, 0.29),
      cyl(0.06, 0.06, 0.22, -0.3, -0.95),
      cyl(0.06, 0.06, 0.22, 0.3, -0.95),
    ]),
  () =>
    merge([
      box(2.8, 1.2, 1.1),
      ...Array.from({ length: 22 }, (_, k) =>
        box(0.035, 1.16, 1.16, -1.32 + k * 0.126, 0),
      ),
      box(0.02, 1.0, 0.9, 1.42, 0),
    ]),
  () =>
    merge([
      box(1.6, 1.2, 0.9),
      ...[-0.5, 0, 0.5].map((x) => cyl(0.08, 0.11, 0.75, x, 0.95, 0, 16)),
      ...Array.from({ length: 6 }, (_, k) =>
        box(0.04, 1.0, 0.5, -0.6 + k * 0.24, 0, 0.72),
      ),
      ...Array.from({ length: 6 }, (_, k) =>
        box(0.04, 1.0, 0.5, -0.6 + k * 0.24, 0, -0.72),
      ),
    ]),
  () =>
    merge([
      box(1.0, 1.4, 0.35),
      box(0.62, 0.3, 0.03, 0, 0.32, 0.19),
      cyl(0.07, 0.07, 0.04, -0.2, -0.25, 0.19, 16).rotateX(Math.PI / 2),
      cyl(0.07, 0.07, 0.04, 0.2, -0.25, 0.19, 16).rotateX(Math.PI / 2),
      box(0.3, 0.12, 0.2, 0, -0.76),
    ]),
  () =>
    merge([
      ...Array.from({ length: 14 }, (_, k) =>
        cyl(0.6, 0.6, 0.06, 0, -0.85 + k * 0.13).rotateZ(Math.PI / 2),
      ),
      cyl(0.72, 0.72, 0.12, 0, -1.0).rotateZ(Math.PI / 2),
      cyl(0.72, 0.72, 0.12, 0, 1.0).rotateZ(Math.PI / 2),
      // two hydrogen tanks lying behind the stack
      new THREE.CapsuleGeometry(0.32, 1.6, 6, 20)
        .rotateZ(Math.PI / 2)
        .translate(0, -0.3, -1.25),
      new THREE.CapsuleGeometry(0.32, 1.6, 6, 20)
        .rotateZ(Math.PI / 2)
        .translate(0, 0.45, -1.25),
    ]),
];

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every stage as N points (+ a shade per point from its surface normal) and per-point flow data. */
function buildStages() {
  const r = rng(42);
  const pos: Float32Array[] = [];
  const col: Float32Array[] = [];
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const c = new THREE.Color();
  SHAPES.forEach((make, s) => {
    const P = new Float32Array(N * 3);
    const C = new Float32Array(N * 3);
    const base = new THREE.Color(COLORS[s]);
    const geo = make();
    const sampler = geo
      ? new MeshSurfaceSampler(new THREE.Mesh(geo)).build()
      : null;
    for (let i = 0; i < N; i++) {
      if (sampler) {
        sampler.sample(p, n);
      } else {
        // sand: a soft mound of grains
        const rad = Math.sqrt(r()) * 1.55;
        const a = r() * Math.PI * 2;
        p.set(
          Math.cos(a) * rad,
          (Math.pow(1 - rad / 1.55, 1.4) * 1.1 - 0.55) * r() - 0.6,
          Math.sin(a) * rad,
        );
        n.set(0, 1, 0);
      }
      P.set([p.x, p.y, p.z], i * 3);
      const shade = 0.72 + 0.38 * (n.y * 0.5 + 0.5) + (r() - 0.5) * 0.12;
      c.copy(base).multiplyScalar(shade);
      C.set([c.r, c.g, c.b], i * 3);
    }
    pos.push(P);
    col.push(C);
    geo?.dispose();
  });
  const delay = Float32Array.from({ length: N }, () => r());
  const swirl = Float32Array.from({ length: N * 3 }, () => (r() - 0.5) * 2.4);
  return { pos, col, delay, swirl };
}

const LOOK = new THREE.Vector3();
const TOP = new THREE.Vector3();
const TOP_LOOK = new THREE.Vector3();
const ease = (x: number) => x * x * (3 - 2 * x);

const pxScale = ({ size, viewport }: RootState) =>
  (size.height * viewport.dpr) /
  (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
let reducedCache: boolean | null = null;
const reducedMotion = () =>
  (reducedCache ??= window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches);

function Particles() {
  const pts =
    useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);
  const ring = useRef<THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>>(null);
  const disc = useRef<THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>>(null);
  const data = useMemo(() => buildStages(), []);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(data.pos[0]!.slice(), 3),
    );
    g.setAttribute("color", new THREE.BufferAttribute(data.col[0]!.slice(), 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
    return g;
  }, [data]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        uniforms: { uScale: { value: 800 }, uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          uniform float uScale; uniform float uTime; varying vec3 vC;
          void main() {
            vC = color;
            // a faint shimmer, on the GPU (the CPU only re-shapes when the scroll moves)
            vec3 p = position + sin(uTime * 1.7 + float(gl_VertexID)) * 0.006;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = 0.019 * uScale / -mv.z;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vC;
          void main() {
            float r = length(gl_PointCoord - 0.5) * 2.0;
            if (r > 1.0) discard;
            gl_FragColor = vec4(vC, smoothstep(1.0, 0.45, r) * 0.9);
          }`,
      }),
    [],
  );
  const spin = useRef(0);
  const shaped = useRef(-1);

  useFrame((state, dt) => {
    // shape 0 is the prelude module, so stage k lives at k + 1
    const [a, b, t] = stageAt(journey.progress);
    const pa = data.pos[a + 1]!;
    const pb = data.pos[b + 1]!;
    const ca = data.col[a + 1]!;
    const cb = data.col[b + 1]!;
    const P = pts.current!.geometry.attributes.position!.array as Float32Array;
    const C = pts.current!.geometry.attributes.color!.array as Float32Array;
    const still = reducedMotion();
    pts.current!.material.uniforms.uTime!.value = still
      ? 0
      : state.clock.elapsedTime;
    // re-shape only when the scroll has moved (14,000 points × 6 values is real work per frame)
    const key = a * 10 + b + t;
    if (key !== shaped.current) {
      shaped.current = key;
      for (let i = 0; i < N; i++) {
        const k = Math.min(1, Math.max(0, (t - data.delay[i]! * 0.45) / 0.55));
        const e = k * k * (3 - 2 * k);
        const lift = Math.sin(Math.PI * e);
        const j = i * 3;
        for (let q = 0; q < 3; q++) {
          P[j + q] =
            pa[j + q]! +
            (pb[j + q]! - pa[j + q]!) * e +
            lift * data.swirl[j + q]!;
          C[j + q] = ca[j + q]! + (cb[j + q]! - ca[j + q]!) * e;
        }
      }
      pts.current!.geometry.attributes.position!.needsUpdate = true;
      pts.current!.geometry.attributes.color!.needsUpdate = true;
    }
    pts.current!.material.uniforms.uScale!.value = pxScale(state);

    spin.current += journey.spin + (still || journey.dragging ? 0 : dt * 0.18);
    journey.spin *= 0.92;
    // the hand-offs (in from the panel, out to the map): the module squares up (it reads the same
    // turned half a turn) and the plinth fades
    const out = Math.max(ease(journey.in), ease(journey.out));
    const square = Math.round(spin.current / Math.PI) * Math.PI;
    pts.current!.rotation.y = spin.current + (square - spin.current) * out;
    ring.current!.rotation.z = spin.current;
    ring.current!.material.opacity = 0.28 * (1 - out);
    disc.current!.material.opacity = 0.06 * (1 - out);

    // the object sits right of the copy (below it on phones)
    const cam = state.camera as THREE.PerspectiveCamera;
    const { width: w, height: h } = state.size;
    cam.position.set(0, 1.6, w < h ? 11 : 7.6);
    LOOK.set(0, -0.2, 0);
    // and the camera is straight above it, centred, the module on the hand-off frame (bridge.ts)
    if (out > 0) {
      const top = (2.6 * h) / (bridgeWidth(w, h) * 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
      cam.position.lerp(TOP.set(0, top, 0.02), out);
      LOOK.lerp(TOP_LOOK.set(0, 0, 0), out);
    }
    // straight above, "up" must lie along the module or the view rolls
    const above = THREE.MathUtils.smoothstep(TOP.subVectors(cam.position, LOOK).normalize().y, 0.96, 0.995);
    cam.up.set(0, 1 - above, -above).normalize();
    cam.lookAt(LOOK);
    if (w < h) cam.setViewOffset(w, h, 0, -0.22 * h * (1 - out), w, h);
    else cam.setViewOffset(w, h, -0.2 * w * (1 - out), 0, w, h);
  });

  return (
    <>
      <points
        ref={pts}
        geometry={geometry}
        material={material}
        frustumCulled={false}
      />
      {/* the plinth: a soft brand ring the object turns above */}
      <mesh ref={ring} position={[0, -1.75, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.45, 1.5, 96]} />
        <meshBasicMaterial color="#0db02b" transparent opacity={0.28} />
      </mesh>
      <mesh ref={disc} position={[0, -1.76, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.45, 96]} />
        <meshBasicMaterial color="#28a9e2" transparent opacity={0.06} />
      </mesh>
    </>
  );
}

export default function JourneyScene() {
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
          flat
          dpr={stageDpr(dpr)}
          camera={{ position: [0, 1.6, 7.6], fov: FOV }}
          gl={{
            alpha: true,
            antialias: true,
            powerPreference: "high-performance",
          }}
          style={{ position: "absolute", inset: 0 }}
        >
          <PerformanceMonitor
            onDecline={() => setDpr(1)}
           
          />
          <Particles />
          <WarmUp onReady={onWarm} />
        </Canvas>
      )}
    </div>
  );
}
