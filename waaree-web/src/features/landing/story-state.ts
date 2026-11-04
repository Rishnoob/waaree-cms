/**
 * Shared, mutable hero state (plain object: GSAP / pointer handlers write it, the 3D scene reads it
 * every frame, with no React re-renders at 60 fps).
 */
export const hero = {
  /** Scroll progress through the hero: 0 = whole Earth, 1 = turned to India and moved in. */
  progress: 0,
  /** Drag velocity added by the visitor (radians per frame), decays with inertia. */
  spinVelocity: 0,
  /** True while the visitor is dragging the globe. */
  dragging: false,
  /** Intro choreography, 0 → 1 once the Earth has loaded (sun, atmosphere, installations, sites). */
  intro: 0,
  /** The dive at the end of the hero, 0 → 1: the Earth turns to south Gujarat and we fall through the clouds. */
  dive: 0,
};

/**
 * Inside the panel: scroll progress 0 → 1 (rest → explode → dive into a cell → light up), plus pointer tilt.
 * `out` 0 → 1 over the last stretch, with no scrub lag: the camera settles exactly on the hand-off frame.
 */
export const anatomy = { progress: 0, px: 0, py: 0, out: 0 };

/** Factories: the opening zoom-out, 0 = one panel tile filling the screen → 1 = all of India. */
export const factories = { intro: 0 };

/** Our story (legacy): scroll progress 0 → 1 along the timeline, 1985 → today. */
export const legacy = { progress: 0 };

/** Impact at every level: scroll progress 0 → 1 through planet, people and prosperity. */
export const impact = { progress: 0 };

/** Giving back: scroll progress 0 → 1 (the groves are planted, then the school fills). */
export const community = { progress: 0 };

/**
 * How it’s made: scroll progress 0 → 1 through the ten stages, plus drag spin. `in` 1 → 0 over
 * the first stretch and `out` 0 → 1 over the last, with no scrub lag: the camera leaves from and
 * settles on the hand-off frame (from Inside the panel, to the India map).
 */
export const journey = { progress: 0, spin: 0, dragging: false, in: 1, out: 0 };

/** Growth: scroll progress 0 → 1 (FY22 → FY26 revenue, then profit lights up), plus drag spin. */
export const growth = { progress: 0, spin: 0, dragging: false };
