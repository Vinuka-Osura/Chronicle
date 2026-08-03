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

/**
 * How far a card travels as a filter changes.
 *
 * 8px was chosen when this only had to say "the page finished loading" and it is too
 * quiet for what it does now: a filtered set changing under you is a real event, and at
 * eight pixels it read as a flicker. Still small — motion that travels far reads as a
 * page still loading — but far enough to be seen.
 */
export const RISE = 18;

export const cardVariants = {
  // A shade smaller as well as lower, so an arriving card reads as coming forward
  // rather than sliding along a track.
  hidden: { opacity: 0, y: RISE, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  /*
    Leaving cards shrink slightly as they fade.

    Without the scale an exit is just a fade, which reads as "this was always going to
    disappear". A small contraction reads as the card being removed from the set, which
    is what actually happened.
  */
  exit: { opacity: 0, scale: 0.96 },
} as const;

/**
 * Stagger, capped hard.
 *
 * The first version budgeted 240ms across the set, which still read as the page loading
 * rather than as choreography — you could watch the cards arrive, and watching content
 * arrive is waiting. 120ms total is under the threshold where a sequence stops looking
 * sequential and starts looking like one movement.
 *
 * A fixed per-item delay is worse at any budget: considered for six cards, broken for
 * forty, where the last lands seconds after the reader has moved on.
 */
export function staggerFor(count: number): number {
  // 120ms was tuned for an arrival nobody asked for. A set changing in response to a
  // filter someone just typed is worth watching, so it gets a little longer — still
  // under the threshold where a sequence stops reading as one movement.
  const TOTAL_MS = 220;
  return count > 0 ? Math.min(0.04, TOTAL_MS / 1000 / count) : 0;
}
