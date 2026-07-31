/*
  Reading a metric written by a human.

  `ProjectMetric.value` is free text from the CMS — "2.4s to 40ms", "0", "~4,000/sec".
  There is no schema behind it and there should not be: forcing an editor to fill in
  {number, unit, direction} to record a result is how a field stops being used.

  So this reads what is there and admits when it cannot. Everything downstream is gated
  on what came back: a figure that parses gets a counting number and a unit set beside
  it, a pair that parses AND shares a dimension gets a comparison bar, and anything else
  is printed exactly as written. **Nothing is inferred.** A bar drawn between two numbers
  that turn out not to be comparable is a lie told confidently, which is the one thing a
  page of engineering claims cannot afford.
*/

/** Units this understands well enough to compare. Everything is normalised to ms. */
const DURATION_IN_MS: Record<string, number> = {
  ms: 1,
  msec: 1,
  s: 1000,
  sec: 1000,
  secs: 1000,
  m: 60_000,
  min: 60_000,
  mins: 60_000,
  h: 3_600_000,
  hr: 3_600_000,
  hrs: 3_600_000,
};

export interface Figure {
  /** Anything before the digits — "~", "<", "+". */
  prefix: string;
  value: number;
  /** Anything after them — "ms", "/sec", "%". */
  unit: string;
  /** Decimal places as written, so 2.4 does not count up as 2. */
  decimals: number;
  /** The original text, for when it has to be shown verbatim. */
  raw: string;
}

/** How many milliseconds this figure is, or null if it is not a duration. */
function asMilliseconds(figure: Figure): number | null {
  const unit = figure.unit.toLowerCase().replace(/[^a-z]/g, "");
  const factor = DURATION_IN_MS[unit];
  return factor === undefined ? null : figure.value * factor;
}

/**
 * Splits one written figure into prefix, number and unit.
 *
 * Returns null rather than guessing when there is no number in it — a metric reading
 * "eliminated" is a perfectly good metric and must survive untouched.
 */
export function parseFigure(text: string): Figure | null {
  const match = text.trim().match(/^([^\d]*?)([\d][\d,]*(?:\.\d+)?)\s*(.*)$/);
  if (!match) return null;

  const [, prefix, digits, unit] = match;
  const cleaned = digits.replace(/,/g, "");
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;

  return {
    prefix: prefix.trim(),
    value,
    unit: unit.trim(),
    decimals: cleaned.includes(".") ? cleaned.split(".")[1].length : 0,
    raw: text.trim(),
  };
}

export interface MetricReading {
  kind: "transition" | "single" | "verbatim";
  from?: Figure;
  to?: Figure;
  /** Present only when both sides are the same dimension and the change is worth naming. */
  factor?: { times: number; direction: "lower" | "higher" };
  raw: string;
}

/** Below this the ratio is noise rather than a result worth putting in display type. */
const WORTH_NAMING = 1.5;

/**
 * Reads a metric value into something a component can lay out.
 *
 * The comparison is offered ONLY when both sides resolve to the same dimension — today
 * that means both are durations. "2.4s to 40ms" compares because seconds and
 * milliseconds are the same thing at different scales. "40ms to 3 incidents" does not,
 * and gets no bar, because the bar would be inventing an axis that does not exist.
 */
export function readMetric(value: string): MetricReading {
  const raw = value.trim();
  const sides = raw.split(/\s+(?:to|→|->)\s+/i);

  if (sides.length === 2) {
    const from = parseFigure(sides[0]);
    const to = parseFigure(sides[1]);

    if (from && to) {
      const fromMs = asMilliseconds(from);
      const toMs = asMilliseconds(to);

      let factor: MetricReading["factor"];
      if (fromMs !== null && toMs !== null && fromMs > 0 && toMs > 0) {
        const times = fromMs > toMs ? fromMs / toMs : toMs / fromMs;
        if (times >= WORTH_NAMING) {
          factor = {
            // One decimal below 10 so 1.8x does not round away to 2x.
            times: times >= 10 ? Math.round(times) : Math.round(times * 10) / 10,
            direction: toMs < fromMs ? "lower" : "higher",
          };
        }
      }

      return { kind: "transition", from, to, factor, raw };
    }
  }

  const single = parseFigure(raw);
  if (single) return { kind: "single", to: single, raw };

  return { kind: "verbatim", raw };
}

/**
 * The two bar lengths for a transition, as fractions of the longer one.
 *
 * Null unless both sides are the same dimension. A bar pair asserts that the two
 * quantities sit on one axis, and that assertion has to be earned.
 */
export function comparisonBars(
  reading: MetricReading,
): { from: number; to: number } | null {
  if (reading.kind !== "transition" || !reading.from || !reading.to) return null;

  const fromMs = asMilliseconds(reading.from);
  const toMs = asMilliseconds(reading.to);
  if (fromMs === null || toMs === null) return null;

  const longest = Math.max(fromMs, toMs);
  if (longest <= 0) return null;

  // A floor of 1.5%, or a sixty-fold improvement leaves the "after" bar invisible and
  // the reader cannot tell it from a bar that failed to render.
  const scale = (n: number) => Math.max(0.015, n / longest);
  return { from: scale(fromMs), to: scale(toMs) };
}
