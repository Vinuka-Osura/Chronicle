"use client";

import { useEffect, useRef } from "react";

/** Particles per card. Only assembling cards draw, so this is not the whole page's cost. */
const PER_CARD = 38;

/** How far out a particle starts, as a multiple of the card's half-diagonal. */
const THROW = 2.6;

/** How far round the spiral a particle travels on its way in. */
const SWEEP = Math.PI * 1.15;

/**
 * A stable pseudo-random number for a given card and particle.
 *
 * Deterministic on purpose. The particles are redrawn from scratch every frame at a
 * progress derived from scroll position — if their spawn angles came from `Math.random`
 * they would be somewhere new on each frame and the whole field would boil. Hashing the
 * indices gives each particle a fixed identity for nothing.
 */
function noise(card: number, particle: number, salt: number): number {
  const n = Math.sin(card * 127.1 + particle * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Skills assembling out of a vortex.
 *
 * Each card's particles spiral in from off-card and settle onto its perimeter as it
 * arrives, then vanish. Scroll back up and they fly out again, because the progress that
 * drives them is the card's own scroll position rather than a timer — the same principle
 * the rest of the site's motion runs on, and the reason this reverses for free.
 *
 * Particles come from BELOW when scrolling down and from ABOVE when scrolling up, so the
 * field always appears to be feeding the page from the direction of travel.
 *
 * **The cards do not depend on this.** They arrive under their own CSS whether or not a
 * canvas ever appears; this draws behind them and is pure decoration on top of a page
 * that is already complete. A visitor with no canvas, a lost context, or a device on the
 * `reduced` tier sees the page, just without the flourish.
 */
export function Vortex({ selector = ".skill-card" }: { selector?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const root = document.documentElement;
    // Per-frame particle maths is the one thing the `reduced` tier genuinely should not
    // be asked to do, and `still` means still.
    if (root.dataset.motion !== "full") return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let ratio = 1;

    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    resize();

    /* ------------------------------------------------------------- palette --- */

    // Read from CSS so the field themes with everything else and cannot drift.
    let ink = "255,255,255";
    const readPalette = () => {
      const style = getComputedStyle(root);
      const hex = style.getPropertyValue("--color-signal").trim().replace("#", "");
      if (hex.length === 6) {
        ink = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");
      }
    };
    readPalette();

    /* --------------------------------------------------------------- cards --- */

    let cards: HTMLElement[] = [];
    const collect = () => {
      cards = [...document.querySelectorAll<HTMLElement>(selector)];
    };
    collect();

    // Which way the page is moving. Particles feed in from the direction of travel.
    let lastScroll = window.scrollY;
    let downward = 1;

    let frame = 0;
    let running = true;

    const draw = () => {
      if (!running) return;
      frame = requestAnimationFrame(draw);

      const scrolled = window.scrollY;
      if (Math.abs(scrolled - lastScroll) > 0.5) {
        downward = scrolled >= lastScroll ? 1 : -1;
        lastScroll = scrolled;
      }

      context.clearRect(0, 0, width, height);

      for (let index = 0; index < cards.length; index += 1) {
        const box = cards[index].getBoundingClientRect();

        // Off screen in either direction: nothing to assemble.
        if (box.bottom < -200 || box.top > height + 400) continue;

        /*
          Progress, from the card's own position.

          1 when its top has risen to 55% of the viewport — settled — and 0 while it is
          still a screen below. Reading it from geometry rather than storing it is what
          makes the whole thing reversible: scroll back and the number goes back down,
          and the particles retrace their path outwards without anything having to
          remember that they had already arrived.
        */
        const from = height * 1.0;
        const to = height * 0.55;
        const progress = Math.min(1, Math.max(0, (from - box.top) / (from - to)));

        // Settled, or not started. Either way there is nothing in flight.
        if (progress <= 0.001 || progress >= 0.999) continue;

        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        const reach = Math.hypot(box.width, box.height) / 2;

        for (let i = 0; i < PER_CARD; i += 1) {
          /*
            Where this particle is headed: a point just OUTSIDE the card's edge.

            Aiming inside the card was the first attempt and it wasted most of the
            effect — the canvas sits behind the grid so the cards can never be drawn
            over, which means every particle that lands inside one is a particle
            nobody sees. Landing on a ring around the perimeter keeps the whole
            gesture in view and reads as the card being delivered rather than dusted.
          */
          const targetAngle = noise(index, i, 1) * Math.PI * 2;
          const targetRadius = reach * (0.96 + noise(index, i, 2) * 0.26);

          // Each particle runs slightly out of step with its neighbours, so the swarm
          // arrives as a swarm rather than as one ring closing.
          const lag = noise(index, i, 3) * 0.35;
          const t = Math.min(1, Math.max(0, (progress - lag) / (1 - lag)));
          if (t <= 0) continue;

          // Ease-out: most of the distance early, then a long settle onto the edge.
          const eased = 1 - Math.pow(1 - t, 2.4);

          const angle = targetAngle + SWEEP * (1 - eased) * (noise(index, i, 4) > 0.5 ? 1 : -1);
          const radius = targetRadius + reach * THROW * (1 - eased);

          const x = cx + Math.cos(angle) * radius;
          // Biased along the axis of travel, so the field feeds from where the reader
          // came from rather than from everywhere at once.
          const y = cy + Math.sin(angle) * radius + downward * reach * 1.4 * (1 - eased);

          // In quickly, out as it lands: a particle that is still bright when it
          // reaches the card competes with the text.
          const alpha = Math.sin(Math.min(1, t) * Math.PI) * 0.7;
          if (alpha <= 0.01) continue;

          // Larger while it is still travelling, so distance reads as distance.
          const size = 1.3 + (1 - eased) * 2.4;

          context.fillStyle = `rgba(${ink},${alpha.toFixed(3)})`;
          context.beginPath();
          context.arc(x, y, size, 0, Math.PI * 2);
          context.fill();
        }
      }
    };

    frame = requestAnimationFrame(draw);

    /* -------------------------------------------------------------- upkeep --- */

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        resize();
        collect();
      }, 140);
    };
    window.addEventListener("resize", onResize);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!running) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // The card list and the palette both change under this component — a filter, a
    // navigation, a theme toggle — and it renders nothing itself, so watching is the
    // only way it hears about any of them.
    const arrivals = new MutationObserver(() => collect());
    arrivals.observe(document.body, { childList: true, subtree: true });

    const appearance = new MutationObserver(() => {
      readPalette();
      if (root.dataset.motion !== "full") {
        running = false;
        cancelAnimationFrame(frame);
        context.clearRect(0, 0, width, height);
      } else if (!running && !document.hidden) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    });
    appearance.observe(root, { attributeFilter: ["data-theme", "data-motion"] });

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      arrivals.disconnect();
      appearance.disconnect();
    };
  }, [selector]);

  return <canvas ref={canvasRef} className="vortex" aria-hidden />;
}
