"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import type { Facility } from "../data/facilities";
import { INDIA_DOTS, INDIA_VIEWBOX, projectIndia } from "../data/india-map";
import { factories } from "../story-state";
import { BRIDGE_SRC, bridgeWidth } from "./bridge";
import { NO_SCROLL_MEASURE, setStyle, useStage, WarmUp } from "./useStage";

/*
 * Factories: India built from 2,247 solar-panel tiles (the official outline). The chapter opens on a
 * single tile filling the screen, framed like the last shot of “Inside the panel”, and pulls back
 * (factories.intro) until it is one panel among millions, as the towers rise. The tiles rise toward Waaree’s
 * sites like a landscape of light. Each site carries its status:
 *   operational: a solid emerald crystal tower, rings orbiting it, a beam and a ground pulse;
 *   under construction: an amber wireframe tower being filled from the ground up by a scan line;
 *   office: a small sky-blue beacon.
 * Arcs carry pulses of light from the south Gujarat hub to every site. DOM links are pinned to
 * the towers each frame (see `pins`), so the map stays keyboard- and screen-reader-friendly.
 */

const S = 1 / 100; // viewBox units → world
const toWorld = (x: number, y: number) => new THREE.Vector3((x - INDIA_VIEWBOX.width / 2) * S, 0, (y - INDIA_VIEWBOX.height / 2) * S);
const sitePos = (f: Facility) => {
  const p = projectIndia(f.lon, f.lat);
  return toWorld(p.x, p.y);
};
const HUB = (() => {
  const p = projectIndia(72.95, 20.6);
  return toWorld(p.x, p.y);
})();

const COL = {
  base: new THREE.Color("#d8efe1"),
  near: new THREE.Color("#22b85a"),
  far: new THREE.Color("#a8dcf0"),
  live: "#0db02b",
  build: "#f0a020",
  office: "#28a9e2",
};

let reducedCache: boolean | null = null;
const reducedMotion = () => (reducedCache ??= window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const SCRATCH = { m: new THREE.Matrix4(), v: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), c: new THREE.Color() };

/*
 * A tile is two modules side by side (each 2:1), and each is the very module from “Inside the panel”
 * (its render from above). Module rects in the 512 px texture: x 8–504, y 4–252 and 260–508.
 */
const TILE = 0.112;
const MOD = { w: (496 / 512) * TILE, h: (248 / 512) * TILE, z: -(128 / 512) * TILE }; // the first module, from the tile centre
function tileTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#dfe6ea";
  g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const img = new Image();
  img.onload = () => {
    g.drawImage(img, 8, 4, 496, 248);
    g.drawImage(img, 8, 260, 496, 248);
    t.needsUpdate = true;
  };
  img.src = BRIDGE_SRC;
  return t;
}

const FAR_TINT = new THREE.Color().setRGB(0.86, 0.93, 1.0);
const NEAR_TINT = new THREE.Color().setRGB(1.15, 1.55, 1.25);

/** The camera at the start of the zoom-out: straight above one tile in central India, clear of the towers. */
const START_TILE = (() => {
  const p = projectIndia(77.5, 22.6);
  const v = toWorld(p.x, p.y);
  // snap to the nearest real tile
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < INDIA_DOTS.length; i += 2) {
    const d = toWorld(INDIA_DOTS[i]!, INDIA_DOTS[i + 1]!).distanceToSquared(v);
    if (d < bestD) [best, bestD] = [i / 2, d];
  }
  return { at: toWorld(INDIA_DOTS[best * 2]!, INDIA_DOTS[best * 2 + 1]!), index: best };
})();
/** The start tile stands still at this height (no wave), so the opening frame is exact. */
const START_H = 0.06;

