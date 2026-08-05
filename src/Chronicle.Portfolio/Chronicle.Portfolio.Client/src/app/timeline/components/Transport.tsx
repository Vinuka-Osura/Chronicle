"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { scrollToTop } from "@/lib/scroll";
import type { Timeline, TimelineItemType } from "@/lib/types";
import { areaPath } from "../curve";
import { buildDensity, type Density } from "../density";
import { useActiveLenses } from "../useActiveLenses";

/** Viewport height of the plot, in the same units the paths are built in. */
const PLOT = 34;

/** Marks are drawn at these heights above the axis so a cluster does not overlap. */
const MARK_ROW: Partial<Record<TimelineItemType, number>> = {
  certification: 4,
  roadmap: 4,
  milestone: 9,
};

const MARK_GLYPH: Partial<Record<TimelineItemType, string>> = {
  certification: "◆",
  roadmap: "○",
  milestone: "▲",
};

/**
 * The whole career as one readable shape, and the control for moving through it.
 *
 * Replaces a row of year buttons that could only be clicked, had no position-to-date
 * mapping at all, and drew a bar only for years that happened to contain a start date —
 * so an empty year simply vanished from the axis and the spacing lied about time.
 *
 * It also absorbs the site's `StatusBar`, which stands down here. That was always the
 * intent: two bars competing for the same bottom edge is one too many, and the percentage
 * and back-to-top belong with the thing that already knows where you are.
 */
