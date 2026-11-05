"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { impact } from "../story-state";
import { NO_SCROLL_MEASURE, useStage, WarmUp } from "./useStage";

/*
 * Impact at every level: a floating island under a living sky (impact.progress).
 *   Planet      0.00–0.36  smoggy dawn → clear morning; the solar farm fills, forests grow, birds return
 *   People      0.36–0.69  dusk; homes (half with rooftop solar) light up one by one along the pylons
 *   Prosperity  0.69–1.00  golden hour; the city and factory glow, trucks run, value rises as light
 * Hills, a lake, layered trees, gable-roofed houses, lattice pylons with sagging cables, a lit city.
 * Real shadows from a sun that moves with the time of day (no post-processing: it kept first load slow).
 * All procedural: nothing to download.
 */

const R = 4.4;
const ZONE = { planet: 0, people: (Math.PI * 2) / 3, prosperity: (Math.PI * 4) / 3 };
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const sm = (x: number) => x * x * (3 - 2 * x);
let reducedCache: boolean | null = null;
const reducedMotion = () => (reducedCache ??= window.matchMedia("(prefers-reduced-motion: reduce)").matches);
const S = { m: new THREE.Matrix4(), v: new THREE.Vector3(), w: new THREE.Vector3(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(), s: new THREE.Vector3(), c: new THREE.Color(), e: new THREE.Euler() };

/* ── time of day: [progress, sky top, horizon, sun colour, sun intensity, sun position, lights] ── */
type Key = [number, string, string, string, number, THREE.Vector3Tuple, number];
const DAY: Key[] = [
  [0.0, "#c3bdb2", "#ddd6ca", "#e9dcc6", 0.9, [-6, 7, 5], 0],
  [0.24, "#9ccff3", "#eef8ff", "#fff4e2", 2.4, [-6, 9, 5], 0],
  [0.4, "#9ccff3", "#eef8ff", "#fff4e2", 2.3, [-4, 9, 6], 0],
  [0.55, "#8d9fd8", "#ffc8a0", "#ff9e6b", 1.15, [7, 2.6, 3], 1],
  [0.69, "#8d9fd8", "#ffc8a0", "#ff9e6b", 1.1, [7, 2.4, 3], 1],
  [0.84, "#a9cdf0", "#ffe3b8", "#ffcf88", 1.9, [6, 5, 6], 0.55],
  [1.0, "#a9cdf0", "#ffe3b8", "#ffcf88", 1.9, [6, 5, 6], 0.55],
];
const DAY_C = DAY.map((k) => ({ p: k[0], top: new THREE.Color(k[1]), hor: new THREE.Color(k[2]), sun: new THREE.Color(k[3]), i: k[4], pos: new THREE.Vector3(...k[5]), lights: k[6] }));
const SKY = { top: new THREE.Color(), hor: new THREE.Color(), sun: new THREE.Color(), pos: new THREE.Vector3(), i: 1, lights: 0 };
function dayAt(p: number) {
  let i = 0;
  while (i < DAY_C.length - 2 && p > DAY_C[i + 1]!.p) i++;
  const a = DAY_C[i]!;
  const b = DAY_C[i + 1]!;
  const t = sm(seg(p, a.p, b.p));
  SKY.top.copy(a.top).lerp(b.top, t);
  SKY.hor.copy(a.hor).lerp(b.hor, t);
  SKY.sun.copy(a.sun).lerp(b.sun, t);
  SKY.pos.copy(a.pos).lerp(b.pos, t);
  SKY.i = a.i + (b.i - a.i) * t;
  SKY.lights = a.lights + (b.lights - a.lights) * t;
  return SKY;
}

/* ── terrain ─────────────────────────────────────────────────────────────── */
const LAKE = new THREE.Vector3(Math.sin(ZONE.planet + 0.95) * 2.5, 0, Math.cos(ZONE.planet + 0.95) * 2.5);
function nature(x: number, z: number) {
  // hills only in the planet zone, fading toward the built zones
  const a = Math.atan2(x, z);
  const d = Math.abs(Math.atan2(Math.sin(a - ZONE.planet), Math.cos(a - ZONE.planet)));
  return clamp(1.4 - d * 1.1);
}
function heightAt(x: number, z: number) {
  const r = Math.hypot(x, z);
  const hills = (Math.sin(x * 1.4 + 0.3) + Math.cos(z * 1.2) + Math.sin((x + z) * 0.8)) * 0.07 + 0.12;
  const lake = Math.hypot(x - LAKE.x, z - LAKE.z);
  let h = hills * nature(x, z) - sm(clamp(1 - lake / 0.85)) * 0.32;
  h *= sm(clamp((R - r) / 0.5)); // flatten to the rim
  return h;
}

function terrainGeometry() {
  const rings = 48;
  const segs = 160;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  const sand = new THREE.Color("#e6dcc4");
  const shore = new THREE.Color("#c9d9b8");
  const grass = [new THREE.Color("#9fd38a"), new THREE.Color("#7cc276"), new THREE.Color("#b9dea0")];
  for (let ri = 0; ri <= rings; ri++) {
    const r = (ri / rings) * R;
    for (let si = 0; si <= segs; si++) {
      const a = (si / segs) * Math.PI * 2;
      const x = Math.sin(a) * r;
      const z = Math.cos(a) * r;
      const h = heightAt(x, z);
      pos.push(x, h, z);
      const n = Math.sin(x * 3.1) * Math.cos(z * 2.7) * 0.5 + 0.5;
      c.copy(grass[0]!).lerp(grass[1]!, n).lerp(grass[2]!, clamp(h * 3));
      if (r > R - 0.35) c.lerp(sand, sm(clamp((r - (R - 0.35)) / 0.3))); // sandy rim
      if (h < -0.05) c.lerp(shore, 0.6); // lake shore
      col.push(c.r, c.g, c.b);
    }
  }
  for (let ri = 0; ri < rings; ri++)
    for (let si = 0; si < segs; si++) {
      const a = ri * (segs + 1) + si;
      const b = a + segs + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const t = new THREE.BufferGeometry();
  t.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  t.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  t.setIndex(idx);
  t.computeVertexNormals();
  return t;
}

/** The island’s underside: rock strata tapering to a point. */
function rockGeometry() {
  const g = new THREE.CylinderGeometry(R, R * 0.35, 1.8, 96, 8, true);
  const p = g.attributes.position!;
  const col: number[] = [];
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = (y + 0.9) / 1.8; // 0 bottom → 1 top
    const a = Math.atan2(p.getX(i), p.getZ(i));
    const j = 1 + Math.sin(a * 9 + y * 4) * 0.035 + Math.sin(a * 23) * 0.015;
    p.setX(i, p.getX(i) * j);
    p.setZ(i, p.getZ(i) * j);
    c.set(k > 0.85 ? "#cfe0b8" : k > 0.6 ? "#d9c7a6" : k > 0.3 ? "#c4ab88" : "#a98f70");
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.translate(0, -0.9, 0);
  g.computeVertexNormals();
  return g;
}

/* ── layout ───────────────────────────────────────────────────────────────── */
function rng(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}
function inZone(zone: number, r: () => number, spread: number, rMin: number, rMax: number) {
  const a = zone + (r() - 0.5) * spread * 2;
  const d = rMin + Math.sqrt(r()) * (rMax - rMin);
  return new THREE.Vector3(Math.sin(a) * d, 0, Math.cos(a) * d);
}
function buildLayout() {
  const r = rng(7);
  const panels: THREE.Vector3[] = [];
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 16; col++) {
      const a = ZONE.planet - 0.62 + col * 0.075;
      const d = 1.35 + row * 0.27;
      panels.push(new THREE.Vector3(Math.sin(a) * d, 0, Math.cos(a) * d));
    }
  const trees: THREE.Vector3[] = [];
  while (trees.length < 140) {
    const p = inZone(ZONE.planet + (r() > 0.5 ? 0.98 : -1.0), r, 0.42, 1.0, R - 0.3);
    if (Math.hypot(p.x - LAKE.x, p.z - LAKE.z) > 0.8) trees.push(p);
  }
  for (let k = 0; k < 30; k++) trees.push(inZone(ZONE.people + (r() - 0.5) * 1.6, r, 0.2, R - 1.0, R - 0.35));
  const houses = Array.from({ length: 40 }, () => inZone(ZONE.people, r, 0.5, 1.3, R - 0.75));
  const city = Array.from({ length: 16 }, () => inZone(ZONE.prosperity + 0.32, r, 0.26, 0.9, 2.5));
  const pylons = Array.from({ length: 8 }, (_, k) => {
    const a = ZONE.planet + 0.15 + (ZONE.people - ZONE.planet - 0.3) * (k / 7);
    return new THREE.Vector3(Math.sin(a) * 3.25, 0, Math.cos(a) * 3.25);
  });
  const rand = Array.from({ length: 400 }, () => r());
  return { panels, trees, houses, city, pylons, rand };
}

/** Night-window texture for the city towers. */
function windowTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 8)
    for (let x = 4; x < 64; x += 10) {
      g.fillStyle = Math.sin(x * 12.9 + y * 78.2) > -0.3 ? "#ffd98a" : "#202020";
      g.fillRect(x, y, 6, 4);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A lattice pylon: tapered legs with cross-bracing, as line segments. */
function pylonGeometry() {
  const g = new THREE.CylinderGeometry(0.03, 0.11, 1.1, 4, 6, true);
  g.translate(0, 0.55, 0);
  return new THREE.EdgesGeometry(g, 1);
}

/** Places houses, roofs, rooftop solar, windows, city towers and lamps (static). */
function placeStatic(L: ReturnType<typeof buildLayout>, refs: Record<string, THREE.InstancedMesh>) {
  const { m, v, w, q, q2, s, e, c } = S;
  const roofCols = ["#c8634a", "#b8574a", "#d07a55", "#8a6f63", "#5f7d8c"];
  const wallCols = ["#f8f4ec", "#f1ebe0", "#fbf8f2", "#ecefe9"];
  L.houses.forEach((p, i) => {
    const yaw = Math.atan2(p.x, p.z) + (L.rand[i]! - 0.5) * 0.5;
    const y = heightAt(p.x, p.z);
    const sc = 0.85 + L.rand[i + 50]! * 0.4;
    q.setFromEuler(e.set(0, yaw, 0));
    m.compose(v.set(p.x, y + 0.11 * sc, p.z), q, s.set(0.3 * sc, 0.22 * sc, 0.26 * sc));
    refs.houses!.setMatrixAt(i, m);
    refs.houses!.setColorAt(i, c.set(wallCols[i % wallCols.length]!));
    // a gable roof: a triangular prism lying along the house
    q2.setFromEuler(e.set(0, yaw + Math.PI / 2, Math.PI / 2, "YXZ"));
    m.compose(v.set(p.x, y + 0.27 * sc, p.z), q2, s.set(0.17 * sc, 0.34 * sc, 0.2 * sc));
    refs.roofs!.setMatrixAt(i, m);
    refs.roofs!.setColorAt(i, c.set(roofCols[i % roofCols.length]!));
    // rooftop solar on every other house, on the slope facing out
    const pv = i % 2 === 0 ? 1 : 0;
    w.set(0, 0, 0.07 * sc).applyQuaternion(q).add(p).setY(y + 0.29 * sc);
    q2.setFromEuler(e.set(0.6, yaw, 0, "YXZ"));
    m.compose(w, q2, s.set(0.24 * sc * pv, 0.012, 0.1 * sc * pv));
    refs.roofPv!.setMatrixAt(i, m);
    // a window on the front wall
    w.set(0, 0, 0.132 * sc).applyQuaternion(q).add(p).setY(y + 0.1 * sc);
    m.compose(w, q, s.set(0.09 * sc, 0.07 * sc, 1));
    refs.windows!.setMatrixAt(i, m);
  });
  L.city.forEach((p, i) => {
    const h = 0.7 + L.rand[i + 100]! * 1.7;
    m.compose(v.set(p.x, h / 2, p.z), q.setFromEuler(e.set(0, L.rand[i]! * 1.5, 0)), s.set(0.34, h, 0.34));
    refs.towers!.setMatrixAt(i, m);
  });
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2;
    m.compose(v.set(Math.sin(a) * 3.88, 0.22, Math.cos(a) * 3.88), q.identity(), s.setScalar(1));
    refs.lamps!.setMatrixAt(k, m);
  }
  for (const im of Object.values(refs)) im.instanceMatrix.needsUpdate = true;
  refs.houses!.instanceColor!.needsUpdate = true;
  refs.roofs!.instanceColor!.needsUpdate = true;
}

