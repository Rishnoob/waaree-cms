"use client";

import { Line, PerformanceMonitor, useTexture } from "@react-three/drei";
import { Canvas, type RootState, type ThreeEvent, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { FACILITIES } from "../data/facilities";
import { GLOBE_DOTS, GLOBE_INDIA_MASK } from "../data/globe-dots";
import { INDIA_OUTLINE, INDIA_PROJECTION } from "../data/india-map";
import { hero } from "../story-state";
import { BRIDGE_SRC } from "./bridge";
import { latLonToVec3, rotationToFace } from "./geo";
import { NO_SCROLL_MEASURE, useStage, WarmUp } from "./useStage";

const INDIA_FACE = rotationToFace(21.5, 79);
const DIVE_FACE = rotationToFace(20.7, 73.0); // Chikhli, the south Gujarat module belt
const START_FACE = rotationToFace(12, 22); // open on Africa + Asia, India just turning into the light
const HUB = { lat: 20.6, lon: 72.95 }; // south Gujarat manufacturing belt
// The sun rises just clear of the Earth’s upper-left limb (globe-relative, it travels with the Earth).
const SUN_POS = new THREE.Vector3(-1.22, 0.98, -0.35);
const SUN_DIR = SUN_POS.clone().normalize();
// Key light for shading: the sun’s direction pulled toward the viewer so the face stays bright (light page).
const KEY = SUN_DIR.clone().add(new THREE.Vector3(0, 0, 1.4)).normalize();
const SITE_R = 1.02; // just above the clouds
const CLOUD_SPEED = 0.006; // rad/s, relative to the ground
const FOV = 38;
const damp = THREE.MathUtils.damp;

// NASA Blue Marble + elevation (public domain), via three-globe’s examples; see public/earth/README.md.
const TEXTURES = {
  day: "/earth/earth-day.webp",
  water: "/earth/earth-water.webp",
  relief: "/earth/earth-relief.webp",
  clouds: "/earth/earth-clouds.webp",
};

/** Pixels per world unit at distance 1, for size-attenuated glow sprites. */
const pxScale = ({ size, viewport }: RootState) => (size.height * viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));

/** Small seeded PRNG so the sunlight motes are stable between renders. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Soft round light sprites (per-point colour, alpha and size): India’s glow, the sites, arc pulses. */
function glowMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { scale: { value: 1000 } },
    vertexShader: /* glsl */ `
      uniform float scale;
      attribute vec3 tint; attribute float alpha; attribute float size;
      varying vec3 vC; varying float vA;
      void main() {
        vC = tint; vA = alpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * scale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vC; varying float vA;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float a = exp(-r * r * 3.5) * (1.0 - smoothstep(0.85, 1.0, r));
        gl_FragColor = vec4(vC, a * vA);
      }`,
  });
}

type GlowPoints = THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;

function GlowAttributes({ pos, tint, alpha, size }: { pos: Float32Array; tint: Float32Array; alpha: Float32Array; size: Float32Array }) {
  return (
    <bufferGeometry>
      <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      <bufferAttribute attach="attributes-tint" args={[tint, 3]} />
      <bufferAttribute attach="attributes-alpha" args={[alpha, 1]} />
      <bufferAttribute attach="attributes-size" args={[size, 1]} />
    </bufferGeometry>
  );
}

