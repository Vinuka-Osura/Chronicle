import type Lenis from "lenis";

/**
 * The active inertial-scroll instance, if there is one.
 *
 * A module-level reference rather than context: `SmoothScroll` mounts once in the root
 * layout and the only other thing that needs it is the status bar's back-to-top button.
 * A provider for one consumer is ceremony, and it would force both into the same client
 * subtree for no benefit.
 */
let active: Lenis | null = null;

export function registerScroller(instance: Lenis | null) {
  active = instance;
}

/**
 * Returns to the top, honouring inertial scroll when it is running.
 *
 * Calling `window.scrollTo` while Lenis is active fights it — Lenis keeps its own target
 * position and will drag the page back. Going through the instance when there is one is
 * the only way both paths behave.
 */
export function scrollToTop() {
  if (active) {
    active.scrollTo(0, { duration: 1.1 });
    return;
  }

  const abrupt = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: abrupt ? "auto" : "smooth" });
}
