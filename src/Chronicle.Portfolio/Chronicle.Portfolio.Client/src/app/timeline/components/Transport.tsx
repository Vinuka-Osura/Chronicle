"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { scrollToOffset, scrollToTop } from "@/lib/scroll";
import type { Timeline } from "@/lib/types";
import { smoothPath } from "../curve";
import { buildDensity, type Density } from "../density";
import { useActiveLenses } from "../useActiveLenses";

/** Height of the plot, in the units the paths are built in. */
const PLOT = 40;

/** Where a year marker sits relative to the top of the viewport once scrolled to. */
const HEADER = 96;

/** A known (month, scroll offset) pair, used to map the page onto the time axis. */
interface Anchor {
  month: number;
  top: number;
}

/**
 * Drop points that would land closer together than `gap` months.
 *
 * Keeps the first of any cluster rather than the densest or the last, so which marks
 * survive is stable as the reader filters — a mark that moved every time a lens changed
 * would read as the data changing.
 */
function thin<T extends { at: number }>(points: T[], gap: number): T[] {
  const kept: T[] = [];
  let previous = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    if (point.at - previous < gap) continue;
    kept.push(point);
    previous = point.at;
  }

  return kept;
}

/**
 * The whole career as five curves, and the control for moving through it.
 *
 * ── Why five lines rather than one stacked area ────────────────────────────────────
 *
 * The first build stacked three bands. Stacking answers "how much in total", and reading
 * one kind out of it means subtracting the layers underneath by eye — every band above the
 * first sits on a moving floor, so its shape is distorted by its neighbours'. Overlaid
 * lines all sit on the same zero, so "when was I studying" is a question you answer by
 * looking. The totals still exist, in the table under `Show the numbers`.
 *
 * ── Why the playhead maps through the year markers ─────────────────────────────────
 *
 * A dot placed at `scrollY / scrollHeight` would be continuous but wrong: the page is not
 * linear in time, so the dot would sit over 2023 while the reader was looking at 2021. A
 * dot placed by the nearest section would be right but would jump. Measuring where each
 * year heading actually is and interpolating between them is continuous AND correct, and
 * the same function run backwards is what dragging uses — so the two directions cannot
 * disagree about where "here" is.
 */
