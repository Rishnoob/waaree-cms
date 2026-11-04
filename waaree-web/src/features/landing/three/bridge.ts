/*
 * The panel hand-off frame. One module, seen from straight above, centred, filling this much of the
 * screen. The Earth's dive ends on it, “Inside the panel” starts and ends on it, and the India map
 * starts on it (that module is one of its tiles). Every scene that meets this frame sizes its camera
 * from `bridgeWidth`, and the DOM image (BRIDGE_SRC, a render of the 3D module from above) uses
 * BRIDGE_BOX, so the cuts between chapters can't be seen.
 */

/** Width of the module on a W × H screen, px (it is 2:1). Keep in step with BRIDGE_BOX. */
export const bridgeWidth = (W: number, H: number) => Math.min(1.3 * H, 0.92 * W);

/** Tailwind classes for a DOM element exactly on the frame (centred in its sticky stage). */
export const BRIDGE_BOX = "absolute top-1/2 left-1/2 aspect-[2/1] w-[min(130svh,92vw)] -translate-x-1/2 -translate-y-1/2";

/** The 3D module from above (rendered from “Inside the panel”, cropped to the frame). */
export const BRIDGE_SRC = "/waaree/story/panel-top.jpg";