/** Sky-blue halo around the planet, turning peach on the side the sun lights (custom shader). */
function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        uniforms: {
          sky: { value: new THREE.Color("#9fd3f7") },
          gold: { value: new THREE.Color("#ffd2a1") },
          sun: { value: SUN_DIR },
          intro: { value: 0 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal; varying vec3 vPos;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPos = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * vec4(vPos, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 sky; uniform vec3 gold; uniform vec3 sun; uniform float intro;
          varying vec3 vNormal; varying vec3 vPos;
          void main() {
            float rim = pow(clamp(0.72 + dot(vNormal, normalize(-vPos)), 0.0, 1.0), 3.0);
            float sunSide = pow(clamp(dot(normalize(vNormal.xy + 1e-4), normalize(sun.xy)), 0.0, 1.0), 3.0);
            vec3 col = mix(sky, gold, sunSide * 0.85);
            gl_FragColor = vec4(col, rim * (0.6 + sunSide * 0.4) * intro);
          }`,
      }),
    [],
  );
  const mesh = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>>(null!);
  useFrame(() => {
    mesh.current.material.uniforms.intro!.value = hero.intro;
  });
  return (
    <mesh ref={mesh} scale={1.15} material={material}>
      <sphereGeometry args={[1, 64, 64]} />
    </mesh>
  );
}

/**
 * The Earth: Blue Marble colour with real relief (mountain ranges catch the light), cloud shadows
 * on the ground, calm turquoise oceans with a sun glint, sky haze at the limb and a warm edge where
 * the sunlight lands (custom shader).
 */
function Earth() {
  const tex = useTexture(TEXTURES);
  const mesh = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>>(null!);
  const material = useMemo(() => {
    for (const t of [tex.day, tex.water, tex.relief, tex.clouds]) {
      t.anisotropy = 8;
      t.wrapS = THREE.RepeatWrapping;
    }
    return new THREE.ShaderMaterial({
      uniforms: {
        day: { value: tex.day },
        water: { value: tex.water },
        relief: { value: tex.relief },
        clouds: { value: tex.clouds },
        cloudShift: { value: 0 },
        key: { value: KEY },
        sun: { value: SUN_DIR },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; varying vec3 vEast; varying vec3 vNorth;
        void main() {
          vUv = uv;
          vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), normal) + vec3(1e-5, 0.0, 0.0));
          vec3 north = cross(normal, east);
          mat3 m = mat3(modelMatrix);
          vNormal = normalize(m * normal);
          vEast = normalize(m * east);
          vNorth = normalize(m * north);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D day; uniform sampler2D water; uniform sampler2D relief; uniform sampler2D clouds;
        uniform float cloudShift; uniform vec3 key; uniform vec3 sun;
        varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; varying vec3 vEast; varying vec3 vNorth;
        void main() {
          // Relief: tilt the normal along the elevation gradient so ranges are shaded in 3D.
          vec2 px = vec2(1.0 / 2048.0, 1.0 / 1024.0);
          float h = texture2D(relief, vUv).r;
          float hx = texture2D(relief, vUv + vec2(px.x, 0.0)).r - h;
          float hy = texture2D(relief, vUv + vec2(0.0, px.y)).r - h;
          vec3 n = normalize(vNormal - (vEast * hx + vNorth * hy) * 14.0);

          vec3 col = texture2D(day, vUv).rgb;
          float sea = texture2D(water, vUv).r;
          // Grade: deep, calm marine blue oceans; lush forest greens; warm sand deserts.
          vec3 ocean = mix(vec3(0.07, 0.26, 0.44), vec3(0.14, 0.42, 0.62), smoothstep(0.05, 0.35, col.b - col.r));
          col = mix(col, ocean, sea * 0.55);
          float veg = smoothstep(0.015, 0.07, col.g - max(col.r, col.b) * 0.97) * (1.0 - sea);
          col = mix(col, col * vec3(0.8, 1.1, 0.66) + vec3(0.0, 0.02, 0.0), veg * 0.7);
          float sand = smoothstep(0.35, 0.6, col.r) * (1.0 - veg) * (1.0 - sea);
          col = mix(col, col * vec3(1.06, 0.98, 0.84), sand * 0.6);

          float diff = max(dot(n, key), 0.0);
          col *= 0.6 + 0.75 * diff;
          // clouds cast soft shadows a touch away from the sun
          float shadow = texture2D(clouds, vUv + vec2(-cloudShift + 0.003, -0.003)).r;
          col *= 1.0 - shadow * 0.28;

          float l = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(vec3(l), col, 1.25);

          vec3 hv = normalize(key + vView);
          col += vec3(1.0, 0.95, 0.88) * pow(max(dot(normalize(vNormal), hv), 0.0), 45.0) * sea * 0.45;
          float rim = pow(1.0 - clamp(dot(normalize(vNormal), vView), 0.0, 1.0), 2.0);
          float sunSide = pow(clamp(dot(normalize(vNormal.xy + 1e-4), normalize(sun.xy)), 0.0, 1.0), 2.0);
          col = mix(col, vec3(0.74, 0.88, 1.0), rim * 0.65 * (1.0 - sunSide));
          col = mix(col, vec3(1.0, 0.89, 0.76), rim * sunSide * 0.8);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
  }, [tex]);
  useFrame(({ clock }) => {
    mesh.current.material.uniforms.cloudShift!.value = (clock.elapsedTime * CLOUD_SPEED) / (Math.PI * 2);
  });
  return (
    <mesh ref={mesh} material={material}>
      <sphereGeometry args={[1, 160, 160]} />
    </mesh>
  );
}

/** Clouds drifting slowly over the ground, softly lit by the sun. */
function Clouds() {
  const ref = useRef<THREE.Mesh>(null!);
  const tex = useTexture(TEXTURES.clouds);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { clouds: { value: tex }, key: { value: KEY } },
        vertexShader: /* glsl */ `
          varying vec2 vUv; varying vec3 vNormal;
          void main() {
            vUv = uv;
            vNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform sampler2D clouds; uniform vec3 key;
          varying vec2 vUv; varying vec3 vNormal;
          void main() {
            float a = texture2D(clouds, vUv).r;
            float shade = 0.84 + 0.16 * max(dot(normalize(vNormal), key), 0.0);
            gl_FragColor = vec4(vec3(shade, shade, shade * 1.01), a * 0.85);
          }`,
      }),
    [tex],
  );
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * CLOUD_SPEED;
  });
  return (
    <mesh ref={ref} scale={1.01} material={material}>
      <sphereGeometry args={[1, 128, 128]} />
    </mesh>
  );
}

// India as one luminous wash in the Waaree gradient; it brightens as the Earth turns to India.
const INDIA = (() => {
  const pts: { lat: number; lon: number }[] = [];
  for (let i = 0; i < GLOBE_INDIA_MASK.length; i++) {
    if (GLOBE_INDIA_MASK[i] === "1") pts.push({ lat: GLOBE_DOTS[i * 2]!, lon: GLOBE_DOTS[i * 2 + 1]! });
  }
  const n = pts.length;
  const pos = new Float32Array(n * 3);
  const tint = new Float32Array(n * 3);
  const green = new THREE.Color("#7fe0ab");
  const blue = new THREE.Color("#8fd8ef");
  const c = new THREE.Color();
  const v = new THREE.Vector3();
  pts.forEach((p, i) => {
    latLonToVec3(p.lat, p.lon, 1.014, v).toArray(pos, i * 3);
    c.copy(green).lerp(blue, (p.lon - 68) / 30).toArray(tint, i * 3);
  });
  return { pts, pos, tint, alpha: new Float32Array(n), size: new Float32Array(n).fill(0.034) };
})();

function IndiaGlow() {
  const ref = useRef<GlowPoints>(null!);
  const material = useMemo(() => glowMaterial(), []);
  const strength = useRef(0);
  useFrame((state, dt) => {
    strength.current = damp(strength.current, (0.06 + THREE.MathUtils.smoothstep(hero.progress, 0.35, 0.8) * 0.06) * hero.intro, 4, dt);
    ref.current.material.uniforms.scale!.value = pxScale(state);
    const alpha = ref.current.geometry.attributes.alpha!;
    const a = alpha.array as Float32Array;
    const t = state.clock.elapsedTime;
    INDIA.pts.forEach((p, i) => {
      // a slow shimmer washing across the country, west to east
      a[i] = strength.current * (0.75 + 0.25 * Math.sin(t * 1.1 - p.lon * 0.35 + p.lat * 0.1));
    });
    alpha.needsUpdate = true;
  });
  return (
    <points ref={ref} material={material}>
      <GlowAttributes pos={INDIA.pos} tint={INDIA.tint} alpha={INDIA.alpha} size={INDIA.size} />
    </points>
  );
}


// India’s official outline traced on the globe: a thin, soothing green line inside a wide, very
// faint glow line. Both are even-width lines, so nothing piles up where the outline is detailed.
const BORDER_GREEN = "#7fe0ab";
const INDIA_BORDER = (() => {
  const pr = INDIA_PROJECTION;
  const loops: THREE.Vector3[][] = [];
  for (const sub of INDIA_OUTLINE.split("M").filter(Boolean)) {
    const nums = sub.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    const loop: THREE.Vector3[] = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const lon = nums[i]! / (pr.kx * pr.scale) + pr.minLon;
      const lat = pr.maxLat - nums[i + 1]! / pr.scale;
      loop.push(latLonToVec3(lat, lon, 1.017));
    }
    // the mainland and larger islands only; specks read as dots, not borders
    if (loop.length > 24) loops.push([...loop, loop[0]!]);
  }
  return loops;
})();

function IndiaBorder() {
  const glow = useRef<THREE.Group>(null!);
  const core = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const on = hero.intro * (0.75 + THREE.MathUtils.smoothstep(hero.progress, 0.35, 0.8) * 0.25);
    const breathe = 0.85 + 0.15 * Math.sin(clock.elapsedTime * 1.2);
    for (const c of glow.current.children) ((c as THREE.Mesh).material as THREE.Material).opacity = 0.16 * on * breathe;
    for (const c of core.current.children) ((c as THREE.Mesh).material as THREE.Material).opacity = 0.95 * on;
  });
  return (
    <>
      <group ref={glow}>
        {INDIA_BORDER.map((loop, i) => (
          <Line key={i} points={loop} color={BORDER_GREEN} lineWidth={7} transparent opacity={0} depthWrite={false} toneMapped={false} />
        ))}
      </group>
      <group ref={core}>
        {INDIA_BORDER.map((loop, i) => (
          <Line key={i} points={loop} color={BORDER_GREEN} lineWidth={1.6} transparent opacity={0} depthWrite={false} toneMapped={false} />
        ))}
      </group>
    </>
  );
}

// Every Waaree site as a breathing light: a soft halo around a bright core.
const SITES = (() => {
  const n = FACILITIES.length;
  const pos = new Float32Array(n * 2 * 3);
  const tint = new Float32Array(n * 2 * 3);
  const c = new THREE.Color();
  const white = new THREE.Color("#ffffff");
  const v = new THREE.Vector3();
  FACILITIES.forEach((f, i) => {
    latLonToVec3(f.lat, f.lon, SITE_R, v);
    c.set(f.kind === "development" ? "#ffbf73" : f.kind === "office" ? "#7fd0ff" : "#5fe89a");
    v.toArray(pos, i * 2 * 3);
    v.toArray(pos, (i * 2 + 1) * 3);
    c.toArray(tint, i * 2 * 3);
    c.lerp(white, 0.55).toArray(tint, (i * 2 + 1) * 3);
  });
  return { n, pos, tint, alpha: new Float32Array(n * 2), size: new Float32Array(n * 2) };
})();

function Sites() {
  const ref = useRef<GlowPoints>(null!);
  const material = useMemo(() => glowMaterial(), []);
  useFrame((state) => {
    ref.current.material.uniforms.scale!.value = pxScale(state);
    const { alpha, size } = ref.current.geometry.attributes;
    const a = alpha!.array as Float32Array;
    const s = size!.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < SITES.n; i++) {
      const breath = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 0.9);
      s[i * 2] = 0.075 + 0.03 * breath; // halo
      const on = THREE.MathUtils.smoothstep(hero.intro, 0.55, 1);
      a[i * 2] = (0.45 + 0.2 * breath) * on;
      s[i * 2 + 1] = 0.022; // core
      a[i * 2 + 1] = on;
    }
    alpha!.needsUpdate = true;
    size!.needsUpdate = true;
  });
  return (
    <points ref={ref} material={material}>
      <GlowAttributes pos={SITES.pos} tint={SITES.tint} alpha={SITES.alpha} size={SITES.size} />
    </points>
  );
}

// Arcs from India’s manufacturing belt to Waaree’s sites abroad; light glides along each one.
const ARC_START = latLonToVec3(HUB.lat, HUB.lon, SITE_R);
const ARCS = FACILITIES.filter((f) => f.country !== "India").map((f) => {
  const end = latLonToVec3(f.lat, f.lon, SITE_R);
  const mid = ARC_START.clone().add(end).multiplyScalar(0.5);
  mid.normalize().multiplyScalar(1 + ARC_START.distanceTo(end) * 0.42);
  return new THREE.QuadraticBezierCurve3(ARC_START, mid, end);
});
const PULSES_PER_ARC = 3;
const PULSE = (() => {
  const n = ARCS.length * PULSES_PER_ARC;
  const tint = new Float32Array(n * 3);
  const c = new THREE.Color("#f2fff8");
  for (let i = 0; i < n; i++) c.toArray(tint, i * 3);
  return { n, pos: new Float32Array(n * 3), tint, alpha: new Float32Array(n), size: new Float32Array(n).fill(0.05) };
})();
const scratch = new THREE.Vector3();
// Each arc fades from Waaree green at India to sky blue at the destination.
const ARC_LINES = (() => {
  const from = new THREE.Color("#19d27a");
  const to = new THREE.Color("#2ab4f2");
  return ARCS.map((curve) => {
    const points = curve.getPoints(64);
    const colors = points.map((_, i) => from.clone().lerp(to, i / (points.length - 1)).toArray() as [number, number, number]);
    return { points, colors };
  });
})();

function Arcs() {
  const ref = useRef<GlowPoints>(null!);
  const material = useMemo(() => glowMaterial(), []);

  useFrame((state) => {
    ref.current.material.uniforms.scale!.value = pxScale(state);
    const { position, alpha } = ref.current.geometry.attributes;
    const p = position!.array as Float32Array;
    const a = alpha!.array as Float32Array;
    const t = state.clock.elapsedTime * 0.22;
    ARCS.forEach((curve, i) => {
      for (let k = 0; k < PULSES_PER_ARC; k++) {
        const j = i * PULSES_PER_ARC + k;
        const u = (t + k / PULSES_PER_ARC + i * 0.17) % 1;
        curve.getPoint(u, scratch).toArray(p, j * 3);
        a[j] = Math.sin(Math.PI * u) * 0.95;
      }
    });
    position!.needsUpdate = true;
    alpha!.needsUpdate = true;
  });
  return (
    <>
      {ARC_LINES.map((arc, i) => (
        <Line key={i} points={arc.points} vertexColors={arc.colors} lineWidth={2} transparent opacity={0.9} depthWrite={false} toneMapped={false} />
      ))}
      <points ref={ref} material={material} frustumCulled={false}>
        <GlowAttributes pos={PULSE.pos} tint={PULSE.tint} alpha={PULSE.alpha} size={PULSE.size} />
      </points>
    </>
  );
}

/** The sun on the Earth’s edge: a cream core, a peach bloom and a few soft, slowly turning beams. */
function Sun({ overlay = false }: { overlay?: boolean }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: !overlay,
        uniforms: { time: { value: 0 }, intro: { value: 0 }, overlay: { value: overlay ? 1 : 0 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float time; uniform float intro; uniform float overlay;
          varying vec2 vUv;
          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float r = length(p);
            float a = atan(p.y, p.x);
            float breathe = 1.0 + 0.04 * sin(time * 0.7);
            float core = smoothstep(0.1 * breathe, 0.075 * breathe, r);
            float bloom = exp(-r * 6.0) * 0.95 + exp(-r * 2.4) * 0.5 + exp(-r * 1.1) * 0.18;
            // a soft halo ring, like light through a lens
            float ring = exp(-pow((r - 0.34) * 11.0, 2.0)) * 0.1;
            float beams = pow(0.5 + 0.5 * sin(a * 6.0 + time * 0.05), 5.0) * 0.55
                        + pow(0.5 + 0.5 * sin(a * 4.0 - time * 0.035 + 1.3), 7.0) * 0.45
                        + pow(0.5 + 0.5 * sin(a * 11.0 + time * 0.02 + 0.4), 14.0) * 0.3;
            beams *= exp(-r * 2.0) * smoothstep(0.08, 0.22, r);
            float fade = smoothstep(1.0, 0.45, r);
            vec3 peach = vec3(1.0, 0.8, 0.62);
            vec3 col = mix(peach, vec3(1.0, 0.985, 0.95), clamp(core + exp(-r * 11.0), 0.0, 1.0));
            float alpha = overlay > 0.5 ? beams * 0.3 * fade : clamp(core + bloom + ring + beams * 0.7, 0.0, 1.0) * fade;
            gl_FragColor = vec4(col, alpha * smoothstep(0.0, 0.7, intro));
          }`,
      }),
    [overlay],
  );
  const mesh = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>(null!);
  useFrame(({ clock }) => {
    mesh.current.material.uniforms.time!.value = clock.elapsedTime;
    mesh.current.material.uniforms.intro!.value = hero.intro;
  });
  return (
    <mesh ref={mesh} position={SUN_POS} material={material} renderOrder={overlay ? 10 : 0}>
      <planeGeometry args={[3, 3]} />
    </mesh>
  );
}

