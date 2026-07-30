"use client";

import { useReducedMotion } from "motion/react";
import { useAppearance } from "./appearance";

/**
 * Whether motion should run at all.
 *
 * Two independent reasons to stop, and both have to be checked **in JavaScript**:
 *
 * - `prefers-reduced-motion`, which is an accessibility setting and can mean anything
 *   from a preference to vestibular disorder. Not negotiable.
 * - Recruiter Mode, where atmosphere is exactly what someone scanning for evidence does
 *   not need.
 *
 * The global CSS already kills `animation` and `transition` under Recruiter Mode, and
 * that is enough for anything animated in CSS. It is **not** enough here: Motion drives
 * the Web Animations API and inline styles, neither of which that rule touches. A
 * component that only trusted the stylesheet would keep animating for the one visitor
 * who explicitly asked it not to.
 */
export function useMotionAllowed(): boolean {
  const reduced = useReducedMotion();
  const { isRecruiterMode } = useAppearance();

  return !reduced && !isRecruiterMode;
}

/**
 * The site's motion vocabulary, in one place.
 *
 * Durations are short and easings are the same curve used by the CSS transitions, so
 * something animated by Motion and something animated by a stylesheet feel like the same
 * site rather than two.
 */
export const EASE_OUT_QUIET = [0.16, 1, 0.3, 1] as const;

/** Distances are small on purpose. Motion that travels far reads as a page still loading. */
export const RISE = 12;

export const cardVariants = {
  hidden: { opacity: 0, y: RISE },
  visible: { opacity: 1, y: 0 },
  /*
    Leaving cards shrink slightly as they fade.

    Without the scale an exit is just a fade, which reads as "this was always going to
    disappear". A small contraction reads as the card being removed from the set, which
    is what actually happened.
  */
  exit: { opacity: 0, scale: 0.96 },
} as const;

/**
 * Stagger, capped.
 *
 * A fixed per-item delay looks considered for six cards and broken for forty — the last
 * one arrives two seconds after the first, long after the reader has started scrolling.
 * Dividing a fixed budget by the count keeps the whole sequence inside 240ms however
 * many there are.
 */
export function staggerFor(count: number): number {
  const TOTAL_MS = 240;
  return count > 0 ? Math.min(0.05, TOTAL_MS / 1000 / count) : 0;
}
