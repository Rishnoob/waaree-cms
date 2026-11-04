"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";

/*
 * Setting a scene up (building it, compiling its shaders) blocks the page for a moment, so it must
 * never happen mid-scroll. Every scene on the page is set up in order, one at a time, starting
 * shortly after the page loads (while the hero is on screen), and then kept alive: by the time a
 * visitor scrolls to a chapter, its scene is already compiled and waiting.
 */
let busy: symbol | null = null;
let ready = false; // true ~1 s after the page has loaded
let armed = false;
const queue: { id: symbol; run: () => void }[] = [];

function pump() {
  if (busy || !ready) return;
  const job = queue.shift();
  if (!job) return;
  busy = job.id;
  job.run();
  setTimeout(() => release(job.id), 3000); // safety: never let one scene hold up the rest
}

function release(id: symbol) {
  if (busy !== id) return;
  busy = null;
  setTimeout(pump, 80); // a breath between scenes
}

function schedule(id: symbol, run: () => void) {
  queue.push({ id, run });
  if (!armed) {
    armed = true;
    // start right after the page appears (not after every image has loaded): the next chapter’s
    // scene must be ready before a visitor who scrolls straight down reaches it
    setTimeout(() => {
      ready = true;
      pump();
    }, 500);
  }
  pump();
  return () => {
    const i = queue.findIndex((j) => j.id === id);
    if (i >= 0) queue.splice(i, 1);
    release(id);
  };
}

/**
 * When a 3D scene exists and when it renders, so scrolling never waits for one:
 * - `mounted`: set up in page order after load (or at once if it is about to be seen), then kept;
 * - `frameloop`: nothing renders until its shaders are compiled; every frame while visible,
 *   idle otherwise (no GPU work off-screen).
 */
export function useStage() {
  const wrap = useRef<HTMLDivElement>(null);
  const [id] = useState(() => Symbol("stage"));
  const [mounted, setMounted] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [near, setNear] = useState(false);
  const [warm, setWarm] = useState(false);
  const isWarm = useRef(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const cancel = schedule(id, () => {      setMounted(true);
      // already set up (it was needed early, e.g. the hero): don’t hold the queue
      if (isWarm.current) release(id);
    });
    const urgent = new IntersectionObserver(([e]) => e?.isIntersecting && setMounted(true), { rootMargin: "60% 0px" });
    const vis = new IntersectionObserver(([e]) => setOnScreen(!!e?.isIntersecting), { rootMargin: "20% 0px" });
    // full resolution from a screen away; far off, the drawing buffers shrink to almost nothing so
    // ten live scenes don’t exhaust GPU memory (shaders stay compiled, so coming back is instant)
    const nearby = new IntersectionObserver(([e]) => setNear(!!e?.isIntersecting), { rootMargin: "120% 0px" });
    for (const io of [urgent, vis, nearby]) io.observe(el);
    return () => {
      cancel();
      for (const io of [urgent, vis, nearby]) io.disconnect();
    };
  }, [id]);

  /** Nothing renders until the shaders are compiled (not even the first frame); then idle off-screen. */
  const frameloop: "always" | "demand" | "never" = !warm ? "never" : onScreen ? "always" : "demand";
  const onWarm = () => {    isWarm.current = true;
    setWarm(true);
    // its first frame is the costly one (post-processing, environment maps): let it render before the next scene starts
    requestAnimationFrame(() => requestAnimationFrame(() => release(id)));
  };
  /** Pixel ratio for the Canvas: full (capped at 1.5× the device’s) when near, a sliver when far. */
  const dpr = (wanted: number) => (near ? Math.min(wanted, 1.5, typeof window === "undefined" ? 1 : window.devicePixelRatio || 1) : 0.15);
  return { wrap, mounted, onScreen, frameloop, onWarm, dpr };
}

/**
 * Put last inside a Canvas: once the scene is built, compile its shaders off the main thread
 * (KHR_parallel_shader_compile where available) and draw a couple of frames while still off-screen,
 * so textures and render targets are on the GPU before the visitor arrives.
 */
export function WarmUp({ onReady }: { onReady: () => void }) {
  const get = useThree((s) => s.get);
  useEffect(() => {
    let cancelled = false;
    const { gl, scene, camera, invalidate } = get();
    // the shader-error check reads each program’s log, which forces the GPU to finish compiling
    // on the main thread (a long freeze per new material); a broken shader still shows as a missing object
    gl.debug.checkShaderErrors = false;
    // compile everything, including parts that start hidden (blueprint pieces, milestone models,
    // carriers…): three only compiles visible objects, so show them all for the compile
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    const done = gl.compileAsync(scene, camera);
    hidden.forEach((o) => (o.visible = false));
    done
      .catch(() => {})
      .then(() => {
        if (cancelled) return;
        onReady();
        requestAnimationFrame(() => !cancelled && invalidate());
      });
    return () => {
      cancelled = true;
    };
  }, [get]); // eslint-disable-line react-hooks/exhaustive-deps -- onReady is a fresh closure each render; run once
  return null;
}

/**
 * Pass as every Canvas’s `resize`. By default a Canvas measures itself on scroll, debounced: while
 * the page keeps scrolling it never settles, so a scene set up mid-scroll waited seconds to start
 * (and then started late, mid-chapter). Our canvases live in sticky stages, so scroll never moves
 * them; size changes still come through the ResizeObserver.
 */
export const NO_SCROLL_MEASURE = { scroll: false } as const;

/** Write a style only when it changes (per-frame DOM writes force the page to re-layout on scroll). */
export function setStyle(el: HTMLElement, prop: "transform" | "opacity", value: string) {
  if (el.style[prop] !== value) el.style[prop] = value;
}
