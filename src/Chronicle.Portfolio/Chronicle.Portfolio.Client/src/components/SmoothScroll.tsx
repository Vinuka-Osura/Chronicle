"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Inertial scrolling, and scroll velocity published for anything that wants it.
 *
 * This is the foundation the rest of the motion sits on, and it is the single biggest
 * difference between this site and the ones it is trying to stand next to. Native scroll
 * stops dead the instant the wheel does; inertial scroll carries and decays. Everything
 * animated downstream inherits that feeling — which is why adding effects on top of
 * native scroll never reads as expensive however good the effects are.
 *
 * It publishes two custom properties on `<html>`:
 *
 *   --scroll-velocity   signed, roughly -1..1, for skew and lean
 *   --scroll-speed      absolute, 0..1, for anything that only cares how fast
 *
 * CSS variables rather than React state deliberately. Velocity changes every frame, and
 * putting that through React would re-render the tree sixty times a second to move a few
 * pixels. A custom property is read by the compositor without React ever knowing.
 *
 * **Off entirely below the `full` tier.** Inertial scroll is the effect most likely to
 * feel wrong on a device that cannot keep up — a laggy smooth scroll is worse than no
 * smooth scroll, because it fights the input rather than merely failing to decorate it.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (document.documentElement.dataset.motion !== "full") {
      return;
    }

    const lenis = new Lenis({
      // Slightly longer than the default. The site is a chronicle; it should not feel
      // twitchy.
      duration: 1.05,
      // Standard exponential ease-out. Motion that decays rather than stopping is the
      // whole point of being here.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // Touch devices already have inertial scroll from the OS, and overriding it makes
      // a phone feel broken in a way people notice immediately.
      syncTouch: false,
    });

    const root = document.documentElement;
    let frame = 0;
    let published = 0;

    const tick = (time: number) => {
      lenis.raf(time);

      /*
        Normalised against a velocity that reads as "fast" rather than against the
        maximum possible, so ordinary scrolling uses most of the range instead of
        sitting near zero until someone flings the page.
      */
      const velocity = Math.max(-1, Math.min(1, lenis.velocity / 40));

      // Only write when it has actually moved. A style write every frame invalidates
      // computed styles for the whole document whether or not the value changed.
      if (Math.abs(velocity - published) > 0.01) {
        published = velocity;
        root.style.setProperty("--scroll-velocity", velocity.toFixed(3));
        root.style.setProperty("--scroll-speed", Math.abs(velocity).toFixed(3));
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      root.style.removeProperty("--scroll-velocity");
      root.style.removeProperty("--scroll-speed");
    };
  }, []);

  return null;
}