// Motes of sunlight drifting from the sun onto the side of the Earth it lights.
const MOTES = (() => {
  const rand = rng(7);
  const list = Array.from({ length: 48 }, () => {
    const end = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    if (end.dot(SUN_DIR) < 0) end.negate();
    end.lerp(SUN_DIR, 0.35).normalize().multiplyScalar(1.02);
    const start = SUN_POS.clone().add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.2));
    return { start, end, phase: rand(), speed: 0.12 + rand() * 0.14 };
  });
  const n = list.length;
  const tint = new Float32Array(n * 3);
  const c = new THREE.Color("#ffe2c2");
  for (let i = 0; i < n; i++) c.toArray(tint, i * 3);
  return { list, pos: new Float32Array(n * 3), tint, alpha: new Float32Array(n), size: new Float32Array(n).fill(0.035) };
})();

function SunMotes() {
  const ref = useRef<GlowPoints>(null!);
  const material = useMemo(() => glowMaterial(), []);
  useFrame((state) => {
    ref.current.material.uniforms.scale!.value = pxScale(state);
    const { position, alpha } = ref.current.geometry.attributes;
    const p = position!.array as Float32Array;
    const a = alpha!.array as Float32Array;
    const t = state.clock.elapsedTime;
    MOTES.list.forEach((m, i) => {
      const u = (t * m.speed + m.phase) % 1;
      scratch.lerpVectors(m.start, m.end, u).toArray(p, i * 3);
      a[i] = Math.sin(Math.PI * u) ** 0.8 * 0.8 * hero.intro;
    });
    position!.needsUpdate = true;
    alpha!.needsUpdate = true;
  });
  return (
    <points ref={ref} material={material} frustumCulled={false}>
      <GlowAttributes pos={MOTES.pos} tint={MOTES.tint} alpha={MOTES.alpha} size={MOTES.size} />
    </points>
  );
}

