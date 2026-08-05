"use client";

import { useEffect, useRef, useState } from "react";
import { scrollToTop } from "@/lib/scroll";

/** Build-time on the server, load-time in the browser. Identical but for one midnight. */
const YEAR = new Date().getFullYear();

/** How far down before returning to the top is worth offering. */
const WORTH_OFFERING = 0.08;

/**
 * The thin bar along the bottom of every page.
 *
 * It is three things at once, and that is the reason it exists rather than three
 * separate widgets: the persistent copyright line, the read-position readout, and the
 * way back up. A floating round "scroll to top" button in the corner is the single most
 * generic component on the web; the same affordance built into a status strip reads as
 * instrumentation.
 *
 * **It stands down when the real footer arrives.** The long footer is the end of the
 * document and says everything this bar says, so keeping a fixed strip over it would be
 * a duplicate copyright line and a progress meter reading 100%.
 *
 * The position is written to a custom property rather than to React state. Scroll fires
 * far more often than the number changes, and only the label needs re-rendering — the
 * fill is the compositor's problem.
 */
export function StatusBar() {
  const [percent, setPercent] = useState(0);
  const [scene, setScene] = useState<string | null>(null);
  const [atEnd, setAtEnd] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let frame = 0;
    let shown = -1;
    let shownScene: string | null = null;

    /*
      Cached, because querying the document on every scroll frame would be the most
      expensive thing this component does. Refreshed on DOM changes instead — a
      client-side navigation replaces the page under a component that never unmounts,
      so a list captured once at mount would describe the wrong page from the second
      route onwards.
    */
    let scenes: HTMLElement[] = [];
    const collectScenes = () => {
      scenes = [...document.querySelectorAll<HTMLElement>("[data-scene]")];
    };

    const measure = () => {
      frame = 0;

      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = total > 0 ? Math.min(1, Math.max(0, scrolled / total)) : 0;

      bar.style.setProperty("--read", ratio.toFixed(4));

      // Only re-render when the displayed integer actually changes: sixty renders a
      // second to show the same "42%" is sixty renders too many.
      const rounded = Math.round(ratio * 100);
      if (rounded !== shown) {
        shown = rounded;
        setPercent(rounded);
      }

      /*
        Whichever scene contains the middle of the screen is the one you are in.

        A midpoint rather than the top edge, because a pinned scene occupies the whole
        viewport for a screen and a half — measuring at the top would flip the label to
        the next section while you are still reading this one.
      */
      let current: string | null = null;
      const middle = window.innerHeight / 2;

      for (const element of scenes) {
        const box = element.getBoundingClientRect();
        if (box.top <= middle && box.bottom >= middle) {
          current = element.dataset.scene ?? null;
        }
      }

      if (current !== shownScene) {
        shownScene = current;
        setScene(current);
      }
    };

    const onScroll = () => {
      // Coalesced to one measurement per frame. Reading scrollHeight is a layout
      // read, and doing it per scroll event is how a page starts dropping frames.
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    collectScenes();
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Reads the DOM, never writes to it — so unlike the reveal component this replaced,
    // it cannot disagree with what React is hydrating.
    const arrivals = new MutationObserver(() => {
      collectScenes();
      onScroll();
    });
    arrivals.observe(document.body, { childList: true, subtree: true });

    /*
      Stand down over the long footer.

      An observer on the footer rather than a scroll threshold, because "the footer is
      visible" is the actual condition and page heights differ wildly — a threshold
      would be wrong on every page but the one it was tuned against.
    */
    const footer = document.querySelector("footer");
    const observer = footer
      ? new IntersectionObserver(
          ([entry]) => setAtEnd(entry.isIntersecting),
          { rootMargin: "0px 0px -24px 0px" },
        )
      : null;

    if (footer && observer) observer.observe(footer);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer?.disconnect();
      arrivals.disconnect();
    };
  }, []);

  return (
    <div
      ref={barRef}
      className="status-bar"
      data-standby={atEnd ? "true" : undefined}
      /* Not a landmark: it duplicates the footer's copyright and adds a control that is
         also reachable by the skip link and Home key. Announcing it on every page would
         be noise in a screen reader's landmark list. */
      aria-hidden={atEnd}
    >
      <p className="status-bar-mark">
        {/* The build year and the browser's year differ for one night a year, and the
            browser is the one that is right. */}
        <span suppressHydrationWarning>&copy; {YEAR}</span> Vinuka Osura Anupama. All
        rights reserved.
      </p>

      {/* Where you are, keyed so it re-enters when it changes rather than swapping the
          text in place. The label is the readout; the track is the position. */}
      <span className="status-bar-scene" aria-hidden>
        {scene && <span key={scene}>{scene}</span>}
      </span>

      <div className="status-bar-track" aria-hidden>
        <span className="status-bar-fill" />
      </div>

      <div className="status-bar-right">
        <output className="status-bar-readout" aria-label={`${percent}% read`}>
          {String(percent).padStart(2, "0")}%
        </output>

        <button
          type="button"
          className="status-bar-top"
          onClick={scrollToTop}
          // Hidden from everything, not just visually: an inert control that a keyboard
          // user can still tab to is worse than no control.
          hidden={percent < WORTH_OFFERING * 100}
        >
          <span aria-hidden>↑</span>
          <span className="sr-only">Back to top</span>
        </button>
      </div>
    </div>
  );
}
