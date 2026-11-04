"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { CARE, careAt, GROVES, PLANT, SCHOOL, STUDENTS } from "../data/community";
import { community } from "../story-state";
import { NO_SCROLL_MEASURE, setStyle, useStage, WarmUp } from "./useStage";

/*
 * Giving back: one instanced sapling for every one of the 7,500 Waaree planted in FY26, in two
 * groves (Vadodara 2,500, Ahmedabad 5,000), planted from the heart of each grove outward as you
 * scroll. Then a school, and one point of light for each of the 2,000+ students it serves, filling
 * the yard in rows. Planting and arrival run in the vertex shaders (the CPU sets one uniform);
 * DOM labels ([data-label]) are pinned over each grove and the school.
 */

let reducedCache: boolean | null = null;
const reducedMotion = () => (reducedCache ??= window.matchMedia("(prefers-reduced-motion: reduce)").matches);

const PITCH = 0.042; // spacing between saplings
const GROVE_AT = { vadodara: new THREE.Vector3(-2.2, 0, 0.75), ahmedabad: new THREE.Vector3(1.55, 0, 0.55) } as const;
const SCHOOL_AT = new THREE.Vector3(-0.35, 0, -2.0);

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A sapling: trunk and two tiers of leaves, one geometry with its colours baked in. */
function saplingGeometry() {
  const paint = (g: THREE.BufferGeometry, hex: string) => {
    const c = new THREE.Color(hex);
    const n = g.attributes.position!.count;
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(Array.from({ length: n * 3 }, (_, i) => [c.r, c.g, c.b][i % 3]!)), 3));
    return g;
  };
  return mergeGeometries([
    paint(new THREE.CylinderGeometry(0.006, 0.009, 0.05, 5).translate(0, 0.025, 0), "#7a5a3c"),
    paint(new THREE.ConeGeometry(0.034, 0.08, 6).translate(0, 0.08, 0), "#1f9d48"),
    paint(new THREE.ConeGeometry(0.024, 0.06, 6).translate(0, 0.125, 0), "#34b85a"),
  ])!;
}

/** Grow `count` cells of a grid outward from the centre, with a ragged, natural edge. */
function grove(count: number, seed: number) {
  const r = rng(seed);
  const cells: { x: number; z: number; d: number }[] = [];
  const R = Math.ceil(Math.sqrt(count / Math.PI) * 1.5);
  for (let i = -R * 1.6; i <= R * 1.6; i++)
    for (let j = -R; j <= R; j++) {
      const x = i * PITCH;
      const z = j * PITCH;
      const a = Math.atan2(j, i / 1.6);
      // a wide, irregular ellipse: rows of a plantation, edges like a real grove
      const d = Math.hypot(i / 1.6, j) * (1 + 0.12 * Math.sin(a * 3 + seed) + 0.06 * Math.sin(a * 7)) + r() * 0.6;
      cells.push({ x: x + (r() - 0.5) * PITCH * 0.35, z: z + (r() - 0.5) * PITCH * 0.35, d });
    }
  cells.sort((a, b) => a.d - b.d);
  return cells.slice(0, count);
}

/** A standard material whose instances grow in when the scroll passes their planting time (aPlant). */
function plantedMaterial(uniform: { value: number }) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });
  m.onBeforeCompile = (s) => {
    s.uniforms.uP = uniform;
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float aPlant;\nuniform float uP;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nfloat grown = smoothstep(aPlant, aPlant + 0.035, uP);\ntransformed *= grown * (1.0 + 0.25 * sin(grown * 3.14159));");
  };
  return m;
}