/* ── What Waaree makes, where it makes it ────────────────────────────────────
 * Real places only (data/facilities.ts, waaree.com): module arrays at the module factories, inverter
 * cabinets at Sarodhi, silicon ingots at Nagpur (under construction), and the 49.5 MWp EPC project
 * in Vietnam. Icons are drawn larger than life so they read on a planet; hover cards use the exact
 * site coordinates.
 */
type Install = {
  slug?: string;
  lat?: number;
  lon?: number;
  cols?: number;
  rows?: number;
  hardware?: "inverter" | "ingot";
  shift?: [number, number];
};
const INSTALLS: Install[] = [
  { slug: "nandigram", cols: 3, rows: 1, shift: [0.05, -0.05] }, // south Gujarat module belt (Chikhli · Nandigram · Tumb)
  { slug: "samakhiali", cols: 2, rows: 1, shift: [0.9, 0] },
  { slug: "indosolar", cols: 2, rows: 1 },
  { slug: "texas", cols: 3, rows: 2 },
  { slug: "sarodhi", hardware: "inverter", shift: [-0.4, 4.2] },
  { slug: "nagpur", hardware: "ingot" },
  // Waaree’s first international EPC project: 49.5 MWp in Vietnam (waaree.com, 2018–19)
  { lat: 12.2, lon: 108.6, cols: 3, rows: 1 },
  // Modules supplied to 24+ countries (waaree.com). The exact list isn’t published, so these arrays
  // stand for that reach across sunny markets; swap in Waaree’s own list when they share it.
  { lat: 22.4, lon: 114.1, cols: 2 }, // Hong Kong
  { lat: 35.3, lon: -119.5, cols: 2 }, // California
  { lat: 49.6, lon: -97.5, cols: 2 }, // Canada
  { lat: -23.5, lon: -69, cols: 3, rows: 2 }, // Chile
  { lat: -9, lon: -42, cols: 2, rows: 2 }, // Brazil
  { lat: 38.5, lon: -4, cols: 3, rows: 2 }, // Spain
  { lat: 41.8, lon: 13.5, cols: 2 }, // Italy
  { lat: 51.2, lon: 10.5, cols: 2 }, // Germany
  { lat: 52.3, lon: 19.5, cols: 2 }, // Poland
  { lat: 31, lon: -6.8, cols: 3, rows: 2 }, // Morocco
  { lat: 24.5, lon: 32.8, cols: 2, rows: 2 }, // Egypt
  { lat: 1, lon: 37.5, cols: 2 }, // Kenya
  { lat: -29, lon: 21, cols: 3, rows: 2 }, // South Africa
  { lat: 24, lon: 46, cols: 3, rows: 2 }, // Saudi Arabia
  { lat: 24.2, lon: 54.6, cols: 2, rows: 2 }, // UAE
  { lat: 23.8, lon: 90.4, cols: 2 }, // Bangladesh
  { lat: 7.8, lon: 80.7, cols: 2 }, // Sri Lanka
  { lat: 36.2, lon: 138.3, cols: 2 }, // Japan
  { lat: -25, lon: 133, cols: 3, rows: 2 }, // Australia
];
const MODULE = { w: 0.034, h: 0.054, d: 0.0026, gap: 0.004 };
const CABINET = { w: 0.013, d: 0.01, h: 0.02 };
const INGOT = { r: 0.0062, h: 0.034 };

