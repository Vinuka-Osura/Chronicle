"use client";

import { useMemo, useState } from "react";
import type { ContributionDay } from "@/lib/types";

const CELL = 13;
const GAP = 3;
const PITCH = CELL + GAP;
const ROWS = 7;
const LEFT_GUTTER = 30; // weekday labels
const TOP_GUTTER = 18; // month labels

/** Rows 1, 3 and 5. Labelling all seven crowds the gutter and none of them get read. */
const WEEKDAY_LABELS: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface Cell {
  date: Date;
  count: number;
  level: number;
  column: number;
  row: number;
}

/**
 * A year of contributions as a magnitude grid.
 *
 * Sequential, one hue, light to dark — the cells encode *how much*, not *which*, so a
 * categorical palette would invent categories the data does not have. The ramp is
 * derived in OKLCH at even lightness steps and validated (monotone lightness, adjacent
 * dL >= 0.06, single hue, light end clearing 2:1 on the surface) rather than picked by
 * eye; the steps live in `globals.css` as `--color-heat-*` so dark mode gets its own
 * ramp chosen against the dark surface instead of an automatic flip.
 */
export function ContributionHeatmap({
  calendar,
  total,
}: {
  calendar: ContributionDay[];
  total: number;
}) {
  const [hovered, setHovered] = useState<Cell | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { cells, columns, monthLabels, thresholds } = useMemo(
    () => layout(calendar),
    [calendar],
  );

  if (cells.length === 0) {
    return null;
  }

  const width = LEFT_GUTTER + columns * PITCH;
  const height = TOP_GUTTER + ROWS * PITCH;

  const from = cells[0].date;
  const to = cells[cells.length - 1].date;

  return (
    <section aria-labelledby="heatmap-heading">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 id="heatmap-heading" className="font-display text-lg font-semibold">
            {total.toLocaleString("en-GB")} contributions
          </h2>
          <p className="text-sm text-ink-soft">
            {formatDay(from)} to {formatDay(to)}
          </p>
        </div>

        {/*
          The table is the accessible twin, not a nicety. The grid's values are only
          otherwise reachable by hovering, and a value you can only get with a mouse is
          a value some readers cannot get at all.
        */}
        <button
          type="button"
          onClick={() => setShowTable((open) => !open)}
          aria-expanded={showTable}
          className="rounded-md border border-rule px-2.5 py-1 text-xs text-ink-soft transition-colors hover:border-signal hover:text-signal"
        >
          {showTable ? "Hide monthly totals" : "Show monthly totals"}
        </button>
      </div>

      {/* Wide content scrolls inside its own container; the page body never scrolls sideways. */}
      <div className="relative overflow-x-auto pb-1">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`Contribution heatmap: ${total.toLocaleString("en-GB")} contributions between ${formatDay(from)} and ${formatDay(to)}. Monthly totals are available as a table.`}
          className="block"
          onMouseLeave={() => setHovered(null)}
        >
          {monthLabels.map((label) => (
            <text
              key={`${label.month}-${label.column}`}
              x={LEFT_GUTTER + label.column * PITCH}
              y={11}
              // ink-soft, not ink-faint: at 10px these are small text, and the faint
              // token clears 3:1 on the light surface but not the 4.5:1 text bar.
              className="fill-ink-soft font-mono text-[10px]"
            >
              {MONTHS[label.month]}
            </text>
          ))}

          {Object.entries(WEEKDAY_LABELS).map(([row, label]) => (
            <text
              key={label}
              x={0}
              y={TOP_GUTTER + Number(row) * PITCH + CELL - 3}
              // ink-soft, not ink-faint: at 10px these are small text, and the faint
              // token clears 3:1 on the light surface but not the 4.5:1 text bar.
              className="fill-ink-soft font-mono text-[10px]"
            >
              {label}
            </text>
          ))}

          {cells.map((cell) => (
            <rect
              key={cell.date.toISOString()}
              x={LEFT_GUTTER + cell.column * PITCH}
              y={TOP_GUTTER + cell.row * PITCH}
              width={CELL}
              height={CELL}
              rx={2}
              fill={`var(--color-heat-${cell.level})`}
              // The 3px gap belongs to the hit area, so the pointer does not have to
              // land dead-centre on a 13px square.
              stroke="transparent"
              strokeWidth={GAP}
              onMouseEnter={() => setHovered(cell)}
            />
          ))}
        </svg>

        {hovered && (
          <div
            // Hidden from assistive technology on purpose. Announcing on every cell the
            // pointer crosses is a stream of noise, and the monthly table is the route
            // to these values that does not need a mouse.
            aria-hidden
            className="pointer-events-none absolute z-10 rounded-md border border-rule bg-paper-raised px-2.5 py-1.5 text-xs whitespace-nowrap shadow-sm"
            style={{
              left: LEFT_GUTTER + hovered.column * PITCH,
              top: TOP_GUTTER + hovered.row * PITCH + CELL + 6,
            }}
          >
            <span className="font-medium text-ink">
              {hovered.count === 0
                ? "No contributions"
                : `${hovered.count} contribution${hovered.count === 1 ? "" : "s"}`}
            </span>
            <span className="text-ink-faint"> · {formatDay(hovered.date)}</span>
          </div>
        )}
      </div>

      <ScaleLegend thresholds={thresholds} />

      {showTable && <MonthlyTable cells={cells} />}
    </section>
  );
}

