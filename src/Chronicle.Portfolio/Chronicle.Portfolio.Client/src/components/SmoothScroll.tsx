"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { registerScroller } from "@/lib/scroll";
import { applyMotionTier } from "@/lib/appearanceScript";

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
    const root = document.documentElement;

    let lenis: Lenis | null = null;
    let height: ResizeObserver | null = null;
    let frame = 0;
    let published = 0;

    const start = () => {
      if (lenis) return;

      lenis = new Lenis({
        // Slightly longer than the default. The site is a chronicle; it should not feel
        // twitchy.
        duration: 1.05,
        // Standard exponential ease-out. Motion that decays rather than stopping is the
        // whole point of being here.
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        // Touch devices already have inertial scroll from the OS, and overriding it
        // makes a phone feel broken in a way people notice immediately.
        syncTouch: false,
      });

      // So the status bar's back-to-top can go through Lenis rather than fighting it.
      registerScroller(lenis);

      /*
        Re-measure whenever the page's height changes. Without this the scroll simply
        stops early, and it is not subtle.

        Lenis caches a `limit` and recomputes it only when its `content` element resizes.
        Content defaults to `<html>` — which this layout pins to `height: 100%` with
        `h-full`. An element that is exactly the viewport's height never changes its own
        border box when the content inside it grows, so Lenis's own observer never fires
        and the limit stays at whatever it was when it last measured.

        On a client-side navigation that is the PREVIOUS page's height. Measured: arrive
        at /timeline by clicking the header link from /about and the wheel stopped 1008px
        short of the bottom, exactly at About's old limit — and every `lenis.scrollTo`
        clamped with it, so dragging the timeline's scrubber past that point did nothing
        at all. The browser's own scrollbar does not consult Lenis, which is why it was
        the one thing that still worked.

        `<body>` is `min-h-full`, so unlike `<html>` it grows with its content. Observing
        it also covers the other ways the height moves — filtering the timeline's lenses,
        late-loading fonts and images — rather than only navigation.
      */
      height = new ResizeObserver(() => lenis?.resize());
      height.observe(document.body);

      const tick = (time: number) => {
        // Narrowed for the closure: `stop()` can null the outer binding between frames.
        const instance = lenis;
        if (!instance) return;

        instance.raf(time);

        /*
          Normalised against a velocity that reads as "fast" rather than against the
          maximum possible, so ordinary scrolling uses most of the range instead of
          sitting near zero until someone flings the page.
        */
        const velocity = Math.max(-1, Math.min(1, instance.velocity / 40));

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
    };

    const stop = () => {
      if (!lenis) return;

      cancelAnimationFrame(frame);
      registerScroller(null);
      height?.disconnect();
      height = null;
      lenis.destroy();
      lenis = null;
      published = 0;
      // Left behind, these would freeze every velocity-driven effect at whatever lean
      // it had when the scroll was switched off.
      root.style.removeProperty("--scroll-velocity");
      root.style.removeProperty("--scroll-speed");
    };

    const sync = () => {
      if (root.dataset.motion === "full") start();
      else stop();
    };

    sync();

    /*
      Reactive, not decided once.

      This used to read the tier on mount and return early if it was not `full`, which
      meant switching Recruiter Mode on left inertial scroll running until the page was
      reloaded. The tier can now change at any moment — Recruiter Mode, or the OS
      reduced-motion setting — so this has to follow it.
    */
    const tier = new MutationObserver(sync);
    tier.observe(root, { attributeFilter: ["data-motion"] });

    /*
      The OS preference, watched here because this component is mounted once for the
      lifetime of the app and the tier has to be re-derived from somewhere when it
      changes. Recruiter Mode is handled by the toggle itself.
    */
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onQuietChange = () => applyMotionTier();
    quiet.addEventListener("change", onQuietChange);

    return () => {
      tier.disconnect();
      quiet.removeEventListener("change", onQuietChange);
      stop();
    };
  }, []);

  return null;
}