export function Transport({ timeline }: { timeline: Timeline }) {
  const density = useMemo(() => buildDensity(timeline), [timeline]);
  const [percent, setPercent] = useState(0);
  const [window_, setWindow] = useState({ from: 0, to: 0 });
  const trackRef = useRef<HTMLDivElement>(null);

  /*
    The same subscription the context bar reads from, so the chips, the cards and this
    chart cannot disagree about what is showing.

    Not a `useState` filled by an effect, which is what this was first: on the server that
    leaves the array empty, so the HTML shipped with no bands at all and the whole chart
    appeared only after hydration. `useActiveLenses` answers "all of them" on the server,
    which is both the documented default and what a reader without JavaScript should see.
  */
  const lenses: string[] = useActiveLenses();

  /*
    Where the reader is, as a fraction of the page and as a window on the span.

    rAF-throttled: the control this replaces called setState on every scroll event, which
    on a page this long is hundreds of renders during one flick.
  */
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;

      const total = document.documentElement.scrollHeight - globalThis.innerHeight;
      const ratio = total > 0 ? Math.min(1, Math.max(0, globalThis.scrollY / total)) : 0;
      setPercent(Math.round(ratio * 100));

      // The visible slice of the page, mapped onto the span. Approximate by design: the
      // stream is not linear in time, and a window that claimed to be exact would be
      // wrong in a way nobody could see.
      const height = document.documentElement.scrollHeight || 1;
      setWindow({
        from: globalThis.scrollY / height,
        to: (globalThis.scrollY + globalThis.innerHeight) / height,
      });
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    globalThis.addEventListener("scroll", onScroll, { passive: true });
    globalThis.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      globalThis.removeEventListener("scroll", onScroll);
      globalThis.removeEventListener("resize", onScroll);
    };
  }, []);

  const shown = density.bands.filter((band) => lenses.includes(band.key));
  const marks = density.marks.filter((mark) => lenses.includes(mark.type));

  /*
    Scaled against the peak of what is CURRENTLY SHOWN, not the all-lens peak.

    Isolating one band would otherwise draw it as a sliver at the bottom of a scale set by
    bands that are no longer there, and the whole point of isolating it is to see its
    shape. The axis is unlabelled and comparative, so rescaling misleads nobody.
  */
  const peak = useMemo(() => {
    let max = 0;
    for (let i = 0; i < density.months.length; i++) {
      let total = 0;
      for (const band of shown) total += band.values[i];
      if (total > max) max = total;
    }
    return Math.max(1, max);
  }, [shown, density.months.length]);

  // Stack upwards, so band n is drawn on the shoulders of the ones below it.
  const stacked = useMemo(() => {
    const running = new Array<number>(density.months.length).fill(0);

    return shown.map((band) => {
      const tops = band.values.map((value, i) => {
        running[i] += value;
        return PLOT - (running[i] / peak) * PLOT;
      });

      return { ...band, path: areaPath(tops, PLOT) };
    });
  }, [shown, peak, density.months.length]);

  if (density.months.length === 0) return null;

  const width = density.months.length;
  const pct = (index: number) => (index / Math.max(1, width - 1)) * 100;

  /** Pointer position on the track → the nearest month → the anchor for that year. */
  const travelTo = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return;

    const box = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
    const month = density.months[Math.round(ratio * (width - 1))];
    if (!month) return;

    const target =
      document.getElementById(`year-${month.slice(0, 4)}`) ??
      document.getElementById("timeline-start");

    target?.scrollIntoView({
      behavior: globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    // The class is load-bearing: `globals.css` hides the site StatusBar wherever it
    // appears, which is how the two avoid stacking on the same edge.
    <div className="timeline-scrubber transport chrome">
      <div className="transport-inner">
        <div
          ref={trackRef}
          className="transport-track"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            travelTo(event.clientX);
          }}
          onPointerMove={(event) => {
            // Only while dragging. `buttons` is the reliable test — a pointermove with no
            // button held is just the cursor crossing the control.
            if (event.buttons === 1) travelTo(event.clientX);
          }}
          role="slider"
          tabIndex={0}
          aria-label="Scrub the timeline"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}% through the timeline`}
          onKeyDown={(event) => {
            const step = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
            if (step === 0) return;
            event.preventDefault();
            const box = trackRef.current?.getBoundingClientRect();
            if (box) travelTo(box.left + box.width * (percent / 100) + step * (box.width / width));
          }}
        >
          {/* The curve. Non-uniform scale, so any stroke needs vector-effect or it is
              squashed to nothing horizontally and fattened vertically. */}
          <svg
            className="transport-plot"
            viewBox={`0 0 ${width - 1} ${PLOT}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {stacked.map((band) => (
              <path
                key={band.key}
                d={band.path}
                className="transport-band"
                data-band={band.key}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* Moments, as glyphs rather than one-month slivers that smoothing erases. */}
          {marks.map((mark) => (
            <span
              key={`${mark.type}-${mark.date}-${mark.title}`}
              className="transport-mark"
              data-mark={mark.type}
              style={{ left: `${pct(mark.at)}%`, bottom: `${MARK_ROW[mark.type] ?? 4}px` }}
              title={`${mark.title} · ${mark.date}`}
              aria-hidden
            >
              {MARK_GLYPH[mark.type] ?? "·"}
            </span>
          ))}

          {density.today >= 0 && density.today < width && (
            <span
              className="transport-today"
              style={{ left: `${pct(density.today)}%` }}
              aria-hidden
            />
          )}

          {/* Where the reader is, on the whole span. */}
          <span
            className="transport-window"
            style={{
              left: `${window_.from * 100}%`,
              width: `${Math.max(2, (window_.to - window_.from) * 100)}%`,
            }}
            aria-hidden
          />
        </div>

        {/* Eras, below the line, as the sectors asked for. */}
        <div className="transport-eras" aria-hidden>
          {density.eras.map((era) => (
            <span
              key={era.id}
              className="transport-era"
              style={{
                left: `${pct(era.from)}%`,
                width: `${pct(era.to) - pct(era.from)}%`,
              }}
              title={era.name}
            >
              <span className="transport-era-name">{era.name}</span>
            </span>
          ))}
        </div>

        <div className="transport-years" aria-hidden>
          {density.years.map((year) => (
            <span key={year.year} className="transport-year" style={{ left: `${pct(year.at)}%` }}>
              {year.year}
            </span>
          ))}
        </div>
      </div>

      <div className="transport-side">
        <ul className="transport-legend">
          {stacked.map((band) => (
            <li key={band.key} data-band={band.key}>
              <span className="transport-swatch" aria-hidden />
              {band.label}
            </li>
          ))}
        </ul>

        <output className="transport-readout" aria-label={`${percent}% read`}>
          {String(percent).padStart(2, "0")}%
        </output>

        <button
          type="button"
          className="transport-top"
          onClick={scrollToTop}
          aria-label="Back to the top"
        >
          ↑
        </button>
      </div>

      {/*
        The accessible twin, and the relief the palette validation requires: the light
        theme's bands sit below 3:1 against the surface, which is legal only with visible
        labels or a table. The legend supplies one and this supplies the other.
      */}
      <details className="transport-data rm-hide">
        <summary>Show the numbers</summary>
        <Table density={density} />
      </details>
    </div>
  );
}

/** Year totals rather than 100 months: a table nobody can read is not an alternative. */
function Table({ density }: { density: Density }) {
  const rows = density.years.map((year, index) => {
    const to = index + 1 < density.years.length ? density.years[index + 1].at : density.months.length;
    const totals = density.bands.map((band) => {
      let peak = 0;
      for (let i = year.at; i < to; i++) peak = Math.max(peak, band.values[i]);
      return peak;
    });

    return { year: year.year, totals };
  });

  return (
    <div className="transport-table-scroll">
      <table className="transport-table">
        <caption className="sr-only">
          The most things running at once in each year, by kind
        </caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            {density.bands.map((band) => (
              <th key={band.key} scope="col">
                {band.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year}>
              <th scope="row">{row.year}</th>
              {row.totals.map((total, i) => (
                <td key={density.bands[i].key}>{total}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