const INSTALL_LAYOUT = (() => {
  const modules: THREE.Matrix4[] = [];
  const inverters: THREE.Matrix4[] = [];
  const ingots: THREE.Matrix4[] = [];
  const up = new THREE.Vector3();
  const east = new THREE.Vector3();
  const north = new THREE.Vector3();
  const face = new THREE.Vector3();
  const tiltedNorth = new THREE.Vector3();
  const centre = new THREE.Vector3();
  const at = (v: THREE.Vector3, x: THREE.Vector3, y: THREE.Vector3, z: THREE.Vector3) =>
    new THREE.Matrix4().makeBasis(x, y, z).setPosition(v);

  for (const s of INSTALLS) {
    const f = s.slug ? FACILITIES.find((x) => x.slug === s.slug) : undefined;
    const baseLat = f?.lat ?? s.lat;
    const baseLon = f?.lon ?? s.lon;
    if (baseLat === undefined || baseLon === undefined) continue;
    const lat = baseLat + (s.shift?.[0] ?? 0);
    const lon = baseLon + (s.shift?.[1] ?? 0);
    latLonToVec3(lat, lon, 1, up);
    east.set(0, 1, 0).cross(up).normalize();
    north.copy(up).cross(east).normalize();

    if (s.hardware === "inverter") {
      for (const k of [-1, 0, 1]) {
        const p = up.clone().multiplyScalar(1.006 + CABINET.h / 2).addScaledVector(east, k * (CABINET.w + 0.004));
        inverters.push(at(p, east, north, up));
      }
      continue;
    }
    if (s.hardware === "ingot") {
      const side = new THREE.Vector3().crossVectors(east, up);
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1.6]] as const) {
        const p = up
          .clone()
          .multiplyScalar(1.006 + INGOT.h / 2)
          .addScaledVector(east, dx * INGOT.r * 1.4)
          .addScaledVector(north, dy * INGOT.r * 1.4);
        ingots.push(at(p, east, up, side)); // cylinder axis (y) stands on the ground
      }
      continue;
    }

    // Real-world detail: fixed-tilt arrays face the equator, tilted by about their latitude.
    const tilt = THREE.MathUtils.degToRad(Math.min(Math.abs(lat), 30) + 8);
    face.copy(up).multiplyScalar(Math.cos(tilt)).addScaledVector(north, -Math.sign(lat || 1) * Math.sin(tilt)).normalize();
    tiltedNorth.copy(face).cross(east).normalize();
    centre.copy(up).multiplyScalar(1.013);
    const cols = s.cols ?? 2;
    const rows = s.rows ?? 1;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const p = centre
          .clone()
          .addScaledVector(east, (c - (cols - 1) / 2) * (MODULE.w + MODULE.gap))
          .addScaledVector(tiltedNorth, (r - (rows - 1) / 2) * (MODULE.h + MODULE.gap));
        modules.push(at(p, east, tiltedNorth, face));
      }
    }
  }
  return { modules, inverters, ingots };
})();