function Groves({ uP }: { uP: { value: number } }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const total = GROVES[0].trees + GROVES[1].trees;
  const { geometry, material } = useMemo(() => {
    const g = saplingGeometry();
    const plant = new Float32Array(total);
    let k = 0;
    for (const gr of GROVES) {
      const [a, b] = PLANT[gr.key];
      for (let i = 0; i < gr.trees; i++) plant[k++] = a + (b - a - 0.035) * (i / gr.trees);
    }
    g.setAttribute("aPlant", new THREE.InstancedBufferAttribute(plant, 1));
    return { geometry: g, material: plantedMaterial(uP) };
  }, [total, uP]);

  useEffect(() => {
    const r = rng(7);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    const c = new THREE.Color();
    let k = 0;
    GROVES.forEach((gr, gi) => {
      const at = GROVE_AT[gr.key];
      for (const cell of grove(gr.trees, gi * 11 + 3)) {
        q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, r() * Math.PI * 2);
        s.setScalar(0.45 + r() * 0.3);
        m.compose(new THREE.Vector3(at.x + cell.x, 0, at.z + cell.z), q, s);
        mesh.current!.setMatrixAt(k, m);
        mesh.current!.setColorAt(k, c.setRGB(0.8 + r() * 0.3, 0.85 + r() * 0.25, 0.8 + r() * 0.2)); // no two quite alike
        k++;
      }
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.instanceColor!.needsUpdate = true;
  }, []);

  return <instancedMesh ref={mesh} args={[geometry, material, total]} frustumCulled={false} />;
}

/** The school’s sign: Waaree’s education programme, on a white board with a green band. */
function signTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 205;
  const g = c.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 1024, 205);
  const band = g.createLinearGradient(0, 0, 1024, 0);
  band.addColorStop(0, "#0db02b");
  band.addColorStop(1, "#28a9e2");
  g.fillStyle = band;
  g.fillRect(0, 160, 1024, 45);
  g.fillStyle = "#0a7a2a";
  g.font = "600 92px Poppins, Arial, sans-serif";
  g.textAlign = "center";
  g.fillText("WAAREE SHIKSHA", 512, 112);
  g.fillStyle = "#ffffff";
  g.font = "500 30px Poppins, Arial, sans-serif";
  g.fillText("A SCHOOL SUPPORTED BY THE WAAREE FOUNDATION", 512, 194);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** The school: a glass block, an emerald roof, its windows lit as the students arrive. */
function School({ uP }: { uP: { value: number } }) {
  const windows = useMemo(() => new THREE.MeshStandardMaterial({ color: "#bfe6ff", emissive: "#ffd27a", emissiveIntensity: 0.15 }), []);
  const lit = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const k = THREE.MathUtils.smoothstep(uP.value, SCHOOL[0], SCHOOL[1]);
    (lit.current!.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.15 + k * 1.2; // shared by every window
  });
  const body = useMemo(() => new RoundedBoxGeometry(1.5, 0.42, 0.5, 2, 0.04), []);
  const sign = useMemo(() => signTexture(), []);
  return (
    <group position={SCHOOL_AT}>
      <mesh geometry={body} position={[0, 0.21, 0]}>
        <meshStandardMaterial color="#f4fbf7" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <boxGeometry args={[1.6, 0.06, 0.6]} />
        <meshStandardMaterial color="#19c46a" emissive="#0a9a3a" emissiveIntensity={0.25} />
      </mesh>
      {/* a gable over the door, a flagpole */}
      <mesh position={[0, 0.56, 0.12]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.3, 0.2, 4]} />
        <meshStandardMaterial color="#19c46a" emissive="#0a9a3a" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0.95, 0.4, 0.2]}>
        <cylinderGeometry args={[0.008, 0.008, 0.8, 6]} />
        <meshStandardMaterial color="#c8d3da" />
      </mesh>
      <mesh position={[1.02, 0.74, 0.2]}>
        <boxGeometry args={[0.14, 0.09, 0.005]} />
        <meshStandardMaterial color="#ff9b2f" />
      </mesh>
      {/* the school’s sign, on the roof */}
      <group position={[0, 0.5, 0.18]}>
        {[-0.42, 0.42].map((x) => (
          <mesh key={x} position={[x, 0.07, 0]}>
            <boxGeometry args={[0.015, 0.14, 0.015]} />
            <meshStandardMaterial color="#c8d3da" />
          </mesh>
        ))}
        <mesh position={[0, 0.15, 0.01]}>
          <planeGeometry args={[1.0, 0.2]} />
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
      </group>
      {/* the door */}
      <mesh position={[0, 0.09, 0.253]}>
        <boxGeometry args={[0.14, 0.18, 0.004]} />
        <meshStandardMaterial color="#1b4688" />
      </mesh>
      {/* two rows of windows */}
      {[0.14, 0.3].flatMap((y) =>
        Array.from({ length: 8 }, (_, i) => (
          <mesh key={`${y}-${i}`} ref={i === 0 && y === 0.14 ? lit : undefined} position={[-0.62 + i * 0.177, y, 0.252]} material={windows}>
            <boxGeometry args={[0.1, 0.08, 0.004]} />
          </mesh>
        )),
      )}
    </group>
  );
}

