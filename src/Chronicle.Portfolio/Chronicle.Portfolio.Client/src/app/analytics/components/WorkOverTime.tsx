import type { Week } from "@/lib/types";

function monthLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    month: "short",
    timeZone: "UTC",
  });
}

function fullDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The year as a shape: one bar per week, with a four-week trailing mean drawn over it.
 *
 * **Why weeks and not days.** The heatmap beside this already shows the daily grain, and
 * 365 bars is texture rather than a trend. A week is the smallest bucket in which "a busy
 * fortnight" and "a quiet month" are visible at a glance.
 *
 * **Why a mean line at all.** Weekly totals from one person are spiky — a week off drops
 * to zero and reads as a collapse. The trailing mean is what separates the trend from the
 * noise, and it is deliberately drawn *over* the bars rather than replacing them, so the
 * raw weeks stay visible and the smoothing cannot hide anything.
 *
 * The mean starts at week four. Averaging a window that is not yet full would draw a line
 * that is just the first week wearing a disguise.
 *
 * Bars carry the value; nothing is encoded in colour alone, and every bar has a title with
 * its exact figure. The axis starts at zero — a bar chart that does not is a lie about
 * proportion.
 */
export function WorkOverTime({ weeks }: { weeks: Week[] }) {
  if (weeks.length === 0) return null;

  const peak = Math.max(...weeks.map((week) => week.total), 1);
  const total = weeks.reduce((sum, week) => sum + week.total, 0);

  // A viewBox in week-units, so the geometry does not care how many weeks arrived.
  const width = weeks.length;
  const height = 40;

  const meanPoints = weeks
    .map((week, index) =>
      week.mean === null
        ? null
        : `${index + 0.5},${height - (week.mean / peak) * height}`,
    )
    .filter((point): point is string => point !== null);

  return (
    <figure className="chart">
      <figcaption className="chart-head">
        <h3 className="chart-title">The year, week by week</h3>
        <p className="chart-note">
          {total.toLocaleString("en-GB")} contributions across {weeks.length} weeks. The
          line is a four-week trailing mean, so a fortnight off reads as a dip rather than
          a collapse.
        </p>
      </figcaption>

      <div className="chart-plot">
        {/* The bars are real elements rather than SVG rects so each one can carry its own
            title and its own scroll-driven grow. */}
        <div className="week-bars" data-stagger-bars>
          {weeks.map((week, index) => (
            <span
              key={week.weekStart}
              className="week-bar"
              style={
                {
                  "--h": `${(week.total / peak) * 100}%`,
                  "--i": index,
                } as React.CSSProperties
              }
              title={`Week of ${fullDate(week.weekStart)}: ${week.total} contribution${week.total === 1 ? "" : "s"}`}
            >
              <span className="week-bar-fill" />
            </span>
          ))}
        </div>

        {meanPoints.length > 1 && (
          <svg
            className="week-mean"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            {/* pathLength normalises the line to one unit, so the draw-on animation in
                analytics.css can dash it without knowing how many weeks it spans. */}
            <polyline
              points={meanPoints.join(" ")}
              pathLength={1}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </div>

      {/* Month ticks rather than one label per week, which at 52 bars is a grey smear. */}
      <div className="chart-axis" aria-hidden>
        {weeks.map((week, index) => {
          const month = monthLabel(week.weekStart);
          const previous = index === 0 ? null : monthLabel(weeks[index - 1].weekStart);
          return (
            <span key={week.weekStart} className="chart-tick">
              {month !== previous ? month : ""}
            </span>
          );
        })}
      </div>

      {/*
        The table is the accessible form and the honest one: a reader who cannot use the
        chart, or who wants the actual numbers, gets them rather than an approximation
        read off a picture.
      */}
      <details className="chart-data rm-hide">
        <summary>Show the numbers</summary>
        <div className="chart-table-scroll">
          <table className="chart-table">
            <caption className="sr-only">Contributions per week, with a four-week trailing mean</caption>
            <thead>
              <tr>
                <th scope="col">Week beginning</th>
                <th scope="col">Contributions</th>
                <th scope="col">4-week mean</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.weekStart}>
                  <th scope="row">{fullDate(week.weekStart)}</th>
                  <td>{week.total}</td>
                  <td>{week.mean === null ? "—" : week.mean.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
