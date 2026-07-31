"use client";

import { useEffect } from "react";

/** Shown outright rather than animated if it is already this far up the viewport. */
const ALREADY_ON_SCREEN = 0.9;

/**
 * Everything this component is responsible for arming.
 *
 * `.emerge` is normally driven by the scroll position itself and does not need an
 * observer at all — but the CSS falls back to a one-shot transition where
 * `animation-timeline` is unsupported, and that fallback needs `is-in` from here.
 * Observing it in both cases is harmless: when the scroll-driven path is live, the
 * class it adds matches nothing.
 */
const REVEALABLE = "[data-rise], .reveal-mask, .emerge, .emerge-set > *";

/**
 * Reveals anything marked `data-rise` as it scrolls into view.
 *
 * The mechanism is deliberately CSS with a class toggle rather than Motion: these are
 * server-rendered sections that never re-order, so there is nothing needing measurement
 * or exit animation, and a stylesheet transition costs no JavaScript per element. Motion
 * is reserved for the filtered grids, where it earns its weight.
 *
 * **Progressive enhancement, in this order:**
 * 1. Server HTML renders every element visible.
 * 2. This sets `data-reveal="ready"` on `<body>`, which is the only thing that lets the
 *    CSS hide anything. No JavaScript therefore means no hiding — never a page stuck at
 *    opacity zero, which is the failure mode of every scroll-reveal that assumes it will
 *    run.
 * 3. Reduced motion or Recruiter Mode: the attribute is never set at all.
 *
 * **This component mounts once, in the root layout, and never unmounts.** Client-side
 * navigation replaces the page underneath it — so watching only the elements present at
 * mount is not enough. Everything arriving later has to be picked up too, or it inherits
 * the hidden state with nothing left to reveal it. That bug looked exactly like the page
 * failing to load its data.
 */
export function Reveal() {
  useEffect(() => {
    const quiet =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.recruiter === "on";

    if (quiet) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible", "is-in");
          // Once. Re-animating on the way back up turns scrolling into a flicker of
          // things redoing their entrance.
          observer.unobserve(entry.target);
        }
      },
      // Fires slightly before the element is fully on screen, so the movement finishes
      // as it settles rather than starting after it has already arrived.
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    /**
     * Starts watching an element, or shows it immediately if it has arrived on screen.
     *
     * Showing outright matters more after a navigation than on first load: the new
     * page's first section is at the top of the viewport the instant it mounts, and
     * animating it in would mean the page visibly assembling itself every time somebody
     * clicks a link.
     */
    const watch = (element: Element) => {
      if (element.classList.contains("is-visible") || element.classList.contains("is-in")) {
        return;
      }

      if (element.getBoundingClientRect().top < window.innerHeight * ALREADY_ON_SCREEN) {
        element.classList.add("is-visible", "is-in");
        return;
      }

      observer.observe(element);
    };

    const watchWithin = (root: ParentNode) => {
      if (root instanceof Element && root.matches(REVEALABLE)) {
        watch(root);
      }

      for (const element of root.querySelectorAll(REVEALABLE)) {
        watch(element);
      }
    };

    document.body.dataset.reveal = "ready";
    watchWithin(document);

    /*
      Mask reveals split two ways.

      Anything carrying `data-in-delay` is above the fold and part of an arrival
      sequence, so it fires on a timer rather than waiting to be scrolled to — a hero
      that only appears once you scroll is a hero nobody sees.

      Everything else with `.reveal-mask` reveals on entering the viewport, through the
      same observer as `[data-rise]`.
    */
    const masks = document.querySelectorAll<HTMLElement>(".reveal-mask");
    const timers: number[] = [];

    for (const mask of masks) {
      const delay = mask.dataset.inDelay;

      if (delay !== undefined) {
        timers.push(
          window.setTimeout(() => mask.classList.add("is-in"), Number(delay) || 0),
        );
      } else {
        watch(mask);
      }
    }

    /*
      The fix for navigation.

      A MutationObserver rather than re-running this effect on the pathname, because
      reading usePathname() in the root layout would pull every page out of the static
      shell — the same reason the theme is set by a pre-paint script instead of cookies().
      Watching the DOM costs nothing here and knows about content this component never
      renders.
    */
    const arrivals = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) {
            watchWithin(node);
          }
        }
      }
    });

    arrivals.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      arrivals.disconnect();
      for (const timer of timers) clearTimeout(timer);
    };
  }, []);

  return null;
}
