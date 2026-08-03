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

/**
 * Jumps to the top with no animation. For arriving at a new page.
 *
 * Next resets the scroll position itself on a client-side navigation, and with Lenis
 * running that reset does not stick: Lenis holds its own target position and animates
 * the page straight back to where the last one was left. Reading to the bottom of Home
 * and clicking "About" therefore landed at the bottom of About.
 *
 * `immediate` rather than a duration, because this is not a gesture — a new page
 * scrolling itself up in front of the reader would be worse than the bug.
 */
export function resetScroll() {
  if (active) {
    active.scrollTo(0, { immediate: true, force: true });
  }

  // Also directly, for the no-Lenis tiers and to keep the two in agreement.
  window.scrollTo({ top: 0, behavior: "auto" });
}
