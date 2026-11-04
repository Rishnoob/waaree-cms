import { ScrollTrigger } from "gsap/ScrollTrigger";

/*
 * Seamless chapter hand-offs (globe → Inside the panel → Factories). The next chapter overlaps the
 * last screen of the one before (HANDOFF_SECTION) and stays invisible until its stage pins, the very
 * moment the chapter before reaches its last frame. Both frames show the same panel in the same
 * place (see three/bridge.ts), so the swap is a cut nobody can see, with no scroll in between.
 */

/** Classes for a section that slides under the last screen of the chapter before. */
export const HANDOFF_SECTION = "relative z-[1] -mt-[100svh] pointer-events-none";
/** Anchor links land where the stage pins, not a screen early. */
export const HANDOFF_STYLE = { scrollMarginTop: "-100svh" } as const;
/**
 * Classes for the stage: transparent and untouchable until pinned. (Opacity, not visibility: a
 * hidden stage would have to be painted from scratch at the cut, a visible stall mid-scroll.)
 */
export const HANDOFF_STAGE = "opacity-0 data-[live]:opacity-100 [&:not([data-live])_*]:pointer-events-none! data-[live]:pointer-events-auto";

/** Show `stage` from the moment `trigger` pins (and hide it again above). Call inside useGSAP. */
export function showWhenPinned(trigger: Element, stage: Element) {
  const set = (s: ScrollTrigger) => stage.toggleAttribute("data-live", s.scroll() >= s.start);
  return ScrollTrigger.create({ trigger, start: "top top", end: "bottom top", onToggle: set, onRefresh: set });
}
