"use client";

import { useEffect } from "react";

/**
 * Reveals timeline cards as they enter the viewport.
 *
 * Replaces the CSS `animation-timeline: view()` version, which only runs on Chromium 115
 * and later — so the same page animated in one browser and sat still in another
 * depending on which version happened to be installed. An IntersectionObserver behaves
 * identically everywhere.
 *
 * Progressive enhancement: this component sets `data-reveal="ready"` on the container,
 * and the CSS only hides cards when that attribute is present. With JavaScript
 * unavailable the attribute never appears, so every card renders fully visible rather
 * than staying stuck at opacity zero.
 */
export function TimelineReveal() {
  useEffect(() => {
    const container = document.querySelector<HTMLElement>("[data-timeline]");
    if (!container) return;

    const nodes = container.querySelectorAll<HTMLElement>(".timeline-node, .timeline-today");

    // Someone who asked for less motion gets the end state immediately, not a
    // faster version of the animation.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach((n) => n.classList.add("is-visible"));
      return;
    }

    container.dataset.reveal = "ready";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          // Reveal once. Re-animating on every pass would turn scrolling back up into a
          // flicker of cards redoing their entrance.
          observer.unobserve(entry.target);
        }
      },
      // Fires a little before the card is fully on screen, so the movement finishes as
      // it settles rather than starting after it has arrived.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    nodes.forEach((n) => observer.observe(n));

    // Anything already on screen at load reveals immediately — the page enters at the
    // today line, so those cards must not wait for a scroll that may never come.
    return () => observer.disconnect();
  }, []);

  return null;
}
