import type { ProjectMetric } from "@/lib/types";

/**
 * The results as figures rather than sentences.
 *
 * A stat tile, not a chart — four unrelated measures have no shared axis, and a bar
 * chart across them would invent a comparison that does not exist. When the data is a
 * handful of headline numbers, the number *is* the chart.
 *
 * These sit alongside the Results prose rather than replacing it. The number is what a
 * reader scans for; the prose is what stops the number being misread.
 */
export function MetricCards({ metrics }: { metrics: ProjectMetric[] }) {
  if (metrics.length === 0) {
    return null;
  }

  return (
    <dl
      className={`rm-grid mt-5 grid gap-3 ${
        // Two columns for two or four, three for three: a lone orphan on the second row
        // reads as something failing to load.
        metrics.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
      }`}
    >
      {metrics.map((metric) => (
        <div key={metric.label} className="surface px-4 py-3.5">
          <dt className="font-mono text-[0.65rem] tracking-[0.12em] text-ink-faint uppercase">
            {metric.label}
          </dt>

          {/*
            Proportional figures, not tabular-nums: these do not sit in a column that
            has to align, and equal-width digits make a value like "2.4s to 40ms" look
            gappy at this size.
          */}
          <dd className="mt-1.5 font-display text-2xl font-semibold text-ink">
            {metric.value}
          </dd>

          {metric.note && (
            <p className="rm-hide mt-1 text-xs text-ink-soft">{metric.note}</p>
          )}
        </div>
      ))}
    </dl>
  );
}