const PLAY_AT = new THREE.Vector3(-2.4, 0, -1.9);
const SHIRTS = ["#28a9e2", "#0db02b", "#f0a020", "#e5483a", "#8b7cf6", "#ffffff"].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
const SKIN = ["#8d5a3b", "#a8714a", "#6e4630"].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
const KID = { body: new THREE.CapsuleGeometry(0.016, 0.03, 3, 8), head: new THREE.SphereGeometry(0.014, 12, 8) };

/** A child: a shirt and a head (their own colours), standing on y = 0. */
function Kid({ i, refFn }: { i: number; refFn?: (g: THREE.Group | null) => void }) {
  return (
    <group ref={refFn}>
      <mesh geometry={KID.body} material={SHIRTS[i % SHIRTS.length]} position={[0, 0.035, 0]} />
      <mesh geometry={KID.head} material={SKIN[i % SKIN.length]} position={[0, 0.082, 0]} />
    </group>
  );
}

/**
 * Break time beside the school: a football game (eight children chase the ball), a ring of six
 * playing in a circle, and two on the swings. They come out as the school fills.
 */
function Playground({ uP }: { uP: { value: number } }) {
  const root = useRef<THREE.Group>(null);
  const ball = useRef<THREE.Mesh>(null);
  const kids = useRef<(THREE.Group | null)[]>([]);
  const swings = useRef<(THREE.Group | null)[]>([]);
  const players = useRef(Array.from({ length: 8 }, (_, i) => new THREE.Vector3((i % 4) * 0.1 - 0.15, 0, i < 4 ? -0.08 : 0.08)));
  const pitchEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.68, 0.38)), []);
  useFrame((state, dt) => {
    const t = reducedMotion() ? 0 : state.clock.elapsedTime;
    const out = THREE.MathUtils.smoothstep(uP.value, SCHOOL[0] + 0.04, SCHOOL[0] + 0.14);
    root.current!.visible = out > 0.01;
    root.current!.scale.setScalar(Math.max(0.001, out));
    // the ball wanders the pitch; the players chase it, each keeping a little space
    const bx = Math.sin(t * 0.7) * 0.26 + Math.sin(t * 1.9) * 0.06;
    const bz = Math.sin(t * 1.1 + 1) * 0.14;
    ball.current!.position.set(bx, 0.012 + Math.abs(Math.sin(t * 6)) * 0.02, bz);
    players.current.forEach((p, i) => {
      const k = kids.current[i];
      if (!k) return;
      const tx = bx + Math.cos(i * 0.8) * (0.05 + (i % 3) * 0.04);
      const tz = bz + Math.sin(i * 1.3) * (0.05 + (i % 2) * 0.05);
      const dx = tx - p.x;
      const dz = tz - p.z;
      const speed = Math.min(1, dt * (1.2 + (i % 3) * 0.4));
      p.x += dx * speed;
      p.z += dz * speed;
      k.position.set(p.x, Math.abs(Math.sin(t * 9 + i)) * 0.012, p.z);
      k.rotation.y = Math.atan2(dx, dz);
    });
    // the ring turns, the children skipping
    for (let i = 0; i < 6; i++) {
      const k = kids.current[8 + i];
      if (!k) continue;
      const a = t * 0.8 + (i / 6) * Math.PI * 2;
      k.position.set(0.62 + Math.cos(a) * 0.09, Math.abs(Math.sin(t * 6 + i)) * 0.008, 0.02 + Math.sin(a) * 0.09);
      k.rotation.y = -a;
    }
    // the swings
    swings.current.forEach((g, i) => {
      if (g) g.rotation.x = Math.sin(t * 2.2 + i * 1.7) * 0.55;
    });
  });
  return (
    <group position={PLAY_AT} scale={1.6}>
      <group ref={root} visible={false}>
        {/* the pitch */}
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
          <planeGeometry args={[0.74, 0.44]} />
          <meshStandardMaterial color="#7fcf7f" />
        </mesh>
        <lineSegments geometry={pitchEdges} position={[0, 0.004, 0]} rotation-x={-Math.PI / 2}>
          <lineBasicMaterial color="#ffffff" />
        </lineSegments>
        {[-0.34, 0.34].map((x) => (
          <mesh key={x} position={[x, 0.025, 0]}>
            <boxGeometry args={[0.012, 0.05, 0.12]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        ))}
        <mesh ref={ball}>
          <sphereGeometry args={[0.012, 12, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
        </mesh>
        {Array.from({ length: 14 }, (_, i) => (
          <Kid
            key={i}
            i={i}
            refFn={(g) => {
              kids.current[i] = g;
            }}
          />
        ))}
        {/* the swings */}
        <group position={[0.62, 0, -0.26]}>
          {[-0.12, 0.12].map((x) => (
            <mesh key={x} position={[x, 0.09, 0]} rotation-z={x > 0 ? -0.15 : 0.15}>
              <cylinderGeometry args={[0.005, 0.005, 0.19, 6]} />
              <meshStandardMaterial color="#f0a020" />
            </mesh>
          ))}
          <mesh position={[0, 0.18, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.005, 0.005, 0.26, 6]} />
            <meshStandardMaterial color="#f0a020" />
          </mesh>
          {[-0.05, 0.05].map((x, i) => (
            <group
              key={x}
              position={[x, 0.18, 0]}
              ref={(g) => {
                swings.current[i] = g;
              }}
            >
              <mesh position={[0, -0.06, 0]}>
                <boxGeometry args={[0.002, 0.12, 0.002]} />
                <meshBasicMaterial color="#9aa7b0" />
              </mesh>
              <group position={[0, -0.16, 0]}>
                <Kid i={i + 3} />
              </group>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}

/** One point of light per student, filling the school yard row by row. */
function Students({ uP }: { uP: { value: number } }) {
  const { geometry, material } = useMemo(() => {
    const r = rng(2000);
    const pos = new Float32Array(STUDENTS * 3);
    const arrive = new Float32Array(STUDENTS);
    const cols = 80;
    for (let i = 0; i < STUDENTS; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      pos.set([SCHOOL_AT.x - 1.1 + col * 0.028 + (r() - 0.5) * 0.006, 0.02, SCHOOL_AT.z + 0.4 + row * 0.028 + (r() - 0.5) * 0.006], i * 3);
      arrive[i] = SCHOOL[0] + (SCHOOL[1] - SCHOOL[0] - 0.04) * (i / STUDENTS);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aArrive", new THREE.BufferAttribute(arrive, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uP, uScale: { value: 600 } },
      vertexShader: /* glsl */ `
        uniform float uP, uScale; attribute float aArrive; varying float vA;
        void main() {
          float k = smoothstep(aArrive, aArrive + 0.04, uP);
          vec3 p = position + vec3(0.0, (1.0 - k) * 0.6, 0.0);    // each one drops in, like a light switched on
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = step(0.001, k) * 0.036 * uScale / -mv.z;
          vA = k;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float r = length(gl_PointCoord - 0.5) * 2.0;
          if (r > 1.0) discard;
          gl_FragColor = vec4(mix(vec3(0.98, 0.62, 0.05), vec3(1.0, 0.86, 0.45), 1.0 - r), smoothstep(1.0, 0.5, r) * vA);
        }`,
    });
    return { geometry: g, material: m };
  }, [uP]);
  const pts = useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null);
  useFrame(({ size, viewport }) => {
    pts.current!.material.uniforms.uScale!.value = (size.height * viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(19)));
  });
  return <points ref={pts} geometry={geometry} material={material} frustumCulled={false} />;
}

const M = {
  white: new THREE.MeshStandardMaterial({ color: "#f6faf8", roughness: 0.4 }),
  red: new THREE.MeshStandardMaterial({ color: "#e5483a", emissive: "#b8261a", emissiveIntensity: 0.25 }),
  sky: new THREE.MeshStandardMaterial({ color: "#28a9e2", emissive: "#1782b8", emissiveIntensity: 0.2, roughness: 0.3 }),
  steel: new THREE.MeshStandardMaterial({ color: "#a9b8c2", metalness: 0.4, roughness: 0.4 }),
  orange: new THREE.MeshStandardMaterial({ color: "#f39a2b", roughness: 0.5 }),
  green: new THREE.MeshStandardMaterial({ color: "#19c46a", emissive: "#0a9a3a", emissiveIntensity: 0.25 }),
  dark: new THREE.MeshStandardMaterial({ color: "#2d3a44", roughness: 0.6 }),
  warm: new THREE.MeshStandardMaterial({ color: "#ffe2a8", emissive: "#ffc861", emissiveIntensity: 0.6 }),
};
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const G = {
  clinic: box(0.5, 0.22, 0.3),
  crossV: box(0.03, 0.09, 0.006),
  crossH: box(0.09, 0.03, 0.006),
  van: box(0.16, 0.08, 0.08),
  stripe: box(0.162, 0.014, 0.082),
  wheel: new THREE.CylinderGeometry(0.018, 0.018, 0.09, 10),
  tank: new THREE.CylinderGeometry(0.11, 0.11, 0.16, 20),
  leg: new THREE.CylinderGeometry(0.006, 0.006, 0.36, 6),
  pipe: new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6),
  truck: box(0.24, 0.1, 0.11),
  cab: box(0.08, 0.08, 0.11),
  hatch: box(0.12, 0.04, 0.005),
  home: box(0.3, 0.56, 0.26),
  win: box(0.04, 0.035, 0.004),
  roof: new THREE.ConeGeometry(0.24, 0.12, 4),
};

/** The foundation’s care around the school: a clinic, clean water, a food truck, a home for boys. Each rises in its turn. */
function Care({ uP }: { uP: { value: number } }) {
  const items = useRef<(THREE.Group | null)[]>([]);
  const queue = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = reducedMotion() ? 0 : state.clock.elapsedTime;
    CARE.forEach((c, i) => {
      const g = items.current[i];
      if (!g) return;
      const k = careAt(uP.value, c.at);
      g.visible = k > 0.01;
      g.scale.set(1, Math.max(0.001, k), 1);
    });
    queue.current?.children.forEach((kid, i) => (kid.position.y = Math.abs(Math.sin(t * 2 + i)) * 0.004));
  });
  return (
    <>
      {/* clinic + ambulance */}
      <group ref={(g) => {
          items.current[0] = g;
        }} position={CARE_AT.clinic} visible={false}>
        <mesh geometry={G.clinic} material={M.white} position={[0, 0.11, 0]} />
        <mesh geometry={G.crossV} material={M.red} position={[0, 0.15, 0.153]} />
        <mesh geometry={G.crossH} material={M.red} position={[0, 0.15, 0.153]} />
        <mesh geometry={box(0.1, 0.14, 0.005)} material={M.sky} position={[-0.15, 0.07, 0.153]} />
        <group position={[0.36, 0, 0.12]}>
          <mesh geometry={G.van} material={M.white} position={[0, 0.06, 0]} />
          <mesh geometry={G.stripe} material={M.red} position={[0, 0.05, 0]} />
          {[-0.05, 0.05].map((x) => (
            <mesh key={x} geometry={G.wheel} material={M.dark} position={[x, 0.018, 0]} rotation-x={Math.PI / 2} />
          ))}
        </group>
      </group>
      {/* clean water: a tank on its tower, a pipe down to a tap */}
      <group ref={(g) => {
          items.current[1] = g;
        }} position={CARE_AT.water} visible={false}>
        {[[-0.07, -0.07], [0.07, -0.07], [-0.07, 0.07], [0.07, 0.07]].map(([x, z]) => (
          <mesh key={`${x}${z}`} geometry={G.leg} material={M.steel} position={[x!, 0.18, z!]} />
        ))}
        <mesh geometry={G.tank} material={M.sky} position={[0, 0.44, 0]} />
        <mesh geometry={G.pipe} material={M.steel} position={[0.12, 0.26, 0]} />
        <mesh geometry={box(0.12, 0.05, 0.08)} material={M.white} position={[0.16, 0.025, 0.02]} />
      </group>
      {/* food truck, and the queue */}
      <group ref={(g) => {
          items.current[2] = g;
        }} position={CARE_AT.food} visible={false}>
        <mesh geometry={G.truck} material={M.orange} position={[0, 0.07, 0]} />
        <mesh geometry={G.cab} material={M.white} position={[0.16, 0.06, 0]} />
        <mesh geometry={G.hatch} material={M.warm} position={[-0.02, 0.09, 0.056]} />
        {[-0.08, 0.06, 0.16].map((x) => (
          <mesh key={x} geometry={G.wheel} material={M.dark} position={[x, 0.018, 0]} rotation-x={Math.PI / 2} />
        ))}
        <group ref={queue} position={[0, 0, 0.16]}>
          {[-0.12, -0.06, 0, 0.06, 0.12].map((x, i) => (
            <group key={x} position={[x, 0, 0]} scale={1.35}>
              <Kid i={i + 1} />
            </group>
          ))}
        </group>
      </group>
      {/* a home for boys: four storeys, warm windows */}
      <group ref={(g) => {
          items.current[3] = g;
        }} position={CARE_AT.home} visible={false}>
        <mesh geometry={G.home} material={M.white} position={[0, 0.28, 0]} />
        <mesh geometry={G.roof} material={M.green} position={[0, 0.62, 0]} rotation-y={Math.PI / 4} />
        {[0.09, 0.21, 0.33, 0.45].flatMap((y) =>
          [-0.08, 0, 0.08].map((x) => <mesh key={`${x}${y}`} geometry={G.win} material={M.warm} position={[x, y, 0.132]} />),
        )}
      </group>
    </>
  );
}

