"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { GROWTH, ORDER_BOOK, orderBookAt, profitAt, REVENUE_TARGET, targetAt, YEAR_SPAN, yearStart } from "../data/annual-report";
import { growth } from "../story-state";
import { NO_SCROLL_MEASURE, setStyle, useStage, WarmUp } from "./useStage";

/*
 * Growth as a skyline, to one honest scale (height ∝ ₹ Cr). Five glass columns rise year by year,
 * FY22 → FY26, each with its profit as a gold core; then, beside them, a hologram of the order book
 * (₹59,200 Cr, work already won) and, as the camera pulls back, the ₹1,00,000 Cr revenue target.
 * DOM labels ([data-col]) are pinned above each column.
 */

const S = 5 / REVENUE_TARGET; // world units per ₹ Cr (the target stands 5 units tall)
const PITCH = 0.62;
const SIZE = 0.44;
const COLS = [
  ...GROWTH.map((g, i) => ({ key: g.year, x: i * PITCH, h: g.revenue * S, core: g.pat * S, kind: "year" as const, i })),
  { key: "order", x: 5 * PITCH + 0.3, h: ORDER_BOOK.cr * S, core: 0, kind: "order" as const, i: 5 },
  { key: "target", x: 6 * PITCH + 0.75, h: REVENUE_TARGET * S, core: 0, kind: "target" as const, i: 6 },
];
const CENTER_ALL = (COLS[0]!.x + COLS[6]!.x) / 2;

const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