// Every installation unfolds during the intro (staggered by its random phase).
const INSTANCED_VERT = /* glsl */ `
  uniform float intro;
  attribute float phase;
  varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; varying vec3 vLocal; varying vec3 vObjN; varying float vPhase;
  void main() {
    vUv = uv; vLocal = position; vObjN = normal; vPhase = phase;
    float d = clamp(intro * 1.8 - phase * 0.8, 0.0, 1.0);
    d = d * d * (3.0 - 2.0 * d);
    mat4 m = modelMatrix * instanceMatrix;
    vNormal = normalize(mat3(m) * normal);
    vec4 mv = viewMatrix * m * vec4(position * d, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

/** A PV module: navy cells, white frame and backsheet, sun glint and a slow light sweep. */
function moduleMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { key: { value: KEY }, time: { value: 0 }, intro: { value: 0 } },
    vertexShader: INSTANCED_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 key; uniform float time;
      varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; varying vec3 vLocal; varying vec3 vObjN; varying float vPhase;
      void main() {
        vec3 n = normalize(vNormal);
        float diff = max(dot(n, key), 0.0);
        vec3 white = vec3(0.95, 0.965, 0.975) * (0.78 + 0.28 * diff);
        if (vObjN.z < 0.5) {
          // aluminium edges and the white backsheet
          gl_FragColor = vec4(white, 1.0);
          return;
        }
        vec2 g = fract(vUv * vec2(4.0, 6.0));
        float cell = smoothstep(0.0, 0.09, g.x) * smoothstep(1.0, 0.91, g.x) * smoothstep(0.0, 0.06, g.y) * smoothstep(1.0, 0.94, g.y);
        float frame = 1.0 - step(0.06, vUv.x) * step(vUv.x, 0.94) * step(0.04, vUv.y) * step(vUv.y, 0.96);
        vec3 navy = mix(vec3(0.07, 0.15, 0.36), vec3(0.15, 0.3, 0.6), vUv.y * 0.5 + diff * 0.5);
        vec3 col = mix(white * 0.9, navy * (0.8 + 0.4 * diff), cell);
        col = mix(col, white, frame);
        float spec = pow(max(dot(n, normalize(key + vView)), 0.0), 40.0);
        col += vec3(0.85, 0.92, 1.0) * spec * 0.5 * cell;
        float sweep = 1.0 - smoothstep(0.0, 0.14, abs(vUv.x * 0.5 + vUv.y * 0.5 - (fract(time * 0.12 + vPhase) * 2.2 - 0.6)));
        col += vec3(0.9, 0.96, 1.0) * sweep * 0.35 * cell;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

/** Inverter cabinets (soft white, green top band, dark vents) and silicon ingots (silver, amber band: rising). */
function hardwareMaterial(kind: "inverter" | "ingot") {
  return new THREE.ShaderMaterial({
    uniforms: { key: { value: KEY }, intro: { value: 0 }, ingot: { value: kind === "ingot" ? 1 : 0 } },
    vertexShader: INSTANCED_VERT,
    fragmentShader: /* glsl */ `
      uniform vec3 key; uniform float ingot;
      varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; varying vec3 vLocal; varying vec3 vObjN; varying float vPhase;
      void main() {
        vec3 n = normalize(vNormal);
        float diff = max(dot(n, key), 0.0);
        float spec = pow(max(dot(n, normalize(key + vView)), 0.0), ingot > 0.5 ? 60.0 : 30.0);
        vec3 col;
        if (ingot > 0.5) {
          vec3 silver = mix(vec3(0.62, 0.66, 0.72), vec3(0.93, 0.95, 0.97), diff);
          float band = 1.0 - smoothstep(0.0015, 0.0025, abs(vLocal.y - ${(INGOT.h * 0.25).toFixed(4)}));
          col = mix(silver, vec3(1.0, 0.72, 0.36), band) + vec3(1.0) * spec * 0.6;
        } else {
          vec3 body = vec3(0.95, 0.96, 0.96) * (0.72 + 0.38 * diff);
          float top = step(${(CABINET.h / 2 - 0.004).toFixed(4)}, vLocal.z);
          float vents = step(0.5, fract(vLocal.z * 900.0)) * step(abs(vLocal.z), 0.004) * step(0.5, abs(vObjN.y));
          col = mix(body, vec3(0.2, 0.74, 0.42), top);
          col = mix(col, body * 0.6, vents) + vec3(1.0) * spec * 0.25;
        }
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
}