/** Camera keys over scroll: [progress, position, look-at]. Low over Vadodara → both groves → the school → the care around it → everything. */
const KEYS: [number, THREE.Vector3Tuple, THREE.Vector3Tuple][] = [
  [0.0, [-2.3, 1.5, 3.4], [-2.2, 0.0, 0.6]],
  [0.22, [-1.1, 3.0, 5.6], [-0.8, 0.0, 0.3]],
  [0.5, [-0.2, 4.4, 7.2], [-0.1, 0.0, -0.1]],
  [0.64, [-0.4, 2.0, 1.2], [-0.4, 0.15, -1.7]],
  [0.84, [1.6, 2.1, 1.3], [1.9, 0.1, -1.5]],
  [1.0, [0.6, 4.8, 7.0], [0.3, 0.0, -0.8]],
];
const ease = (x: number) => x * x * (3 - 2 * x);
const CAM = { pos: new THREE.Vector3(), look: new THREE.Vector3(), v: new THREE.Vector3() };
/** The scroll progress, shared by every shader in the scene (one scene per page). */
const uP = { value: 0 };
const CARE_AT: Record<(typeof CARE)[number]["key"], THREE.Vector3> = {
  clinic: new THREE.Vector3(1.05, 0, -2.05),
  water: new THREE.Vector3(1.95, 0, -2.2),
  food: new THREE.Vector3(1.25, 0, -1.25),
  home: new THREE.Vector3(2.4, 0, -1.6),
};
const LABEL_AT = [
  GROVE_AT.vadodara.clone().setY(0.4),
  GROVE_AT.ahmedabad.clone().setY(0.4),
  SCHOOL_AT.clone().setY(1.0),
  ...CARE.map((c) => CARE_AT[c.key].clone().setY(c.key === "home" ? 0.75 : c.key === "water" ? 0.62 : 0.42)),
];

