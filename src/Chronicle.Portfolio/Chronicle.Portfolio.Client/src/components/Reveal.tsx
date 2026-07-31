"use client";

import { useEffect } from "react";

/** Shown outright rather than animated if it is already this far up the viewport. */
const ALREADY_ON_SCREEN = 0.9;

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
          entry.target.classList.add("is-visible");
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
      if (element.classList.contains("is-visible")) {
        return;
      }

      if (element.getBoundingClientRect().top < window.innerHeight * ALREADY_ON_SCREEN) {
        element.classList.add("is-visible");
        return;
      }

      observer.observe(element);
    };

    const watchWithin = (root: ParentNode) => {
      if (root instanceof Element && root.matches("[data-rise]")) {
        watch(root);
      }

      for (const element of root.querySelectorAll("[data-rise]")) {
        watch(element);
      }
    };

    document.body.dataset.reveal = "ready";
    watchWithin(document);

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
    };
  }, []);

  return null;
}
