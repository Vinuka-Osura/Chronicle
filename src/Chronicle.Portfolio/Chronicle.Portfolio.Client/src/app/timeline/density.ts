import type { Timeline, TimelineItem, TimelineItemType } from "@/lib/types";

/*
  ─────────────────────────────────────────────────────────────────────────────────
  The transport's data, and the one idea it rests on:

      AREA MEANS DURATION.  A MARK MEANS A MOMENT.

  The old scrubber bucketed on `item.date` alone and never touched `endDate`. A degree
  running Sep 2019 → Jun 2022 and a role running Jul 2022 → Mar 2024 each contributed a
  single tick to a single year, so thirty-three months of study registered as one mark and
  the chart was 17 unit spikes in 84 empty months — a comb, not a curve.

  Counted as spans, an item is *active* in every month between its start and its end. That
  is what a span already means, so this is more truthful rather than a smoothing trick.

  But a certification has an `IssueDate` and an `EndDate` that is **always null**, and so
  does a roadmap goal. Giving those a nominal width would be inventing duration the data
  does not have, and drawing them as a one-month bar across ~100 buckets makes a 1%-wide
  sliver that vanishes entirely once the curve is smoothed — present in the code, absent on
  the screen. So they are not in the curve at all. They are marks on the axis, where a
  glyph is legible and says something true: a certification is a day, not a season.
  ─────────────────────────────────────────────────────────────────────────────────
*/

/** The three kinds of thing that occupy time, in stacking order, bottom band first. */
export const BANDS = [
  { key: "experience", label: "Roles", glyph: "●" },
  { key: "project", label: "Projects", glyph: "■" },
  { key: "milestone", label: "Life", glyph: "▲" },
] as const;

export type BandKey = (typeof BANDS)[number]["key"];

export interface DensityBand {
  key: BandKey;
  label: string;
  glyph: string;
  /** One value per month: how many items of this kind were running that month. */
  values: number[];
}

export interface DensityMark {
  /** Index into `months`. */
  at: number;
  type: TimelineItemType;
  title: string;
  date: string;
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
  bands: DensityBand[];
  marks: DensityMark[];
  eras: DensityEra[];
  /** Where each calendar year starts, for the axis. */
  years: { year: string; at: number }[];
  /** Month index of today, or -1 when today falls outside the span. */
  today: number;
  /** The tallest stacked total, so the caller can scale without walking it again. */
  peak: number;
}

/** `"2024-03-17"` → months since epoch-year zero. Comparable and subtractable. */
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
 * current" for roles and projects, so an open one runs to today; for a certification it
 * is always null and means nothing at all, so there is nothing to run.
 */
function spanOf(item: TimelineItem, today: string): [number, number] | null {
  if (item.type === "certification" || item.type === "roadmap") {
    return null;
  }

  if (item.endDate) {
    return [monthIndex(item.date), monthIndex(item.endDate)];
  }

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
 * wrong, and this way it can be tested without a browser or a network.
 */
export function buildDensity(timeline: Timeline): Density {
  const { items, eras, today } = timeline;

  if (items.length === 0) {
    return { months: [], bands: [], marks: [], eras: [], years: [], today: -1, peak: 0 };
  }

  // The span has to cover every item's whole life, every era, and today — otherwise the
  // ongoing role that runs past the last start date would be clipped mid-band.
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

  const bands: DensityBand[] = BANDS.map((band) => ({
    ...band,
    values: new Array<number>(count).fill(0),
  }));

  const byKey = new Map(bands.map((band) => [band.key, band]));
  const marks: DensityMark[] = [];

  for (const item of items) {
    const span = spanOf(item, today);

    if (span === null) {
      marks.push({
        at: Math.min(count - 1, Math.max(0, monthIndex(item.date) - first)),
        type: item.type,
        title: item.title,
        date: item.date,
      });
      continue;
    }

    const band = byKey.get(item.type as BandKey);
    if (!band) continue;

    const [start, end] = span;
    for (let m = Math.max(start, first); m <= Math.min(end, last); m++) {
      band.values[m - first] += 1;
    }
  }

  // The stacked total, which is what the y scale has to accommodate.
  let peak = 0;
  for (let i = 0; i < count; i++) {
    let total = 0;
    for (const band of bands) total += band.values[i];
    if (total > peak) peak = total;
  }

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
    bands,
    marks,
    eras: eraSpans,
    years,
    today: monthIndex(today) - first,
    peak,
  };
}
