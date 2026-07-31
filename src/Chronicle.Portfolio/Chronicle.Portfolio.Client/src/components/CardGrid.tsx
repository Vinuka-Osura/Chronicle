"use client";

import { AnimatePresence, motion } from "motion/react";
import { EASE_OUT_QUIET, cardVariants, staggerFor, useMotionAllowed } from "@/lib/motion";

/**
 * A grid whose cards animate in, out, and into each other's places as a filter changes.
 *
 * This is the one thing CSS genuinely cannot do. A stylesheet can fade a card in, but it
 * cannot animate an element that React has already removed from the tree, and it cannot
 * move the survivors into the gap — they simply jump. The result is a filter that feels
 * like a page reload rather than a set changing.
 *
 * `layout` on each item is what closes the gap smoothly, and it is measured by the
 * browser rather than guessed at, so it stays correct at any breakpoint and any card
 * height.
 *
 * **Nothing animates when motion is not allowed.** The list renders as a plain grid with
 * no Motion components mounted at all, rather than animating at zero duration — under
 * reduced motion the honest answer is a static list, and it also means Recruiter Mode
 * ships less JavaScript to do less work.
 */
export function CardGrid<T>({
  items,
  keyOf,
  children,
  className = "",
}: {
  items: readonly T[];
  keyOf: (item: T) => string;
  children: (item: T) => React.ReactNode;
  className?: string;
}) {
  const animate = useMotionAllowed();

  if (!animate) {
    return (
      <ul className={className}>
        {items.map((item) => (
          <li key={keyOf(item)}>{children(item)}</li>
        ))}
      </ul>
    );
  }

  const stagger = staggerFor(items.length);

  return (
    <ul className={className}>
      {/*
        popLayout, so a leaving card is taken out of the layout flow immediately and the
        survivors start closing the gap while it is still fading. The default would hold
        its space until the exit finished, which reads as a stutter.
      */}
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item, index) => (
          <motion.li
            key={keyOf(item)}
            layout
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              // Quick. At 320ms the arrival was still visible as an arrival; the point
              // is that the set has changed, not that each card made an entrance.
              duration: 0.22,
              ease: EASE_OUT_QUIET,
              delay: index * stagger,
              // The reflow is quicker than the fade: the grid should look settled before
              // the arriving card finishes, not still shuffling underneath it.
              layout: { duration: 0.2, ease: EASE_OUT_QUIET },
            }}
          >
            {children(item)}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