/** Soft, rounded shapes (unit-sized where they are scaled per instance). */
const ROUND = {
  house: new RoundedBoxGeometry(1, 1, 1, 3, 0.12),
  tower: new RoundedBoxGeometry(1, 1, 1, 3, 0.08),
  truck: new RoundedBoxGeometry(0.3, 0.12, 0.12, 2, 0.04),
  factory: new RoundedBoxGeometry(1.7, 0.56, 1, 3, 0.06),
};

/* ── the scene ────────────────────────────────────────────────────────────── */
function World() {
  const L = useMemo(() => buildLayout(), []);
  const geo = useMemo(() => ({ terrain: terrainGeometry(), rock: rockGeometry(), pylon: pylonGeometry(), windows: windowTexture() }), []);
  const cables = useMemo(
    () =>
      L.pylons.slice(0, -1).flatMap((a, i) => {
        const b = L.pylons[i + 1]!;
        return [-0.12, 0.12].map((off) => {
          const n = new THREE.Vector3(b.z - a.z, 0, a.x - b.x).normalize().multiplyScalar(off);
          const A = a.clone().add(n).setY(1.02 + heightAt(a.x, a.z));
          const B = b.clone().add(n).setY(1.02 + heightAt(b.x, b.z));
          const M = A.clone().lerp(B, 0.5);
          M.y -= 0.12;
          return new THREE.QuadraticBezierCurve3(A, M, B);
        });
      }),
    [L],
  );
  const hazeGeo = useMemo(() => {
    const r = rng(99);
    const pts: number[] = [];
    for (let i = 0; i < 1400; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * (R + 0.4);
      pts.push(Math.sin(a) * d, 0.2 + r() * 2.2, Math.cos(a) * d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const softDot = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  const skyUniforms = useMemo(() => ({ top: { value: new THREE.Color() }, hor: { value: new THREE.Color() } }), []);

  const group = useRef<THREE.Group>(null);
  const sky = useRef<THREE.ShaderMaterial>(null);
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const sunDisc = useRef<THREE.Mesh>(null);
  const panels = useRef<THREE.InstancedMesh>(null);
  const posts = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);
  const houses = useRef<THREE.InstancedMesh>(null);
  const roofs = useRef<THREE.InstancedMesh>(null);
  const roofPv = useRef<THREE.InstancedMesh>(null);
  const windows = useRef<THREE.InstancedMesh>(null);
  const towers = useRef<THREE.InstancedMesh>(null);
  const towerMat = useRef<THREE.MeshStandardMaterial>(null);
  const factoryMat = useRef<THREE.MeshStandardMaterial>(null);
  const pulses = useRef<THREE.InstancedMesh>(null);
  const trucks = useRef<THREE.InstancedMesh>(null);
  const motes = useRef<THREE.InstancedMesh>(null);
  const birds = useRef<THREE.Group>(null);
  const clouds = useRef<THREE.Group>(null);
  const haze = useRef<THREE.Points>(null);
  const lamps = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    placeStatic(L, { houses: houses.current!, roofs: roofs.current!, roofPv: roofPv.current!, windows: windows.current!, towers: towers.current!, lamps: lamps.current! });
  }, [L]);

  useFrame((state, dt) => {
    const p = impact.progress;
    const t = reducedMotion() ? 4 : state.clock.elapsedTime;
    const { m, v, q, s, c, e } = S;
    const d = dayAt(p);

    // sky, sun, lights
    const u = sky.current!.uniforms;
    (u.top!.value as THREE.Color).copy(d.top);
    (u.hor!.value as THREE.Color).copy(d.hor);
    sun.current!.color.copy(d.sun);
    sun.current!.intensity = d.i;
    sun.current!.position.copy(d.pos);
    hemi.current!.color.copy(d.top).lerp(c.set("#ffffff"), 0.5);
    hemi.current!.groundColor.copy(d.hor).multiplyScalar(0.6);
    hemi.current!.intensity = 0.55 + d.i * 0.25;
    sunDisc.current!.position.copy(d.pos).normalize().multiplyScalar(28);
    (sunDisc.current!.material as THREE.MeshBasicMaterial).color.copy(d.sun).multiplyScalar(2.2);

    // turn the island so the current zone faces us; it floats
    const zone = p < 0.36 ? ZONE.planet : p < 0.69 ? ZONE.people : ZONE.prosperity;
    const target = -zone + Math.sin(t * 0.12) * 0.1;
    const cur = group.current!.rotation.y;
    group.current!.rotation.y = cur + Math.atan2(Math.sin(target - cur), Math.cos(target - cur)) * (1 - Math.exp(-dt * 2));
    group.current!.position.y = Math.sin(t * 0.6) * 0.04;

    // PLANET: haze lifts; panels land row by row; trees grow; birds return
    const clean = seg(p, 0.03, 0.24);
    (haze.current!.material as THREE.PointsMaterial).opacity = (1 - clean) * 0.5;
    haze.current!.visible = clean < 0.99;
    L.panels.forEach((pt, i) => {
      const k = sm(clamp(seg(p, 0.05, 0.27) * 1.4 - (i / L.panels.length) * 0.4));
      const y = heightAt(pt.x, pt.z);
      q.setFromEuler(e.set(-0.55, Math.atan2(pt.x, pt.z), 0, "YXZ"));
      m.compose(v.set(pt.x, y + 0.13 + (1 - k) * 0.6, pt.z), q, s.setScalar(Math.max(1e-3, k)));
      panels.current!.setMatrixAt(i, m);
      m.compose(v.set(pt.x, y + 0.06, pt.z), q.identity(), s.set(1, Math.max(1e-3, k), 1));
      posts.current!.setMatrixAt(i, m);
    });
    panels.current!.instanceMatrix.needsUpdate = true;
    posts.current!.instanceMatrix.needsUpdate = true;
    L.trees.forEach((pt, i) => {
      const k = Math.max(1e-3, sm(clamp(seg(p, 0.08, 0.3) * 1.5 - L.rand[i % 400]! * 0.5)));
      const y = heightAt(pt.x, pt.z);
      const h = 0.75 + L.rand[(i + 9) % 400]! * 0.6;
      m.compose(v.set(pt.x, y + 0.09 * h * k, pt.z), q.identity(), s.set(k, h * k, k));
      trunks.current!.setMatrixAt(i, m);
      for (let j = 0; j < 2; j++) {
        const sz = (j ? 0.1 : 0.14) * h * k;
        m.compose(v.set(pt.x, y + (0.22 + j * 0.13) * h * k, pt.z), q.setFromEuler(e.set(0, L.rand[(i * 3 + j) % 400]! * 3, 0)), s.set(sz, sz * 1.15, sz));
        crowns.current!.setMatrixAt(i * 2 + j, m);
        c.set(j ? "#6cc06a" : "#3f9e52").offsetHSL((L.rand[(i + j) % 400]! - 0.5) * 0.04, 0, (L.rand[(i * 7) % 400]! - 0.5) * 0.08);
        crowns.current!.setColorAt(i * 2 + j, c);
      }
    });
    trunks.current!.instanceMatrix.needsUpdate = true;
    crowns.current!.instanceMatrix.needsUpdate = true;
    crowns.current!.instanceColor!.needsUpdate = true;
    birds.current!.visible = clean > 0.6;
    birds.current!.children.forEach((b, k) => {
      const a = t * (0.25 + k * 0.02) + k * 0.7;
      b.position.set(Math.sin(a) * (1.6 + (k % 3) * 0.4) + 0.6, 2.2 + (k % 4) * 0.18 + Math.sin(t * 2 + k) * 0.05, Math.cos(a) * (1.6 + (k % 3) * 0.4) + 1.2);
      b.rotation.y = a + Math.PI / 2;
      const flap = Math.sin(t * 9 + k) * 0.6;
      b.children[0]!.rotation.z = flap;
      b.children[1]!.rotation.z = -flap;
    });
    clouds.current!.rotation.y = t * 0.02;

    // PEOPLE: windows and lamps light one by one at dusk; power runs along the pylons
    const lit = seg(p, 0.42, 0.6);
    L.houses.forEach((_, i) => {
      const on = lit * 1.35 - (i / L.houses.length) * 0.35 > 0.5 ? Math.max(0.15, d.lights) : 0;
      c.set("#ffcf6a").multiplyScalar(on ? 1 + on * 2.6 : 0.25);
      windows.current!.setColorAt(i, c);
    });
    windows.current!.instanceColor!.needsUpdate = true;
    for (let k = 0; k < 36; k++) lamps.current!.setColorAt(k, c.set("#ffe6a8").multiplyScalar(0.4 + d.lights * 2.6));
    lamps.current!.instanceColor!.needsUpdate = true;
    let n = 0;
    cables.forEach((cv, i) => {
      for (let k = 0; k < 2; k++) {
        cv.getPoint((t * 0.4 + k / 2 + i * 0.07) % 1, v);
        m.compose(v, q.identity(), s.setScalar(Math.max(1e-3, clamp(p * 3))));
        pulses.current!.setMatrixAt(n++, m);
      }
    });
    pulses.current!.instanceMatrix.needsUpdate = true;

    // PROSPERITY: the city lights, factory glow, trucks, value rising
    const rich = seg(p, 0.7, 0.88);
    towerMat.current!.emissiveIntensity = Math.max(d.lights, rich * 0.8) * 1.6;
    factoryMat.current!.emissiveIntensity = 0.05 + rich * 0.6;
    for (let k = 0; k < 8; k++) {
      const a = ((t * 0.035 + k / 8) % 1) * Math.PI * 2;
      m.compose(v.set(Math.sin(a) * 3.62, 0.07, Math.cos(a) * 3.62), q.setFromEuler(e.set(0, a + Math.PI / 2, 0)), s.setScalar(1));
      trucks.current!.setMatrixAt(k, m);
    }
    trucks.current!.instanceMatrix.needsUpdate = true;
    for (let k = 0; k < 60; k++) {
      const r1 = L.rand[k]!;
      const r2 = L.rand[k + 60]!;
      const y = ((t * (0.18 + r1 * 0.25) + r2) % 1) * 3.6;
      const a = ZONE.prosperity + (r1 - 0.5) * 1.2;
      const dd = 0.8 + r2 * 2.4;
      m.compose(v.set(Math.sin(a) * dd, 0.5 + y, Math.cos(a) * dd), q.setFromEuler(e.set(t, t * 0.7, 0)), s.setScalar(Math.max(1e-4, rich * (1 - y / 3.6) * 0.055)));
      motes.current!.setMatrixAt(k, m);
    }
    motes.current!.instanceMatrix.needsUpdate = true;

    // composition: island right of the copy (below it on phones); the camera eases in a touch per zone
    const cam = state.camera as THREE.PerspectiveCamera;
    const { width: W, height: H } = state.size;
    const close = p < 0.36 ? 0 : p < 0.69 ? 0.4 : 0.7;
    const back = W < H ? 1.3 : 1; // phones: further back, so the whole island fits the narrow width
    cam.position.lerp(v.set(0, (6.0 - close * 0.4) * back, (12.4 - close * 0.8) * back), 1 - Math.exp(-dt * 2));
    cam.lookAt(0, 0.2, 0);
    // phones: the island sits low, under the copy card
    if (W < H) cam.setViewOffset(W, H, 0, -0.27 * H, W, H);
    else cam.setViewOffset(W, H, -0.2 * W, 0.02 * H, W, H);
  });

  const factoryAt = new THREE.Vector3(Math.sin(ZONE.prosperity - 0.42) * 2.3, 0, Math.cos(ZONE.prosperity - 0.42) * 2.3);

  return (
    <>
      {/* sky dome */}
      <mesh scale={60}>
        <sphereGeometry args={[1, 32, 16]} />
        <shaderMaterial
          ref={sky}
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={skyUniforms}
          vertexShader="varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
          fragmentShader="uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = smoothstep(-0.15, 0.6, vP.y); gl_FragColor = vec4(mix(hor, top, h), 1.0); }"
        />
      </mesh>
      <mesh ref={sunDisc}>
        <sphereGeometry args={[1.3, 24, 16]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      <group ref={group}>
        <mesh geometry={geo.terrain} receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.95} />
        </mesh>
        <mesh geometry={geo.rock}>
          <meshStandardMaterial vertexColors roughness={1} />
        </mesh>
        {/* lake */}
        <mesh position={[LAKE.x, -0.13, LAKE.z]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.78, 48]} />
          <meshStandardMaterial color="#6fc3e6" roughness={0.08} metalness={0.1} transparent opacity={0.92} />
        </mesh>
        {/* ring road */}
        <mesh position={[0, 0.012, 0]} rotation-x={-Math.PI / 2} receiveShadow>
          <ringGeometry args={[3.52, 3.74, 160]} />
          <meshStandardMaterial color="#c9cfd3" roughness={0.9} />
        </mesh>

        {/* solar farm */}
        <instancedMesh ref={panels} args={[undefined, undefined, L.panels.length]} castShadow frustumCulled={false}>
          <boxGeometry args={[0.2, 0.012, 0.12]} />
          <meshStandardMaterial color="#173d7a" metalness={0.5} roughness={0.18} />
        </instancedMesh>
        <instancedMesh ref={posts} args={[undefined, undefined, L.panels.length]} frustumCulled={false}>
          <boxGeometry args={[0.012, 0.12, 0.012]} />
          <meshStandardMaterial color="#9aa7b0" metalness={0.6} roughness={0.4} />
        </instancedMesh>

        {/* forests */}
        <instancedMesh ref={trunks} args={[undefined, undefined, L.trees.length]} castShadow frustumCulled={false}>
          <cylinderGeometry args={[0.012, 0.02, 0.18, 6]} />
          <meshStandardMaterial color="#7a5a3e" roughness={0.9} />
        </instancedMesh>
        <instancedMesh ref={crowns} args={[undefined, undefined, L.trees.length * 2]} castShadow frustumCulled={false}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial roughness={0.75} />
        </instancedMesh>

        {/* village: walls, gable roofs, rooftop solar, windows, street lamps */}
        <instancedMesh ref={houses} args={[ROUND.house, undefined, L.houses.length]} castShadow receiveShadow frustumCulled={false}>
          <meshStandardMaterial roughness={0.85} />
        </instancedMesh>
        <instancedMesh ref={roofs} args={[undefined, undefined, L.houses.length]} castShadow frustumCulled={false}>
          <cylinderGeometry args={[1, 1, 1, 3, 1]} />
          <meshStandardMaterial roughness={0.7} flatShading />
        </instancedMesh>
        <instancedMesh ref={roofPv} args={[undefined, undefined, L.houses.length]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#173d7a" metalness={0.5} roughness={0.2} />
        </instancedMesh>
        <instancedMesh ref={windows} args={[undefined, undefined, L.houses.length]} frustumCulled={false}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
        <instancedMesh ref={lamps} args={[undefined, undefined, 36]} frustumCulled={false}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>

        {/* pylons, cables and the power running through them */}
        {L.pylons.map((pt, i) => (
          <group key={i} position={[pt.x, heightAt(pt.x, pt.z), pt.z]} rotation-y={Math.atan2(pt.x, pt.z)}>
            <lineSegments geometry={geo.pylon}>
              <lineBasicMaterial color="#8d9aa3" />
            </lineSegments>
            <mesh position={[0, 1.02, 0]}>
              <boxGeometry args={[0.3, 0.02, 0.02]} />
              <meshStandardMaterial color="#8d9aa3" />
            </mesh>
          </group>
        ))}
        {cables.map((cv, i) => (
          <mesh key={i}>
            <tubeGeometry args={[cv, 24, 0.004, 4, false]} />
            <meshBasicMaterial color="#6f7d86" />
          </mesh>
        ))}
        <instancedMesh ref={pulses} args={[undefined, undefined, cables.length * 2]} frustumCulled={false}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshBasicMaterial color={[0.4, 3.2, 1.2]} toneMapped={false} />
        </instancedMesh>

        {/* city */}
        <instancedMesh ref={towers} args={[ROUND.tower, undefined, L.city.length]} castShadow receiveShadow frustumCulled={false}>
          <meshStandardMaterial ref={towerMat} color="#eaf3f8" metalness={0.15} roughness={0.15} emissive="#ffffff" emissiveMap={geo.windows} emissiveIntensity={0} />
        </instancedMesh>

        {/* factory with a solar sawtooth roof */}
        <group position={factoryAt} rotation-y={ZONE.prosperity - 0.42}>
          <mesh position={[0, 0.28, 0]} castShadow receiveShadow geometry={ROUND.factory}>
            <meshStandardMaterial ref={factoryMat} color="#f4f7f8" emissive="#0db02b" emissiveIntensity={0.05} roughness={0.6} />
          </mesh>
          {[-0.6, -0.2, 0.2, 0.6].map((x) => (
            <mesh key={x} position={[x, 0.66, 0]} rotation-z={0.5} castShadow>
              <boxGeometry args={[0.46, 0.03, 0.96]} />
              <meshStandardMaterial color="#173d7a" metalness={0.5} roughness={0.2} />
            </mesh>
          ))}
          <mesh position={[0, 0.5, 0.505]}>
            <boxGeometry args={[1.72, 0.06, 0.02]} />
            <meshStandardMaterial color="#0db02b" />
          </mesh>
        </group>
        <instancedMesh ref={trucks} args={[ROUND.truck, undefined, 8]} castShadow frustumCulled={false}>
          <meshStandardMaterial color="#0a9a3a" roughness={0.5} />
        </instancedMesh>
        <instancedMesh ref={motes} args={[undefined, undefined, 60]} frustumCulled={false}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={[3, 2.1, 0.5]} toneMapped={false} />
        </instancedMesh>

        {/* birds */}
        <group ref={birds}>
          {Array.from({ length: 9 }, (_, k) => (
            <group key={k} scale={0.6}>
              <mesh position={[-0.06, 0, 0]}>
                <boxGeometry args={[0.12, 0.006, 0.035]} />
                <meshBasicMaterial color="#38464f" />
              </mesh>
              <mesh position={[0.06, 0, 0]}>
                <boxGeometry args={[0.12, 0.006, 0.035]} />
                <meshBasicMaterial color="#38464f" />
              </mesh>
            </group>
          ))}
        </group>

        {/* smog haze (planet, at first) */}
        <points ref={haze} geometry={hazeGeo}>
          <pointsMaterial color="#a89a84" map={softDot} size={0.45} sizeAttenuation transparent depthWrite={false} />
        </points>
      </group>

      {/* clouds drifting round the island */}
      <group ref={clouds}>
        {Array.from({ length: 7 }, (_, k) => {
          const a = (k / 7) * Math.PI * 2;
          return (
            <group key={k} position={[Math.sin(a) * 6.4, 0.2 + (k % 3) * 0.45, Math.cos(a) * 6.4]} scale={0.6}>
              {[0, 1, 2].map((j) => (
                <mesh key={j} position={[(j - 1) * 0.42, j === 1 ? 0.12 : 0, 0]} scale={j === 1 ? 0.48 : 0.34}>
                  <icosahedronGeometry args={[1, 2]} />
                  <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.92} />
                </mesh>
              ))}
            </group>
          );
        })}
      </group>
    </>
  );
}

/** Reports the first rendered frame, so the canvas fades in instead of flashing black. */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(onReady);
  });
  return null;
}

export default function ImpactIsland() {
  const { wrap, mounted, frameloop, onWarm, dpr: stageDpr } = useStage();
  const [ready, setReady] = useState(false);
  const [dpr, setDpr] = useState(1.5);


  return (
    <div ref={wrap} className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
      {/* mounted only near the viewport: frees its WebGL context when far away (browsers cap live contexts) */}
      {mounted && (
      <Canvas
        resize={NO_SCROLL_MEASURE}
        aria-hidden
        frameloop={frameloop}
        shadows
        dpr={stageDpr(dpr)}
                camera={{ position: [0, 6, 12.4], fov: 34, near: 0.1, far: 200 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <World />
        <FirstFrame onReady={() => setReady(true)} />
        <WarmUp onReady={onWarm} />
      </Canvas>
      )}
    </div>
  );
}
