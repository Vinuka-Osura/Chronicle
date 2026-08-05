import type { Timeline, TimelineItem, TimelineItemType } from "@/lib/types";

/*
  ─────────────────────────────────────────────────────────────────────────────────
  The transport's data: five series on one month axis.

  Each kind of thing gets its OWN line, marked at the dates it actually happened and
  smoothed between them. Five lines that share an axis, not one shape cut into layers.

  This replaced a stacked area, and the reason is worth keeping. Stacking answers "how
  much was going on in total", and to read one band out of it you have to subtract the
  ones underneath by eye — every layer above the first sits on a moving floor, so its
  shape is distorted by its neighbours' shape. Overlaid lines each sit on the same zero.
  "When was I studying" is then a question you can answer by looking, which is the whole
  point of putting five kinds on one axis.

  A stacked total is still the more honest form for "how busy was I" — but that question
  is not what the lenses ask. The table under `Show the numbers` carries the totals.

  ── Spans and moments ──────────────────────────────────────────────────────────────

  An item with an end date is *active* in every month between its start and its end. A
  degree running Sep 2019 → Jun 2022 contributes 33 months, not one tick. Nothing on this
  page used `endDate` before, so 17 items rendered as 17 unit spikes in 84 empty months.

  A certification's `EndDate` is always null and means nothing; a roadmap goal's target
  date is a point by definition. Those count in the month they happened and nowhere else.
  Their lines are therefore mostly flat with peaks at real dates — which is exactly what a
  line through marked moments should look like, and is why they can share the axis with
  the span kinds without either having to pretend to be the other.
  ─────────────────────────────────────────────────────────────────────────────────
*/

/** Every kind, in lens order. Glyphs match `lenses.ts`, and are the secondary encoding. */
export const SERIES = [
  { key: "experience", label: "Roles", glyph: "●" },
  { key: "project", label: "Projects", glyph: "■" },
  { key: "milestone", label: "Life", glyph: "▲" },
  { key: "certification", label: "Certifications", glyph: "◆" },
  { key: "roadmap", label: "Goals", glyph: "○" },
] as const;

export type SeriesKey = (typeof SERIES)[number]["key"];

/** A real item, at the month it happened — the "mark" the curve is drawn through. */
export interface DensityPoint {
  /** Index into `months`. */
  at: number;
  title: string;
  date: string;
}

export interface DensitySeries {
  key: SeriesKey;
  label: string;
  glyph: string;
  /** One value per month: how many of this kind were running, or began, that month. */
  values: number[];
  /** The dated items themselves, so the line can be marked where the data really is. */
  points: DensityPoint[];
}

export interface DensityEra {
  id: string;
  name: string;
  /** Inclusive month indices. */
  from: number;
  to: number;
}

export interface Density {
  /** `"2019-09"`, one per month across the whole span. */
  months: string[];
  series: DensitySeries[];
  eras: DensityEra[];
  /** Where each calendar year starts, for the axis. */
  years: { year: string; at: number }[];
  /** Month index of today, or -1 when today falls outside the span. */
  today: number;
}

/** `"2024-03-17"` → months since year zero. Comparable and subtractable. */
function monthIndex(iso: string): number {
  return Number(iso.slice(0, 4)) * 12 + (Number(iso.slice(5, 7)) - 1);
}

function monthLabel(index: number): string {
  const year = Math.floor(index / 12);
  const month = index % 12;
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * Does this item occupy time, or is it a moment?
 *
 * Read off the schema rather than special-cased. `endDate` is documented as "null means
 * current" for roles and projects, so an open one runs to today. For a certification it is
 * always null and means nothing at all, so there is nothing to run.
 */
function spanOf(item: TimelineItem, today: string): [number, number] | null {
  if (item.type === "certification" || item.type === "roadmap") return null;

  if (item.endDate) return [monthIndex(item.date), monthIndex(item.endDate)];

  // A role or project with no end is ongoing. A milestone with no end is a single day —
  // graduating is a period, giving a talk is not.
  if (item.type === "experience" || item.type === "project") {
    return [monthIndex(item.date), monthIndex(today)];
  }

  return null;
}

/**
 * Everything the transport draws, in one pass.
 *
 * Pure and side-effect free on purpose: the bucketing is the part most likely to be subtly
 * wrong, and this way it can be checked without a browser or a network.
 */
export function buildDensity(timeline: Timeline): Density {
  const { items, eras, today } = timeline;

  if (items.length === 0) {
    return { months: [], series: [], eras: [], years: [], today: -1 };
  }

  // The span has to cover every item's whole life, every era, and today — otherwise the
  // ongoing role that runs past the last start date would be clipped mid-line.
  let first = Infinity;
  let last = -Infinity;

  const consider = (iso: string) => {
    const m = monthIndex(iso);
    if (m < first) first = m;
    if (m > last) last = m;
  };

  for (const item of items) {
    consider(item.date);
    if (item.endDate) consider(item.endDate);
  }
  for (const era of eras) {
    consider(era.startDate);
    if (era.endDate) consider(era.endDate);
  }
  consider(today);

  const count = last - first + 1;
  const months = Array.from({ length: count }, (_, i) => monthLabel(first + i));

  const series: DensitySeries[] = SERIES.map((s) => ({
    ...s,
    values: new Array<number>(count).fill(0),
    points: [],
  }));

  const byKey = new Map(series.map((s) => [s.key as TimelineItemType, s]));

  for (const item of items) {
    const line = byKey.get(item.type);
    if (!line) continue;

    const clamp = (m: number) => Math.min(count - 1, Math.max(0, m - first));
    const at = clamp(monthIndex(item.date));

    line.points.push({ at, title: item.title, date: item.date });

    const span = spanOf(item, today);

    if (span === null) {
      // A moment: it counts in its own month and nowhere else.
      line.values[at] += 1;
      continue;
    }

    const [start, end] = span;
    for (let m = Math.max(start, first); m <= Math.min(end, last); m++) {
      line.values[m - first] += 1;
    }
  }

  for (const line of series) line.points.sort((a, b) => a.at - b.at);

  const eraSpans: DensityEra[] = eras
    .map((era) => ({
      id: era.id,
      name: era.name,
      from: Math.max(0, monthIndex(era.startDate) - first),
      to: era.endDate ? Math.min(count - 1, monthIndex(era.endDate) - first) : count - 1,
    }))
    .filter((era) => era.to >= era.from)
    .sort((a, b) => a.from - b.from);

  const years: { year: string; at: number }[] = [];
  for (let i = 0; i < count; i++) {
    const year = months[i].slice(0, 4);
    if (i === 0 || year !== months[i - 1].slice(0, 4)) {
      years.push({ year, at: i });
    }
  }

  return {
    months,
    series,
    eras: eraSpans,
    years,
    today: monthIndex(today) - first,
  };
}