function Instances({ matrices, material, children }: { matrices: THREE.Matrix4[]; material: THREE.ShaderMaterial; children: React.ReactNode }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const phases = useMemo(() => {
    const rand = rng(matrices.length + 3);
    return new Float32Array(matrices.map(() => rand()));
  }, [matrices]);
  useLayoutEffect(() => {
    matrices.forEach((m, i) => ref.current.setMatrixAt(i, m));
    ref.current.instanceMatrix.needsUpdate = true;
  }, [matrices]);
  return (
    <instancedMesh ref={ref} args={[undefined, material, matrices.length]} frustumCulled={false}>
      {children}
      <instancedBufferAttribute attach="geometry-attributes-phase" args={[phases, 1]} />
    </instancedMesh>
  );
}

function Installations() {
  const modules = useMemo(() => moduleMaterial(), []);
  const inverter = useMemo(() => hardwareMaterial("inverter"), []);
  const ingot = useMemo(() => hardwareMaterial("ingot"), []);
  const group = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    for (const child of group.current.children) {
      const u = (child as THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>).material.uniforms;
      u.intro!.value = hero.intro;
      if (u.time) u.time.value = clock.elapsedTime;
    }
  });
  return (
    <group ref={group}>
      <Instances matrices={INSTALL_LAYOUT.modules} material={modules}>
        <boxGeometry args={[MODULE.w, MODULE.h, MODULE.d]} />
      </Instances>
      <Instances matrices={INSTALL_LAYOUT.inverters} material={inverter}>
        <boxGeometry args={[CABINET.w, CABINET.d, CABINET.h]} />
      </Instances>
      <Instances matrices={INSTALL_LAYOUT.ingots} material={ingot}>
        <cylinderGeometry args={[INGOT.r, INGOT.r, INGOT.h, 20]} />
      </Instances>
    </group>
  );
}

/**
 * Invisible hit targets on every site. Hovering one (only on the side facing you) reports it to the
 * hero, which shows a small card and opens the site’s page on click.
 */