/** The country: panel tiles whose height and tint rise with closeness to a site; a wave rolls out from Gujarat. */
function Land({ sites }: { sites: THREE.Vector3[] }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const tex = useMemo(() => tileTexture(), []);
  const cells = useMemo(() => {
    const out: { p: THREE.Vector3; near: number; hub: number }[] = [];
    for (let i = 0; i < INDIA_DOTS.length; i += 2) {
      const p = toWorld(INDIA_DOTS[i]!, INDIA_DOTS[i + 1]!);
      const d = Math.min(...sites.map((s) => s.distanceTo(p)));
      out.push({ p, near: Math.exp(-d * 1.6), hub: p.distanceTo(HUB) });
    }
    return out;
  }, [sites]);

  useEffect(() => {
    const { c } = SCRATCH;
    cells.forEach((cl, i) => {
      // far: a cool, slightly muted panel; near a site: brighter and greener (tints the texture)
      c.copy(FAR_TINT).lerp(NEAR_TINT, Math.min(1, cl.near * 1.5));
      if (i === START_TILE.index) c.setRGB(1, 1, 1); // the panel we arrive on keeps its true colours
      mesh.current!.setColorAt(i, c);
    });
    mesh.current!.instanceColor!.needsUpdate = true;
  }, [cells]);

  useFrame((state) => {
    const t = reducedMotion() ? 0 : state.clock.elapsedTime;
    const { m, v, q, s } = SCRATCH;
    const wave = (t * 2.2) % 14; // radius of the travelling wave
    cells.forEach((cl, i) => {
      const w = Math.exp(-((cl.hub - wave) ** 2) * 3) * 0.12;
      const h = i === START_TILE.index ? START_H : 0.03 + cl.near * 0.2 + w;
      v.set(cl.p.x, h / 2, cl.p.z);
      s.set(1, h, 1);
      m.compose(v, q.identity(), s);
      mesh.current!.setMatrixAt(i, m);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, INDIA_DOTS.length / 2]} frustumCulled={false}>
      <boxGeometry args={[TILE, 1, TILE]} />
      {/* the panel on top only; plain sides (box groups: +x, −x, +y, −y, +z, −z) */}
      <meshStandardMaterial attach="material-0" color="#c9d6df" roughness={0.6} />
      <meshStandardMaterial attach="material-1" color="#c9d6df" roughness={0.6} />
      <meshStandardMaterial attach="material-2" map={tex} roughness={0.28} metalness={0.35} />
      <meshStandardMaterial attach="material-3" color="#c9d6df" roughness={0.6} />
      <meshStandardMaterial attach="material-4" color="#c9d6df" roughness={0.6} />
      <meshStandardMaterial attach="material-5" color="#c9d6df" roughness={0.6} />
    </instancedMesh>
  );
}

/** Operational site: crystal tower, orbiting rings, beam, ground pulse. */
function LiveTower({ at, active, big }: { at: THREE.Vector3; active: boolean; big: boolean }) {
  const rings = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const tower = useRef<THREE.Group>(null);
  const H = big ? 1.25 : 0.95;
  useFrame((state, dt) => {
    const t = reducedMotion() ? 0 : state.clock.elapsedTime;
    rings.current!.children.forEach((r, k) => (r.rotation.z = t * (0.6 + k * 0.3) * (k % 2 ? -1 : 1)));
    const k = (t * 0.6) % 1;
    pulse.current!.scale.setScalar(0.4 + k * 2.2);
    (pulse.current!.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.5;
    const target = active ? 1.18 : 1;
    tower.current!.scale.setScalar(THREE.MathUtils.damp(tower.current!.scale.x, target, 8, dt));
  });
  return (
    <group position={at} scale={1.6}>
      <group ref={tower}>
        <mesh position={[0, H / 2 + 0.05, 0]}>
          <cylinderGeometry args={[0.07, 0.1, H, 6]} />
          <meshStandardMaterial color={COL.live} emissive={COL.live} emissiveIntensity={0.35} roughness={0.12} metalness={0.2} transparent opacity={0.92} />
        </mesh>
        <mesh position={[0, H + 0.1, 0]}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshBasicMaterial color="#b9ffcb" toneMapped={false} />
        </mesh>
        <group ref={rings}>
          {[0.35, 0.65, 0.95].map((y, k) => (
            <mesh key={y} position={[0, y * H, 0]} rotation={[Math.PI / 2 - 0.25 * (k - 1), 0, 0]}>
              <torusGeometry args={[0.17 + k * 0.03, 0.006, 6, 48, Math.PI * 1.5]} />
              <meshBasicMaterial color={k === 1 ? "#28a9e2" : COL.live} transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
        {/* beam */}
        <mesh position={[0, H + 0.9, 0]}>
          <cylinderGeometry args={[0.012, 0.03, 1.6, 8, 1, true]} />
          <meshBasicMaterial color="#5fe08a" transparent opacity={active ? 0.55 : 0.25} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <mesh ref={pulse} position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.18, 0.2, 48]} />
        <meshBasicMaterial color={COL.live} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Under construction: amber wireframe tower, filled from the ground by a scan line (looping). */
function BuildTower({ at, active }: { at: THREE.Vector3; active: boolean }) {
  const fill = useRef<THREE.Mesh>(null);
  const scan = useRef<THREE.Mesh>(null);
  const crane = useRef<THREE.Group>(null);
  const H = 1.2;
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.1, 0.13, H, 6, 6)), []);
  useFrame((state) => {
    const t = reducedMotion() ? 2 : state.clock.elapsedTime;
    const k = 0.15 + ((t * 0.12) % 1) * 0.5; // the fill climbs to ~65%, then starts over
    fill.current!.scale.y = k;
    fill.current!.position.y = (k * H) / 2;
    scan.current!.position.y = k * H;
    crane.current!.rotation.y = Math.sin(t * 0.7) * 1.2;
  });
  return (
    <group position={at} scale={active ? 1.8 : 1.6}>
      <lineSegments geometry={edges} position={[0, H / 2, 0]}>
        <lineBasicMaterial color={COL.build} transparent opacity={0.9} />
      </lineSegments>
      <mesh ref={fill}>
        <cylinderGeometry args={[0.095, 0.125, H, 6]} />
        <meshStandardMaterial color={COL.build} emissive={COL.build} emissiveIntensity={0.4} transparent opacity={0.55} />
      </mesh>
      <mesh ref={scan}>
        <cylinderGeometry args={[0.2, 0.2, 0.008, 24]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0.85} />
      </mesh>
      {/* a tiny tower crane on top */}
      <group position={[0.22, 0, 0]}>
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.025, 1.5, 0.025]} />
          <meshStandardMaterial color="#f2b31b" />
        </mesh>
        <group ref={crane} position={[0, 1.5, 0]}>
          <mesh position={[-0.12, 0, 0]}>
            <boxGeometry args={[0.5, 0.02, 0.02]} />
            <meshStandardMaterial color="#f2b31b" />
          </mesh>
        </group>
      </group>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.24, 0.26, 6]} />
        <meshBasicMaterial color={COL.build} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Beacon({ at }: { at: THREE.Vector3 }) {
  return (
    <group position={at} scale={1.5}>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.07, 20, 14]} />
        <meshStandardMaterial color={COL.office} emissive={COL.office} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.34, 8]} />
        <meshStandardMaterial color="#9fc6dc" />
      </mesh>
    </group>
  );
}

