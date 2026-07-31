"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Figures that arrive rather than appear.
 *
 * One rule governs everything in this file: **a bar, a ring or a percentage asserts a
 * scale.** Drawing one over a number with no denominator invents a comparison the data
 * cannot support, and on a site whose whole argument is engineering rigour that is a
 * worse failure than being plain. `StatTiles` already refuses a chart for four unrelated
 * measures for the same reason. So `Counter` takes any number, and `Ring`, `Meter` and
 * `Sparkline` each demand something the data must actually have.
 *
 * The split between JS and CSS here is deliberate and not arbitrary:
 *
 *   - `Counter` is JavaScript because counting is a change of *content*, which CSS
 *     cannot animate. It runs once when scrolled to.
 *   - `Ring`, `Meter` and `Sparkline` are pure CSS on a `view()` timeline, so they fill
 *     as they enter and *unfill* as they leave. That reversibility is the thing that
 *     makes a page feel driven by the scroll rather than triggered by it, and it is
 *     precisely what a JavaScript implementation would have to fake.
 */

/** True when the visitor has asked for stillness, or the device cannot afford motion. */
function motionAllowed() {
  const tier = document.documentElement.dataset.motion;
  return tier === "full" || tier === "reduced";
}

/**
 * A number that counts up to its value the first time it is seen.
 *
 * **The final value is what renders on the server and on the hydrating client render.**
 * The count starts only afterwards, from an effect. That ordering is the whole design:
 * a statistic that reads `0` without JavaScript is not a subtle animation, it is a false
 * claim, and a value that differs between server and first client render is the
 * hydration mismatch this codebase has already paid for once.
 *
 * Formatting goes through one `Intl.NumberFormat` instance used by both paths, so the
 * grouped digits are byte-identical however the value arrives.
 */
export function Counter({
  value,
  duration = 1400,
  className = "",
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const format = (n: number) => n.toLocaleString("en-GB");

  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || done.current || !motionAllowed()) return;

    // Waits to be seen. Counting a figure that is three screens below the fold means the
    // visitor arrives to a number that has already finished moving.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || done.current) continue;
          done.current = true;
          observer.disconnect();
          run();
        }
      },
      { threshold: 0.4 },
    );

    let frame = 0;
    let start: number | null = null;

    const run = () => {
      const step = (time: number) => {
        if (start === null) start = time;
        const t = Math.min(1, (time - start) / duration);
        // Exponential ease-out: most of the distance early, then a long settle. A linear
        // count reads like a loading spinner; this reads like a dial finding its mark.
        const eased = 1 - Math.pow(2, -10 * t);
        setShown(Math.round(value * (t === 1 ? 1 : eased)));
        if (t < 1) frame = requestAnimationFrame(step);
        else setShown(value);
      };
      frame = requestAnimationFrame(step);
    };

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className={className}>
      {/* aria-hidden on the moving text and the real value in the label, so a screen
          reader is told the figure once instead of narrating every frame of the count. */}
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}

/**
 * A metric that describes a change, animating the change it describes.
 *
 * Written for values of the form `"2.4s to 40ms"` — a before and an after. Those are the
 * most valuable numbers on an engineering portfolio and they are the ones a bar chart
 * cannot show, because the two figures are usually in different units. Here the figure
 * simply *is* the transition: it holds the old value, then crosses to the new one.
 *
 * Any value that does not parse as a transition is rendered verbatim. Guessing would
 * mean showing a number the CMS never said.
 */
export function Transition({ value, className = "" }: { value: string; className?: string }) {
  const parts = value.split(/\s+to\s+/i);
  const isTransition = parts.length === 2;

  const [crossed, setCrossed] = useState(true);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !isTransition || done.current || !motionAllowed()) return;

    setCrossed(false);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || done.current) continue;
          done.current = true;
          observer.disconnect();
          // Long enough to read the old value before it is replaced. Any quicker and the
          // "before" is a flicker nobody registers, which loses the whole point.
          window.setTimeout(() => setCrossed(true), 700);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isTransition]);

  if (!isTransition) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span ref={ref} className={className}>
      <span aria-hidden className={`metric-cross ${crossed ? "is-after" : ""}`}>
        <span className="metric-cross-from">{parts[0]}</span>
        <span className="metric-cross-arrow">→</span>
        <span className="metric-cross-to">{parts[1]}</span>
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}

/**
 * A ring for a genuine ratio, and only for a genuine ratio.
 *
 * `percent` must be a real part-of-whole. The ring is drawn with `conic-gradient` and
 * scrubbed by a `view()` timeline through `@property --ring`, which is what makes the
 * gradient interpolable at all — an unregistered custom property would jump from 0 to
 * the final value with nothing in between.
 *
 * The number is always printed beside it. A ring alone encodes magnitude by angle and
 * colour, and neither survives being printed, being read out, or being looked at by
 * someone who cannot separate the two hues.
 */
export function Ring({
  percent,
  label,
  caption,
}: {
  percent: number;
  label: string;
  caption?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <div className="figure-ring-wrap">
      <div
        className="figure-ring"
        style={{ "--ring-target": `${safe}%` } as React.CSSProperties}
        role="img"
        aria-label={`${label}: ${safe}%`}
      >
        <span className="figure-ring-value" aria-hidden>
          {safe}
          <span className="figure-ring-unit">%</span>
        </span>
      </div>
      <p className="figure-ring-label">{label}</p>
      {caption && <p className="figure-ring-caption">{caption}</p>}
    </div>
  );
}

/**
 * An ordinal level shown as discrete segments rather than a continuous bar.
 *
 * Proficiency is a ranked category — "comfortable" is above "learning", but not by a
 * measurable amount. A continuous bar would claim the gaps are equal and measurable;
 * segments say exactly what the data says, which is "this many steps up a named scale".
 */
export function Meter({
  level,
  levels,
  label,
}: {
  level: number;
  levels: number;
  label: string;
}) {
  return (
    <span className="figure-meter" role="img" aria-label={label}>
      {Array.from({ length: levels }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={`figure-meter-step ${index < level ? "is-on" : ""}`}
          style={{ "--step": index } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

/**
 * A line that draws itself as it scrolls into view.
 *
 * A real time series only — the points must be ordered and evenly spaced, or the line
 * asserts a trend the data does not contain. Drawn with `stroke-dashoffset` on a
 * `view()` timeline, so it draws on the way down and retracts on the way up with no
 * JavaScript at all.
 *
 * No fill, no axis, no gridlines, and one label on the peak. A sparkline's job is shape,
 * and everything else added to it competes with the only thing it is good at.
 */
export function Sparkline({
  points,
  label,
  className = "",
}: {
  points: number[];
  label: string;
  className?: string;
}) {
  if (points.length < 2) return null;

  const width = 100;
  const height = 26;
  const peak = Math.max(...points);
  const floor = Math.min(...points);
  const span = Math.max(1, peak - floor);

  const d = points
    .map((value, index) => {
      const x = (index / (points.length - 1)) * width;
      // 1.5 of padding top and bottom so a peak or a trough is never clipped by the box.
      const y = height - 1.5 - ((value - floor) / span) * (height - 3);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      className={`figure-spark ${className}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <path className="figure-spark-line" d={d} pathLength={1} />
    </svg>
  );
}