function Scene({ labels }: { labels: React.RefObject<HTMLDivElement | null> }) {
  // soft green earth that melts into the page at its edges
  const ground = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: "varying vec2 vUv; void main(){ float r = length((vUv - 0.5) * vec2(2.0, 2.0)); gl_FragColor = vec4(0.84, 0.93, 0.86, (1.0 - smoothstep(0.45, 1.0, r)) * 0.9); }",
      }),
    [],
  );
  const els = useRef<HTMLElement[] | null>(null);
  useFrame((state, dt) => {
    const p = community.progress;
    uP.value = p;
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1]![0]) i++;
    const [p0, a, la] = KEYS[i]!;
    const [p1, b, lb] = KEYS[i + 1]!;
    const t = ease(Math.min(1, Math.max(0, (p - p0) / (p1 - p0))));
    CAM.pos.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
    CAM.look.set(la[0] + (lb[0] - la[0]) * t, la[1] + (lb[1] - la[1]) * t, la[2] + (lb[2] - la[2]) * t);
    const cam = state.camera as THREE.PerspectiveCamera;
    const { width: w, height: h } = state.size;
    if (w < h) CAM.pos.sub(CAM.look).multiplyScalar(1.7).add(CAM.look); // phones: step back
    cam.position.lerp(CAM.pos, 1 - Math.exp(-6 * dt));
    cam.lookAt(CAM.look);
    // the scene sits right of the copy (below it on phones)
    if (w < h) cam.setViewOffset(w, h, 0, -0.18 * h, w, h);
    else cam.setViewOffset(w, h, -0.18 * w, 0, w, h);

    const root = labels.current;
    if (!root) return;
    els.current ??= Array.from(root.querySelectorAll<HTMLElement>("[data-label]"));
    const shows = [Math.min(1, (p - PLANT.vadodara[0]) / 0.04), Math.min(1, (p - PLANT.ahmedabad[0]) / 0.04), Math.min(1, (p - SCHOOL[0]) / 0.04), ...CARE.map((c) => careAt(p, c.at))];
    els.current.forEach((el, k) => {
      CAM.v.copy(LABEL_AT[k]!).project(cam);
      setStyle(el, "opacity", Math.max(0, shows[k]!).toFixed(3));
      setStyle(el, "transform", `translate(${(((CAM.v.x + 1) / 2) * w).toFixed(1)}px, ${(((1 - CAM.v.y) / 2) * h).toFixed(1)}px)`);
    });
  });
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, -0.4]} material={ground} renderOrder={-1}>
        <planeGeometry args={[13, 9]} />
      </mesh>
      <Groves uP={uP} />
      <School uP={uP} />
      <Students uP={uP} />
      <Playground uP={uP} />
      <Care uP={uP} />
    </>
  );
}

export default function CommunityForest({ labels }: { labels: React.RefObject<HTMLDivElement | null> }) {
  const { wrap, mounted, frameloop, onWarm, dpr: stageDpr } = useStage();
  const [dpr, setDpr] = useState(1.5);

  return (
    <div ref={wrap} className="absolute inset-0">
      {mounted && (
        <Canvas
          resize={NO_SCROLL_MEASURE}
          aria-hidden
          frameloop={frameloop}
          dpr={stageDpr(dpr)}
          camera={{ position: [-2.6, 1.3, 3.0], fov: 38, near: 0.05, far: 60 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          style={{ position: "absolute", inset: 0 }}
        >
          <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
          <hemisphereLight args={["#ffffff", "#cfe8d6", 1.9]} />
          <directionalLight position={[3, 6, 4]} intensity={1.5} />
          <Scene labels={labels} />
          <WarmUp onReady={onWarm} />
        </Canvas>
      )}
    </div>
  );
}