/** Arcs from the hub with pulses running along them. */
function Arcs({ sites }: { sites: THREE.Vector3[] }) {
  const curves = useMemo(
    () =>
      sites
        .filter((s) => s.distanceTo(HUB) > 0.5)
        .map((s) => {
          const mid = HUB.clone().lerp(s, 0.5);
          mid.y = 0.9 + HUB.distanceTo(s) * 0.25;
          return new THREE.QuadraticBezierCurve3(HUB.clone().setY(0.6), mid, s.clone().setY(0.9));
        }),
    [sites],
  );
  const dots = useRef<THREE.InstancedMesh>(null);
  useFrame((state) => {
    const t = reducedMotion() ? 0.5 : state.clock.elapsedTime;
    const { m, v } = SCRATCH;
    curves.forEach((c, i) => {
      for (let k = 0; k < 3; k++) {
        c.getPoint(((t * 0.35 + k / 3 + i * 0.13) % 1), v);
        m.makeTranslation(v.x, v.y, v.z);
        dots.current!.setMatrixAt(i * 3 + k, m);
      }
    });
    dots.current!.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      {curves.map((c, i) => (
        <mesh key={i}>
          <tubeGeometry args={[c, 48, 0.008, 6, false]} />
          <meshBasicMaterial color="#28a9e2" transparent opacity={0.4} />
        </mesh>
      ))}
      <instancedMesh ref={dots} args={[undefined, undefined, curves.length * 3]} frustumCulled={false}>
        <sphereGeometry args={[0.035, 10, 8]} />
        <meshBasicMaterial color="#19d27a" />
      </instancedMesh>
    </group>
  );
}

/** Pins appear once India is in view. */
const fade = (el: HTMLElement, v: number) => setStyle(el, "opacity", Math.min(1, Math.max(0, v)).toFixed(3));

const OVER = { pos: new THREE.Vector3(1.4, 7.4, 10.6), look: new THREE.Vector3(0, 0.2, 0.3) };
const CAM = { look: new THREE.Vector3(), dir: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0.001).normalize(), over: new THREE.Vector3(), tile: new THREE.Vector3(), corner: new THREE.Vector3() };
const smooth = (x: number) => {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
};