/**
 * A binned continuous scale needs its key, or the darkest cell means nothing. The
 * thresholds are shown because they are computed from this account's own distribution
 * rather than fixed, so "darkest" means something different for a quiet year.
 */
function ScaleLegend({ thresholds }: { thresholds: number[] }) {
  return (
    <div className="mt-2.5 flex items-center gap-2 text-xs text-ink-faint">
      <span>Less</span>
      <div className="flex gap-[3px]">
        {[0, 1, 2, 3, 4].map((level) => (
          <span
            key={level}
            title={
              level === 0
                ? "No contributions"
                : level === 4
                  ? `${thresholds[2] + 1} or more`
                  : `${level === 1 ? 1 : thresholds[level - 2] + 1} to ${thresholds[level - 1]}`
            }
            className="h-[13px] w-[13px] rounded-[2px]"
            style={{ background: `var(--color-heat-${level})` }}
          />
        ))}
      </div>
      <span>More</span>
    </div>
  );
}

function MonthlyTable({ cells }: { cells: Cell[] }) {
  const months = new Map<string, { label: string; total: number; days: number }>();

  for (const cell of cells) {
    const key = `${cell.date.getUTCFullYear()}-${cell.date.getUTCMonth()}`;
    const entry = months.get(key) ?? {
      label: `${MONTHS[cell.date.getUTCMonth()]} ${cell.date.getUTCFullYear()}`,
      total: 0,
      days: 0,
    };

    entry.total += cell.count;
    entry.days += cell.count > 0 ? 1 : 0;
    months.set(key, entry);
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="mb-2 text-left text-xs text-ink-faint">
          Monthly totals. Individual days are named on hover in the grid above.
        </caption>
        <thead>
          <tr className="border-b border-rule text-left font-mono text-[0.65rem] tracking-[0.1em] text-ink-faint uppercase">
            <th scope="col" className="py-1.5 font-normal">
              Month
            </th>
            <th scope="col" className="py-1.5 text-right font-normal">
              Contributions
            </th>
            <th scope="col" className="py-1.5 text-right font-normal">
              Active days
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {[...months.values()].map((month) => (
            <tr key={month.label} className="border-b border-rule/60">
              <th scope="row" className="py-1.5 font-normal text-ink">
                {month.label}
              </th>
              <td className="py-1.5 text-right text-ink-soft">{month.total}</td>
              <td className="py-1.5 text-right text-ink-soft">{month.days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Places every day on the grid and buckets it into one of four levels.
 *
 * The thresholds are quartiles of this account's own non-zero days rather than fixed
 * numbers. Fixed thresholds flatter an active account and make a quiet one a single
 * uniform shade; quartiles give both a readable spread of the year they actually had.
 */
function layout(calendar: ContributionDay[]) {
  const days = calendar
    .map((day) => ({ date: new Date(`${day.date}T00:00:00Z`), count: day.count }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (days.length === 0) {
    return { cells: [] as Cell[], columns: 0, monthLabels: [], thresholds: [0, 0, 0] };
  }

  const active = days
    .map((day) => day.count)
    .filter((count) => count > 0)
    .sort((a, b) => a - b);

  const quartile = (fraction: number) =>
    active.length === 0 ? 0 : active[Math.floor((active.length - 1) * fraction)];

  const thresholds = [quartile(0.25), quartile(0.5), quartile(0.75)];

  const level = (count: number) => {
    if (count === 0) return 0;
    if (count <= thresholds[0]) return 1;
    if (count <= thresholds[1]) return 2;
    if (count <= thresholds[2]) return 3;
    return 4;
  };

  // Column 0 is the week containing the first day, so a year that starts mid-week
  // leaves the leading cells empty rather than shifting every date by a few days.
  const first = days[0].date;
  const origin = new Date(first);
  origin.setUTCDate(first.getUTCDate() - first.getUTCDay());

  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

  const cells: Cell[] = days.map((day) => ({
    date: day.date,
    count: day.count,
    level: level(day.count),
    column: Math.floor((day.date.getTime() - origin.getTime()) / MS_PER_WEEK),
    row: day.date.getUTCDay(),
  }));

  const columns = cells[cells.length - 1].column + 1;

  // One label per month, at the column where that month first appears.
  const monthLabels: { month: number; column: number }[] = [];
  let previousMonth = -1;

  for (const cell of cells) {
    const month = cell.date.getUTCMonth();
    if (month !== previousMonth) {
      // Skip a label that would be clipped by the right edge rather than crop it.
      if (cell.column <= columns - 3) {
        monthLabels.push({ month, column: cell.column });
      }
      previousMonth = month;
    }
  }

  return { cells, columns, monthLabels, thresholds };
}

function formatDay(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