const facing = new THREE.Vector3();
const toCamera = new THREE.Vector3();
function SiteTargets({ onSite }: { onSite?: (slug: string | null, x?: number, y?: number) => void }) {
  if (!onSite) return null;
  const report = (e: ThreeEvent<PointerEvent>, slug: string) => {
    e.object.getWorldPosition(facing);
    toCamera.copy(e.camera.position).sub(facing).normalize();
    if (facing.normalize().dot(toCamera) < 0.25) return onSite(null);
    e.stopPropagation();
    onSite(slug, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };
  return (
    <>
      {FACILITIES.map((f) => (
        <mesh
          key={f.slug}
          position={latLonToVec3(f.lat, f.lon, SITE_R)}
          onPointerOver={(e) => report(e, f.slug)}
          onPointerMove={(e) => report(e, f.slug)}
          onPointerOut={() => onSite(null)}
        >
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      ))}
    </>
  );
}

/** The dive’s module wears the very panel “Inside the panel” opens on (a render of it from above). */
function diveModuleTexture() {
  const t = new THREE.TextureLoader().load(BRIDGE_SRC);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const DIVE_AT = latLonToVec3(20.7, 73.0, 1).normalize();
const DIVE_BASIS = (() => {
  const y = DIVE_AT.clone();
  const x = new THREE.Vector3(0, 1, 0).cross(y).normalize(); // east: the module’s long side runs across the screen
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
})();

/**
 * The hand-off to “Inside the panel”: as we dive, one module lifts out of Waaree’s south Gujarat
 * array and rises toward us, ending framed the way the next chapter opens.
 */
function DiveModule() {
  const ref = useRef<THREE.Group>(null);
  const tex = useMemo(() => diveModuleTexture(), []);
  useFrame(() => {
    const k = THREE.MathUtils.smoothstep(hero.dive, 0.3, 1);
    const g = ref.current!;
    g.visible = k > 0.001;
    g.position.copy(DIVE_AT).multiplyScalar(1.004 + k * 0.07);
    g.scale.setScalar(0.012 + k * 0.034);
  });
  return (
    <group ref={ref} quaternion={DIVE_BASIS} visible={false}>
      <mesh>
        <boxGeometry args={[1, 0.02, 0.5]} />
        <meshBasicMaterial map={tex} />
      </mesh>
    </group>
  );
}

function Globe({ onSite, onReady }: SceneProps) {
  const rig = useRef<THREE.Group>(null!);
  const group = useRef<THREE.Group>(null!);
  const spin = useRef(START_FACE.ry);
  const offset = useRef({ x: 1.42, y: -0.06 });
  // camera + size come from the frame state (mutating them there is the R3F way)

  useEffect(() => onReady?.(), [onReady]); // textures are in: the hero can start the intro

  useFrame(({ camera, size }, dt) => {
    const g = group.current;
    const p = hero.progress;
    const intro = hero.intro;
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Idle: a slow turn + visitor drag with inertia. Scroll: ease to face India.
    if (!hero.dragging) hero.spinVelocity *= 0.95;
    spin.current += hero.spinVelocity + (reduced || p > 0.02 ? 0 : dt * 0.04);
    const t = THREE.MathUtils.smoothstep(p, 0.05, 0.75);
    // shortest path from the current spin to India’s facing angle
    const wrapped = INDIA_FACE.ry + Math.round((spin.current - INDIA_FACE.ry) / (Math.PI * 2)) * Math.PI * 2;
    // the intro arrives with a little extra turn that settles
    const ry = THREE.MathUtils.lerp(spin.current, wrapped, t) - (1 - intro) * 0.7;
    // the dive: turn the module belt to us (shortest way round) and fall toward it
    const d = THREE.MathUtils.smoothstep(hero.dive, 0, 1);
    const diveRy = DIVE_FACE.ry + Math.round((wrapped - DIVE_FACE.ry) / (Math.PI * 2)) * Math.PI * 2;
    const rx = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.32, INDIA_FACE.rx, t), DIVE_FACE.rx, d);
    g.rotation.y = damp(g.rotation.y, THREE.MathUtils.lerp(ry, diveRy, d), 6, dt);
    g.rotation.x = damp(g.rotation.x, rx, 6, dt);
    if (t > 0.98) spin.current = wrapped; // settle so scrolling back up resumes smoothly
    rig.current.scale.setScalar(0.9 + 0.1 * intro);

    // Composition: a large Earth cropped by the right edge, then it turns India to us beside the story.
    // The Earth stays on the camera axis and the *frame* shifts (off-axis view offset), so it is
    // always perfectly round; moving it sideways in a perspective view stretches it on wide screens.
    // Wide screens: the Earth grows and moves toward the middle so the space is used.
    const narrow = size.width < 768;
    const aspect = size.width / size.height;
    const wide = THREE.MathUtils.clamp((aspect - 1.6) / 0.6, 0, 1);
    // squarer screens: shrink the Earth and keep it right of the copy so text is never covered
    const mid = THREE.MathUtils.clamp((1.6 - aspect) / 0.6, 0, 1);
    const camZ0 = narrow ? THREE.MathUtils.lerp(5.0, 3.7, t) : THREE.MathUtils.lerp(3.85 - 0.35 * wide + 0.7 * mid, 2.8 - 0.15 * wide + 1.1 * mid, t);
    const camZ = THREE.MathUtils.lerp(camZ0, 1.16, d * d);
    const halfW = camZ * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * aspect;
    // where the Earth's centre sits, as a share of the width (start → India)
    const cx = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.835, 0.72, wide) + 0.04 * mid, THREE.MathUtils.lerp(0.74, 0.7, wide) + 0.1 * mid, t);
    const x = narrow ? THREE.MathUtils.lerp(0.35, 0, t) : (cx - 0.5) * 2 * halfW;
    const y = narrow ? THREE.MathUtils.lerp(-1.15, 0.3, t) : THREE.MathUtils.lerp(-0.06, 0, t);
    const o = offset.current;
    o.x = damp(o.x, x * (1 - d), 5, dt);
    o.y = damp(o.y, y * (1 - d), 5, dt);
    camera.position.z = damp(camera.position.z, camZ, 5, dt);
    const pxPerUnit = size.height / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * camera.position.z);
    const cam = camera as THREE.PerspectiveCamera;
    cam.setViewOffset(size.width, size.height, -o.x * pxPerUnit, o.y * pxPerUnit, size.width, size.height);
  });

  return (
    <group ref={rig} scale={0.9}>
      <Sun />
      <Atmosphere />
      <group ref={group} rotation={[0.32, START_FACE.ry - 0.7, 0]}>
        <Earth />
        <Clouds />
        <Installations />
        <DiveModule />
        <IndiaGlow />
        <IndiaBorder />
        <Arcs />
        <Sites />
        <SiteTargets onSite={onSite} />
      </group>
      <SunMotes />
      <Sun overlay />
    </group>
  );
}

type SceneProps = {
  /** Hovered site (slug + position in the canvas), or null. */
  onSite?: (slug: string | null, x?: number, y?: number) => void;
  /** Called once the Earth’s textures have loaded. */
  onReady?: () => void;
};

/**
 * The hero’s 3D Earth and its sun. Transparent canvas over the light sky; loaded only in the
 * browser. It stops rendering while off-screen and lowers its resolution on slower devices.
 */
export default function GlobeScene(props: SceneProps) {
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
                camera={{ position: [0, 0, 3.85], fov: FOV, near: 0.004, far: 50 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <Suspense fallback={null}>
          <Globe {...props} />
        </Suspense>
        <WarmUp onReady={onWarm} />
      </Canvas>
      )}
    </div>
  );
}