type Props = {
  sites: Facility[];
  active: string | null;
  pins: React.RefObject<HTMLDivElement | null>;
  /** The hand-off layer: a white veil, then the panel’s render (BRIDGE_BOX). */
  bridge: React.RefObject<HTMLDivElement | null>;
};

function Scene({ sites, active, pins, bridge }: Props) {
  const group = useRef<THREE.Group>(null);
  const towers = useRef<THREE.Group>(null);
  const positions = useMemo(() => sites.map(sitePos), [sites]);
  const pinEls = useRef<HTMLElement[] | null>(null);
  const bridgeDone = useRef(false);

  useFrame((state) => {
    // the zoom-out: from straight above one tile (log-distance, so it feels like one continuous pull) to all of India
    const f = factories.intro;
    const t = f * f * (3 - 2 * f);
    const cam = state.camera as THREE.PerspectiveCamera;
    const { width: W, height: H } = state.size;
    const tileTop = CAM.tile.copy(START_TILE.at).setY(START_H);
    tileTop.z += MOD.z; // frame one of the tile’s two modules
    group.current!.localToWorld(tileTop);
    CAM.look.copy(tileTop).lerp(OVER.look, t);
    CAM.over.copy(OVER.pos).sub(OVER.look);
    const far = CAM.over.length();
    CAM.dir.copy(CAM.up).lerp(CAM.over.normalize(), Math.pow(t, 0.8)).normalize();
    // the opening frame is the hand-off frame: this module exactly where “Inside the panel” left its own
    // (×1.015: the module’s outer frame sits a hair inside the render’s edge; measured on screen)
    const near = (1.015 * MOD.w * H) / (bridgeWidth(W, H) * 2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    cam.position.copy(CAM.look).addScaledVector(CAM.dir, near * Math.pow(far / near, t));
    // straight above, "up" must lie along the map (north) or the view rolls as the camera starts to tilt
    const above = THREE.MathUtils.smoothstep(CAM.dir.y, 0.9, 0.999);
    cam.up.set(0, 1 - above, -above).normalize();
    cam.lookAt(CAM.look);
    if (W < H) cam.setViewOffset(W, H, 0, -0.16 * t * H, W, H);
    else cam.setViewOffset(W, H, -0.17 * t * W, 0, W, H);

    // the hand-off: a white veil and the panel’s render cover the first frame, then the veil lifts
    // (the neighbouring tiles appear) and the render melts into its tile as we pull back
    const b = bridge.current;
    if (b && (f < 0.2 || !bridgeDone.current)) {
      bridgeDone.current = f >= 0.2;
      const veil = b.firstElementChild as HTMLElement;
      const img = b.lastElementChild as HTMLElement;
      fade(veil, 1 - smooth(f / 0.06));
      fade(img, 1 - smooth((f - 0.03) / 0.09));
      // keep the render on its tile: project the module’s corners
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        const v = CAM.corner.set(START_TILE.at.x + (sx * MOD.w) / 2, START_H, START_TILE.at.z + MOD.z + (sz * MOD.h) / 2);
        group.current!.localToWorld(v).project(cam);
        const px = ((v.x + 1) / 2) * W;
        const py = ((1 - v.y) / 2) * H;
        [x0, x1, y0, y1] = [Math.min(x0, px), Math.max(x1, px), Math.min(y0, py), Math.max(y1, py)];
      }
      const bw = bridgeWidth(W, H);
      setStyle(img, "transform", `translate(${((x0 + x1) / 2 - W / 2).toFixed(1)}px, ${((y0 + y1) / 2 - H / 2).toFixed(1)}px) scale(${((x1 - x0) / bw).toFixed(4)})`);
    }
    // the towers rise as India comes into view
    const rise = Math.min(1, Math.max(0, (f - 0.45) / 0.4));
    towers.current!.scale.set(1, Math.max(0.001, rise * rise * (3 - 2 * rise)), 1);

    // the map holds still (the towers and the light move), so its links are easy to hit
    // pin the DOM links above each tower
    const root = pins.current;
    if (root) fade(root, (f - 0.82) / 0.15);
    if (!root) return;
    pinEls.current ??= Array.from(root.querySelectorAll<HTMLElement>("[data-pin]"));
    const { v } = SCRATCH;
    const { width: w, height: h } = state.size;
    pinEls.current.forEach((el) => {
      const i = Number(el.dataset.pin);
      v.copy(positions[i]!).setY(sites[i]!.kind === "office" ? 0.85 : sites[i]!.status === "under-construction" ? 2.7 : 2.2);
      group.current!.localToWorld(v).project(state.camera);
      setStyle(el, "transform", `translate(${(((v.x + 1) / 2) * w).toFixed(1)}px, ${(((1 - v.y) / 2) * h).toFixed(1)}px)`);
    });
  });

  return (
    <group ref={group} position={[-0.1, 0, 0]}>
      <Land sites={positions.filter((_, i) => sites[i]!.kind !== "office")} />
      <Arcs sites={positions.filter((_, i) => sites[i]!.kind === "manufacturing" || sites[i]!.kind === "development")} />
      <group ref={towers}>
      {sites.map((f, i) =>
        f.status === "under-construction" ? (
          <BuildTower key={f.slug} at={positions[i]!} active={active === f.slug} />
        ) : f.kind === "office" ? (
          <Beacon key={f.slug} at={positions[i]!} />
        ) : (
          <LiveTower key={f.slug} at={positions[i]!} active={active === f.slug} big={f.slug === "chikhli" || f.slug === "samakhiali"} />
        ),
      )}
      </group>
    </group>
  );
}

export default function IndiaHolo(props: Props) {
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
                camera={{ position: [1.4, 7.4, 10.6], fov: 40, near: 0.02, far: 80 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <hemisphereLight args={["#ffffff", "#d9efe2", 2.1]} />
        <directionalLight position={[4, 8, 5]} intensity={1.6} />
        <directionalLight position={[-6, 4, -3]} intensity={0.5} color="#bfe6ff" />
        <Scene {...props} />
        <WarmUp onReady={onWarm} />
      </Canvas>
      )}
    </div>
  );
}