/** Glass that glows from the base up, with bright edges and a slow scan; `holo` makes it a see-through hologram. */
function columnMaterial(bottom: string, top: string, holo: boolean) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: !holo,
    side: holo ? THREE.DoubleSide : THREE.FrontSide,
    uniforms: { uTime: { value: 0 }, uA: { value: new THREE.Color(bottom) }, uB: { value: new THREE.Color(top) }, uGlow: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying float vY;
      void main() {
        vUv = uv; vN = normalize(normalMatrix * normal); vY = position.y + 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uGlow; uniform vec3 uA, uB; varying vec2 vUv; varying vec3 vN; varying float vY;
      void main() {
        vec3 c = mix(uA, uB, vY);
        float edge = max(smoothstep(0.035, 0.0, min(vUv.x, 1.0 - vUv.x)), smoothstep(0.02, 0.0, min(vUv.y, 1.0 - vUv.y)));
        float rim = pow(1.0 - abs(vN.z), 2.0);
        float scan = smoothstep(0.03, 0.0, abs(fract(vY - uTime * 0.12) - 0.5) - 0.47);
        ${holo
          ? "float lines = step(0.5, fract(vY * 40.0)) * 0.12; float a = 0.1 + lines + edge * 0.8 + scan * 0.35 + rim * 0.15;"
          : "float a = 0.6 + edge * 0.3 + rim * 0.1; c = c * (0.86 + rim * 0.35) + scan * 0.18 + uGlow * 0.08;"}
        gl_FragColor = vec4(c + edge * 0.35, a);
      }`,
  });
}

const CAM = { look: new THREE.Vector3(), pos: new THREE.Vector3(), dir: new THREE.Vector3(0.42, 0.3, 1).normalize(), v: new THREE.Vector3() };

function Skyline({ labels }: { labels: React.RefObject<HTMLDivElement | null> }) {
  const group = useRef<THREE.Group>(null);
  const cols = useRef<(THREE.Mesh | null)[]>([]);
  const cores = useRef<(THREE.Mesh | null)[]>([]);
  const els = useRef<HTMLElement[] | null>(null);
  const spin = useRef(0);
  const mats = useMemo(
    () => COLS.map((c) => (c.kind === "year" ? columnMaterial("#0a8a33", "#2fbfa0", false) : c.kind === "order" ? columnMaterial("#28a9e2", "#7fd6ff", true) : columnMaterial("#f0a020", "#ffd27a", true))),
    [],
  );
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  useFrame((state, dt) => {
    const p = growth.progress;
    const t = state.clock.elapsedTime;
    const prof = profitAt(p);
    const ob = orderBookAt(p);
    const tg = targetAt(p);
    // how far each column has risen
    const rise = COLS.map((c) => (c.kind === "year" ? smooth((p - yearStart(c.i)) / YEAR_SPAN) : c.kind === "order" ? ob : tg));
    COLS.forEach((c, i) => {
      const m = cols.current[i];
      if (!m) return;
      const h = Math.max(0.0001, c.h * rise[i]!);
      m.scale.set(SIZE, h, SIZE);
      m.position.y = h / 2;
      m.visible = rise[i]! > 0.001;
      (m.material as THREE.ShaderMaterial).uniforms.uTime!.value = t;
      (m.material as THREE.ShaderMaterial).uniforms.uGlow!.value = prof;
      const core = cores.current[i];
      if (core) {
        const ch = Math.max(0.0001, c.core * rise[i]!);
        core.scale.set(SIZE * 0.62, ch, SIZE * 0.62);
        core.position.y = ch / 2;
        core.visible = rise[i]! > 0.001;
        (core.material as THREE.MeshBasicMaterial).color.setRGB(1, 0.66 + 0.16 * prof, 0.1 + 0.25 * prof);
      }
    });

    // the frame: the years first (tallest so far fills ~60% of the view), then pull back for the
    // order book and the target. Drag turns the skyline a little.
    const cam = state.camera as THREE.PerspectiveCamera;
    const { width: w, height: hgt } = state.size;
    const narrow = w < hgt;
    const shownYears = rise.slice(0, 5).reduce((a, r) => a + (r > 0 ? 1 : 0), 0);
    const tallest = Math.max(0.25, ...COLS.slice(0, 5).map((c, i) => c.h * rise[i]!));
    const yearsCx = (Math.max(1, shownYears) - 1) * PITCH * 0.5;
    const focusH = THREE.MathUtils.lerp(THREE.MathUtils.lerp(tallest, COLS[5]!.h, ob), COLS[6]!.h, tg);
    const focusX = THREE.MathUtils.lerp(THREE.MathUtils.lerp(yearsCx, (COLS[0]!.x + COLS[5]!.x) / 2, ob), CENTER_ALL, tg);
    const span = THREE.MathUtils.lerp(THREE.MathUtils.lerp(Math.max(1, shownYears) * PITCH, COLS[5]!.x + PITCH, ob), COLS[6]!.x + PITCH, tg);
    const tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const fill = narrow ? 0.5 : 0.62;
    const dist = Math.max(focusH / (2 * tanH * fill), span / (2 * tanH * (w / hgt) * (narrow ? 0.8 : 0.5))) + 1.2;
    CAM.look.set(focusX, focusH * 0.48, 0);
    CAM.pos.copy(CAM.look).addScaledVector(CAM.dir, dist);
    const k = 1 - Math.exp(-4 * dt);
    cam.position.lerp(CAM.pos, k);
    cam.lookAt(CAM.look);
    if (narrow) cam.setViewOffset(w, hgt, 0, -0.2 * hgt, w, hgt);
    else cam.setViewOffset(w, hgt, -0.2 * w, 0, w, hgt);
    spin.current = THREE.MathUtils.clamp(spin.current + growth.spin, -0.5, 0.5) * (growth.dragging ? 1 : 0.96);
    growth.spin *= 0.9;
    group.current!.rotation.y = spin.current;

    // labels above each column
    const root = labels.current;
    if (!root) return;
    els.current ??= Array.from(root.querySelectorAll<HTMLElement>("[data-col]"));
    group.current!.updateMatrixWorld();
    els.current.forEach((el, i) => {
      const c = COLS[i]!;
      const r = rise[i]!;
      CAM.v.set(c.x, c.h * r + 0.08, 0);
      group.current!.localToWorld(CAM.v).project(cam);
      // on the pull-back, only FY26 keeps its label beside the order book and the target
      const keep = i < 4 ? 1 - ob : 1;
      setStyle(el, "opacity", (smooth((r - 0.6) / 0.4) * keep).toFixed(3));
      setStyle(el, "transform", `translate(${(((CAM.v.x + 1) / 2) * w).toFixed(1)}px, ${(((1 - CAM.v.y) / 2) * hgt).toFixed(1)}px)`);
      el.toggleAttribute("data-profit", prof > 0.5);
    });
  });

  return (
    <group ref={group}>
      {/* the floor: a soft grid that fades out */}
      <gridHelper args={[14, 28, "#cfe5d8", "#e3efe7"]} position={[CENTER_ALL, 0, 0]} />
      <mesh rotation-x={-Math.PI / 2} position={[CENTER_ALL, 0.001, 0]}>
        <planeGeometry args={[6.5, 2.2]} />
        <meshBasicMaterial color="#0db02b" transparent opacity={0.05} />
      </mesh>
      {COLS.map((c, i) => (
        <group key={c.key} position={[c.x, 0, 0]}>
          <mesh
            ref={(m) => {
              cols.current[i] = m;
            }}
            geometry={box}
            material={mats[i]}
            visible={false}
          />
          {c.core > 0 && (
            <mesh
              ref={(m) => {
                cores.current[i] = m;
              }}
              geometry={box}
              visible={false}
            >
              <meshBasicMaterial color="#ffb81f" toneMapped={false} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export default function RevenueSkyline({ labels }: { labels: React.RefObject<HTMLDivElement | null> }) {
  const { wrap, mounted, frameloop, onWarm, dpr: stageDpr } = useStage();
  const [dpr, setDpr] = useState(1.5);
  return (
    <div ref={wrap} className="absolute inset-0">
      {mounted && (
        <Canvas
          resize={NO_SCROLL_MEASURE}
          aria-hidden
          frameloop={frameloop}
          flat
          dpr={stageDpr(dpr)}
          camera={{ position: [1.2, 1, 4], fov: 36, near: 0.05, far: 80 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
          <Skyline labels={labels} />
          <WarmUp onReady={onWarm} />
        </Canvas>
      )}
    </div>
  );
}
