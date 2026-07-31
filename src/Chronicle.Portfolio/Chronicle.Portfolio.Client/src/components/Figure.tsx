"use client";

import { useEffect, useRef, useState } from "react";
import { comparisonBars, readMetric } from "@/lib/metricValue";

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
  decimals = 0,
  duration = 1400,
  className = "",
}: {
  value: number;
  /** Kept as written, so 2.4 does not count up as 2 and land wrong. */
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const format = (n: number) =>
    n.toLocaleString("en-GB", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !motionAllowed()) return;

    let frame = 0;
    let start: number | null = null;

    const run = () => {
      cancelAnimationFrame(frame);
      start = null;

      const step = (time: number) => {
        if (start === null) start = time;
        const t = Math.min(1, (time - start) / duration);
        // Exponential ease-out: most of the distance early, then a long settle. A linear
        // count reads like a loading spinner; this reads like a dial finding its mark.
        const eased = 1 - Math.pow(2, -10 * t);
        const places = 10 ** decimals;
        setShown(Math.round(value * (t === 1 ? 1 : eased) * places) / places);
        if (t < 1) frame = requestAnimationFrame(step);
        else setShown(value);
      };

      frame = requestAnimationFrame(step);
    };

    /*
      TWO observers, because starting and resetting are not the same question.

      **Start** when the figure reaches a band across the middle of the screen. Firing on
      any intersection at all was the original bug: these figures sit inside a pinned
      scene whose sticky content becomes geometrically visible at the top of a 240vh
      track, a screen and a half before anyone has arrived to read it, so the count
      reliably finished while the reader was still scrolling towards it — which is
      indistinguishable from it never having run.

      **Reset** only once the figure has genuinely left the viewport. Resetting at the
      edge of the trigger band instead was the obvious shortcut and it is visibly wrong:
      a card sitting perfectly readable near the top of the screen would show 0, because
      it had scrolled out of the middle third. A figure that is on screen always reads
      its real value.
    */
    const arrive = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) run();
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: 0 },
    );

    const rearm = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) continue;
          // Off screen entirely: put it back to zero so returning plays it again.
          cancelAnimationFrame(frame);
          setShown(0);
        }
      },
      { rootMargin: "80px", threshold: 0 },
    );

    arrive.observe(element);
    rearm.observe(element);

    return () => {
      arrive.disconnect();
      rearm.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration, decimals]);

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
 * A metric value, set as a headline figure.
 *
 * The number takes display size and the unit is tucked beside it at a fraction of the
 * size — the difference between "40ms" as one lump of text and a figure with a unit is
 * most of why a dashboard reads as instrumentation rather than as a table.
 *
 * Everything here is conditional on what `readMetric` could actually work out. A value
 * it cannot parse is printed exactly as the CMS holds it, because the alternative —
 * guessing at a shape — means showing a number nobody wrote.
 */
export function MetricValue({ value }: { value: string }) {
  const reading = readMetric(value);
  const bars = comparisonBars(reading);

  if (reading.kind === "verbatim" || !reading.to) {
    return <span className="metric-figure">{reading.raw}</span>;
  }

  const { to, from, factor } = reading;

  return (
    <>
      <span className="metric-figure">
        {to.prefix && <span className="metric-prefix">{to.prefix}</span>}
        <Counter value={to.value} decimals={to.decimals} />
        {to.unit && <span className="metric-unit">{to.unit}</span>}
      </span>

      {/* Where it came from, and by how much. The multiple is arithmetic on the two
          figures, not a judgement: "lower" and "higher" rather than "better", because
          which of those is good depends on the metric and this cannot know. */}
      {from && (
        <span className="metric-delta">
          <span className="metric-delta-arrow" aria-hidden>
            {factor?.direction === "higher" ? "↑" : "↓"}
          </span>
          {factor ? `${factor.times}× ${factor.direction}` : "from"} than {from.raw}
        </span>
      )}

      {/*
        The comparison, drawn only when both sides are the same dimension — see
        `comparisonBars`. This is the single most persuasive thing on the page when it
        applies, because a bar sixty times longer than the one beneath it says what
        "2.4s to 40ms" means faster than the sentence does.
      */}
      {bars && from && (
        <span className="metric-bars" aria-hidden>
          <span className="metric-bar-row">
            <span className="metric-bar metric-bar-before" style={{ width: `${bars.from * 100}%` }}>
              <span className="metric-bar-fill" />
            </span>
            <span className="metric-bar-tag">{from.raw}</span>
          </span>
          <span className="metric-bar-row">
            <span className="metric-bar metric-bar-after" style={{ width: `${bars.to * 100}%` }}>
              <span className="metric-bar-fill" />
            </span>
            <span className="metric-bar-tag is-after">{to.raw}</span>
          </span>
        </span>
      )}
    </>
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
 * A column chart, sized to sit under a headline figure.
 *
 * The shape borrowed from the reference dashboards: a short row of vertical bars with a
 * label under each, giving a headline number the context of how it got there. Bars grow
 * from the baseline on a scroll timeline, so they fill on the way down and empty on the
 * way back up with no JavaScript.
 *
 * **Only ever fed a real, evenly-spaced series.** The points must be successive
 * measurements of one thing — contributions per month, projects per year. A row of bars
 * asserts that its categories are comparable and ordered, and there is no way to draw it
 * "just for looks" without making that claim.
 */
export function BarSeries({
  points,
  labels,
  label,
  highlightLast = false,
}: {
  points: number[];
  labels: string[];
  /** For screen readers, since the bars themselves carry no text. */
  label: string;
  /** Marks the most recent column, when "now" is the point of the chart. */
  highlightLast?: boolean;
}) {
  if (points.length === 0) return null;

  const peak = Math.max(...points, 1);

  return (
    <div className="figure-bars" role="img" aria-label={label}>
      <div className="figure-bars-row">
        {points.map((value, index) => (
          <span
            key={index}
            className={`figure-bar ${highlightLast && index === points.length - 1 ? "is-now" : ""}`}
            // The delay is per column, so the chart builds left to right instead of
            // appearing all at once.
            style={
              {
                "--bar": `${Math.max(0.04, value / peak) * 100}%`,
                "--col": index,
              } as React.CSSProperties
            }
          >
            <span className="figure-bar-fill" />
          </span>
        ))}
      </div>

      <div className="figure-bars-labels" aria-hidden>
        {labels.map((text, index) => (
          <span key={index}>{text}</span>
        ))}
      </div>
    </div>
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