export function Transport({ timeline }: { timeline: Timeline }) {
  const density = useMemo(() => buildDensity(timeline), [timeline]);
  const clipId = useId();

  const [percent, setPercent] = useState(0);
  /** Fractional month index under the playhead. */
  const [head, setHead] = useState(0);
  const [dragging, setDragging] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const anchors = useRef<Anchor[]>([]);

  /*
    The same subscription the context bar reads from, so the chips, the cards and this
    chart cannot disagree about what is showing.

    Not a `useState` filled by an effect, which is what this was first: on the server that
    leaves the array empty, so the HTML shipped with no lines at all and the whole chart
    appeared only after hydration. `useActiveLenses` answers "all of them" on the server,
    which is both the documented default and what a reader without JavaScript should see.
  */
  const lenses: string[] = useActiveLenses();

  const width = density.months.length;
  const lastMonth = Math.max(1, width - 1);

  /*
    Rebuild the scroll↔month map.

    Re-measured on resize AND on a lens change, not just on mount: filtering hides cards,
    which changes every year heading's offset. A map measured once would put the playhead
    further from the truth the more the reader filtered.
  */
  const remeasure = useCallback(() => {
    const found: Anchor[] = [];

    for (const year of density.years) {
      const el = document.querySelector<HTMLElement>(`[data-year-marker="${year.year}"]`);
      if (!el || el.offsetParent === null) continue;
      found.push({
        month: year.at,
        top: el.getBoundingClientRect().top + globalThis.scrollY - HEADER,
      });
    }

    const max = Math.max(1, document.documentElement.scrollHeight - globalThis.innerHeight);

    // Bookends, so the run-up before the first year and the tail after the last map to
    // time as well. Without them the dot would sit still through the whole header.
    const bounded: Anchor[] = [{ month: 0, top: 0 }];

    for (const a of found) {
      const previous = bounded[bounded.length - 1];
      // Strictly increasing on both axes, or the interpolation divides by zero and its
      // inverse stops being a function.
      if (a.top > previous.top && a.month > previous.month) bounded.push(a);
    }

    const tail = bounded[bounded.length - 1];
    if (max > tail.top && lastMonth > tail.month) bounded.push({ month: lastMonth, top: max });

    anchors.current = bounded;
  }, [density.years, lastMonth]);

  /** Scroll offset → fractional month, interpolated between measured anchors. */
  const monthAt = useCallback((top: number) => {
    const list = anchors.current;
    if (list.length < 2) return 0;

    for (let i = 1; i < list.length; i++) {
      if (top <= list[i].top) {
        const a = list[i - 1];
        const b = list[i];
        return a.month + ((top - a.top) / (b.top - a.top)) * (b.month - a.month);
      }
    }

    return list[list.length - 1].month;
  }, []);

  /** The inverse: fractional month → scroll offset. */
  const offsetAt = useCallback((month: number) => {
    const list = anchors.current;
    if (list.length < 2) return 0;

    for (let i = 1; i < list.length; i++) {
      if (month <= list[i].month) {
        const a = list[i - 1];
        const b = list[i];
        return a.top + ((month - a.month) / (b.month - a.month)) * (b.top - a.top);
      }
    }

    return list[list.length - 1].top;
  }, []);

  /*
    Where the reader is, recomputed on every frame the page moves.

    rAF-throttled rather than debounced: the dot has to track the scroll as it happens, so
    coalescing to one update per frame is exactly right and waiting for the scroll to end
    would be exactly wrong. The control this replaced called setState on every scroll
    event, which on a page this long is hundreds of renders during one flick.
  */
  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;

      const total = document.documentElement.scrollHeight - globalThis.innerHeight;
      const y = globalThis.scrollY;

      setPercent(total > 0 ? Math.round(Math.min(1, Math.max(0, y / total)) * 100) : 0);
      setHead(monthAt(y));
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    const onResize = () => {
      remeasure();
      onScroll();
    };

    remeasure();
    measure();

    globalThis.addEventListener("scroll", onScroll, { passive: true });
    globalThis.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      globalThis.removeEventListener("scroll", onScroll);
      globalThis.removeEventListener("resize", onResize);
    };
  }, [monthAt, remeasure]);

  // A lens change re-lays-out the stream beneath, so the map has to be rebuilt. One frame
  // later, because the CSS that hides the cards has not applied when this effect runs.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      remeasure();
      setHead(monthAt(globalThis.scrollY));
    });
    return () => cancelAnimationFrame(id);
  }, [lenses, monthAt, remeasure]);

  const shown = useMemo(
    () => density.series.filter((s) => lenses.includes(s.key)),
    [density.series, lenses],
  );

  /*
    Scaled against the peak of what is CURRENTLY SHOWN, not the all-lens peak.

    Isolating one kind would otherwise draw it as a flat line at the bottom of a scale set
    by series that are no longer there, and the whole point of isolating it is to see its
    shape. The axis is unlabelled and comparative, so rescaling misleads nobody — and the
    table carries the actual numbers.
  */
  const peak = useMemo(() => {
    let max = 0;
    for (const s of shown) for (const v of s.values) if (v > max) max = v;
    return Math.max(1, max);
  }, [shown]);

  /** Value → y in viewBox units, with headroom so the tallest line is not clipped. */
  const yOf = useCallback((value: number) => PLOT - 2 - (value / peak) * (PLOT - 4), [peak]);

  const lines = useMemo(
    () => shown.map((s) => ({ ...s, d: smoothPath(s.values.map(yOf), PLOT - 2) })),
    [shown, yOf],
  );

  /*
    How many years actually get a label.

    The control's WIDTH is fixed — `max-w-6xl`, the page container — so it can never grow
    longer as content is added. What grows is the number of things competing for that
    width, and the year row is the first to break: a four-digit label at this size needs
    roughly 45px of room, so about a dozen fit. Nine years fit comfortably; seventy would
    be a grey smear, and nothing in the data model stops someone entering a goal for 2090.

    So the step is chosen from the span rather than fixed, and it snaps to round multiples
    — 2020, 2030, 2040 reads as an axis; 2021, 2031, 2041 reads as an accident. Every
    month still occupies the same width whether it is labelled or not, so the shape of the
    curves is untouched by this.
  */
  const yearStep = (() => {
    for (const step of [1, 2, 5, 10, 20, 25, 50]) {
      if (Math.ceil(density.years.length / step) <= 12) return step;
    }
    return 100;
  })();

  const labelledYears =
    yearStep === 1
      ? density.years
      : density.years.filter((y) => Number(y.year) % yearStep === 0);

  if (width === 0) return null;

  const pct = (index: number) => (index / lastMonth) * 100;
  const headPct = Math.min(100, Math.max(0, pct(head)));

  /** Pointer x on the track → the month under it → the page offset for that month. */
  const scrubTo = (clientX: number, immediate: boolean) => {
    const track = trackRef.current;
    if (!track) return;

    const box = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));

    scrollToOffset(offsetAt(ratio * lastMonth), immediate);
  };

  return (
    // `timeline-scrubber` is load-bearing: `globals.css` hides the site StatusBar
    // wherever it appears, which is how the two avoid stacking on the same edge.
    //
    // `chrome` is on the INNER card, not this strip: the strip spans the viewport and
    // must stay transparent and click-through, or it would paint a full-width slab and
    // swallow every click along the bottom of the page.
    <div className="timeline-scrubber transport">
      <div className="transport-inner chrome">
        {/*
          Legend, position and back-to-top sit ABOVE the plot. Beside it they competed with
          the years for the same horizontal space and squeezed the chart into two thirds of
          the control; the percentage in particular was hard to find at the far right.
        */}
        <div className="transport-head">
          <ul className="transport-legend">
            {lines.map((line) => (
              <li key={line.key} data-series={line.key}>
                <span className="transport-swatch" aria-hidden>
                  {line.glyph}
                </span>
                {line.label}
              </li>
            ))}
          </ul>

          {/*
            The accessible twin, and the relief the palette validation requires: the
            light theme's orange sits below 3:1 against the surface, which is legal only
            with visible labels or a table. The legend is one and this is the other — so
            it belongs in the head row where it can be found, not floating above the
            control as grey caption-shaped text.
          */}
          <details className="transport-data">
            <summary>Show the numbers</summary>
            <Table density={density} />
          </details>

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

        <div
          ref={trackRef}
          className="transport-track"
          data-dragging={dragging || undefined}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            scrubTo(event.clientX, true);
          }}
          onPointerMove={(event) => {
            // `buttons` rather than a captured flag: a pointermove with no button held is
            // just the cursor crossing the control, and must not drag the page with it.
            if (event.buttons === 1) scrubTo(event.clientX, true);
          }}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          role="slider"
          tabIndex={0}
          aria-label="Scrub the timeline"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${density.months[Math.round(head)] ?? density.months[0]}, ${percent}% through`}
          onKeyDown={(event) => {
            const step = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
            if (step === 0) return;
            event.preventDefault();
            // One month a press, so holding the key walks the axis at a readable rate.
            scrollToOffset(offsetAt(Math.min(lastMonth, Math.max(0, head + step))), false);
          }}
        >
          {/* Non-uniform scale, so every stroke needs vector-effect or it is squashed to
              nothing horizontally and fattened vertically. */}
          <svg
            className="transport-plot"
            viewBox={`0 0 ${lastMonth} ${PLOT}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              {/* Everything behind the playhead is "played", as on a music player: what
                  you have scrolled past is lit, what is ahead of you is dim. */}
              <clipPath id={`played-${clipId}`} clipPathUnits="userSpaceOnUse">
                <rect x="0" y="0" width={Math.max(0.001, head)} height={PLOT} />
              </clipPath>
            </defs>

            {lines.map((line) => (
              <path
                key={line.key}
                d={line.d}
                className="transport-line"
                data-series={line.key}
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <g clipPath={`url(#played-${clipId})`}>
              {lines.map((line) => (
                <path
                  key={line.key}
                  d={line.d}
                  className="transport-line is-played"
                  data-series={line.key}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          </svg>

          {/*
            Markers as HTML rather than SVG shapes: `preserveAspectRatio="none"` stretches
            the viewBox horizontally by a factor of thirty here, which would turn a circle
            into a lens and a square into a letterbox.
          */}
          {lines.map((line) =>
            /*
              Thinned so glyphs cannot pile on top of one another.

              A mark is about 7px wide; the control is a fixed width, so the months per
              pixel rises with the span. Past roughly a mark every 9px they stop being
              separate shapes and become a smear — which costs more than the marks they
              drop, because the point of drawing them as shapes rather than dots is that
              a reader who cannot separate the colours can still separate the glyphs.

              The line itself is unthinned: every month is still plotted, so the curve is
              the whole data whatever the axis does. Only the labels on it are rationed.
            */
            thin(line.points, Math.max(1, lastMonth / 128)).map((point) => (
              <span
                key={`${line.key}-${point.date}-${point.title}`}
                className="transport-point"
                data-series={line.key}
                data-played={point.at <= head || undefined}
                style={{
                  left: `${pct(point.at)}%`,
                  bottom: `${((PLOT - yOf(line.values[point.at])) / PLOT) * 100}%`,
                }}
                title={`${line.label} · ${point.title} · ${point.date}`}
                aria-hidden
              >
                {line.glyph}
              </span>
            )),
          )}

          {density.today >= 0 && density.today < width && (
            <span
              className="transport-today"
              style={{ left: `${pct(density.today)}%` }}
              aria-hidden
            />
          )}

          <span className="transport-playhead" style={{ left: `${headPct}%` }} aria-hidden>
            <span className="transport-dot" />
          </span>
        </div>

        {/*
          Eras, below the line, as the sectors asked for.

          A sector narrower than about a twelfth of the axis gets its boundary rule but no
          name. Six characters of a chapter title, cut mid-word, tells a reader less than
          the tick alone does — and as more eras are added the axis divides further, so
          this is the row that degrades next after the years. The name stays on the
          element's title, so it is still reachable by pointer.
        */}
        <div className="transport-eras" aria-hidden>
          {density.eras.map((era) => {
            const span = pct(era.to) - pct(era.from);

            return (
              <span
                key={era.id}
                className="transport-era"
                style={{ left: `${pct(era.from)}%`, width: `${span}%` }}
                title={era.name}
              >
                {span >= 8 && <span className="transport-era-name">{era.name}</span>}
              </span>
            );
          })}
        </div>

        <div className="transport-years" aria-hidden>
          {labelledYears.map((year) => (
            <span key={year.year} className="transport-year" style={{ left: `${pct(year.at)}%` }}>
              {year.year}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}

/** Year totals rather than a hundred months: a table nobody can read is not an alternative. */
function Table({ density }: { density: Density }) {
  const rows = density.years.map((year, index) => {
    const to =
      index + 1 < density.years.length ? density.years[index + 1].at : density.months.length;

    const totals = density.series.map((s) => {
      let most = 0;
      for (let i = year.at; i < to; i++) most = Math.max(most, s.values[i]);
      return most;
    });

    return { year: year.year, totals };
  });

  return (
    <div className="transport-table-scroll">
      <table className="transport-table">
        <caption className="sr-only">The most of each kind running at once, by year</caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            {density.series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year}>
              <th scope="row">{row.year}</th>
              {row.totals.map((total, i) => (
                <td key={density.series[i].key}>{total}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
