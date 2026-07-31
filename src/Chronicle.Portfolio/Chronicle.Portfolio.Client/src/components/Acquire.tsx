"use client";

import { useEffect, useRef, useState } from "react";

/** Monospace glyphs only, so every intermediate frame is the same width as the final one. */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\|<>=+*#";

/**
 * A label that resolves through a brief scramble, like a readout locking on.
 *
 * This is the site's verbal tic — the "instrument" idea made literal in one gesture. It
 * is reserved for **monospace labels and figures**: the eyebrow, a status field, a
 * number. Never prose. Scrambling a sentence is a party trick that makes text
 * unreadable and would undo everything the rest of the design is doing.
 *
 * It resolves left to right so the word is legible before it finishes, and it runs once.
 * A label that keeps re-scrambling is a distraction pretending to be a feature.
 */
export function Acquire({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  // Starts as the real text: server-rendered, readable, and correct without JavaScript.
  const [shown, setShown] = useState(text);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (document.documentElement.dataset.motion !== "full") return;

    done.current = true;

    let frame = 0;
    let start: number | null = null;
    // Fast. This is a flourish on arrival, not a loading state - past about half a
    // second it stops reading as "locking on" and starts reading as "broken".
    const DURATION = 420;

    const step = (time: number) => {
      if (start === null) start = time;
      const progress = Math.min(1, (time - start) / DURATION);
      const settled = Math.floor(progress * text.length);

      setShown(
        text
          .split("")
          .map((character, index) => {
            if (index < settled || character === " ") return character;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join(""),
      );

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        setShown(text);
      }
    };

    const timer = setTimeout(() => {
      frame = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [text, delay]);

  // aria-label carries the real text throughout, so a screen reader never hears the
  // scramble however the timing lands.
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}
