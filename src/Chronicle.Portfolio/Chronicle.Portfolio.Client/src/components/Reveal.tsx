"use client";

import { useEffect } from "react";

/**
 * Reveals anything marked `data-rise` as it scrolls into view.
 *
 * Generalised from the timeline's version, which had the same job on one page. The
 * mechanism is deliberately CSS with a class toggle rather than Motion: these are
 * server-rendered lists that never re-order, so there is nothing here that needs
 * measurement or exit animation, and a stylesheet transition costs no JavaScript per
 * element. Motion is reserved for the filtered grids, where it earns its weight.
 *
 * **Progressive enhancement, in this order:**
 * 1. Server HTML renders every element visible.
 * 2. This sets `data-reveal="ready"` on `<body>`, which is the only thing that lets the
 *    CSS hide anything. No JavaScript therefore means no hiding — never a page stuck
 *    at opacity zero, which is the failure mode of every scroll-reveal that assumes it
 *    will run.
 * 3. Reduced motion or Recruiter Mode: the attribute is never set at all.
 */
export function Reveal() {
  useEffect(() => {
    const root = document.documentElement;

    const quiet =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      root.dataset.recruiter === "on";

    if (quiet) {
      return;
    }

    const targets = document.querySelectorAll<HTMLElement>("[data-rise]");
    if (targets.length === 0) {
      return;
    }

    document.body.dataset.reveal = "ready";

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

    for (const target of targets) {
      observer.observe(target);
    }

    /*
      Anything already on screen at load is shown immediately rather than animated.

      Without this the page appears to load empty and then fill in, which is slower to
      read and looks like a fault. Entrance animation is for content arriving, and
      content that was already there did not arrive.
    */
    const viewportHeight = window.innerHeight;
    for (const target of targets) {
      if (target.getBoundingClientRect().top < viewportHeight * 0.9) {
        target.classList.add("is-visible");
        observer.unobserve(target);
      }
    }

    return () => observer.disconnect();
  }, []);

  return null;
}
