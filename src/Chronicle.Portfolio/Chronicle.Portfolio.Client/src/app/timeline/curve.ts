/*
  ─────────────────────────────────────────────────────────────────────────────────
  Points to a smooth path.

  The reference for this control is an audio waveform: continuous shapes with soft
  shoulders. A `<polyline>` through ~100 monthly points is visibly faceted, and a step
  interpolation is a histogram wearing a curve's clothes — the difference between those
  and this is most of the look.

  Two things here are not decoration:

  **Centripetal, not uniform.** Uniform Catmull-Rom overshoots and forms cusps wherever
  the input jumps sharply, and this input jumps constantly — a role ending takes a whole
  band down by one in a single month. Centripetal parameterisation (alpha = 0.5) is the
  standard fix and costs one `Math.pow` per point.

  **The zero clamp.** A smooth curve drawn through two adjacent zero months with activity
  either side will dip BELOW the baseline between them. On this chart that renders as
  negative activity — months where less than nothing happened. It is the one artefact of
  smoothing that is a lie rather than a blemish, so the control points are clamped rather
  than the result being masked by an overlay.
  ─────────────────────────────────────────────────────────────────────────────────
*/

/** How far a control point may reach, as a fraction of the gap. Higher is looser. */
const TENSION = 0.32;

/**
 * The open curve through `values`, x being the index.
 *
 * `floor` is the baseline. Control points are held inside the band between it and zero, so
 * the line can neither dip under its own axis nor overshoot the top of the plot.
 */
export function smoothPath(values: number[], floor: number): string {
  if (values.length === 0) return "";
  if (values.length === 1) return `M 0,${values[0]}`;

  // Clamped so the first and last segments have a neighbour to look at rather than
  // falling back to a straight line and kinking at the ends.
  const at = (i: number) => values[Math.min(values.length - 1, Math.max(0, i))];

  /*
    Both ends, and both matter.

    Under the floor is a line dipping beneath its own baseline — activity below nothing.
    Over the top is the same error mirrored: a shoulder rising past the tallest month,
    claiming a peak that never happened and, since the plot is only as tall as its own
    viewBox, spilling out of the control and over whatever is above it. Measured at 34
    units tall, an unclamped curve reached -1.6.
  */
  const lo = Math.min(0, floor);
  const hi = Math.max(0, floor);
  const hold = (y: number) => Math.max(lo, Math.min(hi, y));

  let d = `M 0,${round(values[0])}`;

  for (let i = 0; i < values.length - 1; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);

    /*
      Centripetal weighting: a segment whose neighbours are far away in VALUE gets shorter
      control arms, which is exactly what stops a tall spike from throwing a loop. The
      x-distance is always 1 here, so the chord length reduces to this.
    */
    const d1 = Math.pow(Math.hypot(1, p1 - p0), 0.5) || 1;
    const d2 = Math.pow(Math.hypot(1, p2 - p1), 0.5) || 1;
    const d3 = Math.pow(Math.hypot(1, p3 - p2), 0.5) || 1;

    const c1x = i + (TENSION * d2) / (d1 + d2) + TENSION;
    const c1y = p1 + ((p2 - p0) * TENSION * d2) / (d1 + d2);

    const c2x = i + 1 - (TENSION * d2) / (d2 + d3) - TENSION;
    const c2y = p2 - ((p3 - p1) * TENSION * d2) / (d2 + d3);

    d +=
      ` C ${round(c1x)},${round(hold(c1y))}` +
      ` ${round(c2x)},${round(hold(c2y))}` +
      ` ${i + 1},${round(p2)}`;
  }

  return d;
}

/** Two decimals is well under a device pixel at this scale, and halves the path string. */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}
