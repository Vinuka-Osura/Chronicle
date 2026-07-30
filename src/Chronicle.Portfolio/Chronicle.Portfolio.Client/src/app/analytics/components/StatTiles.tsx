import type { GitHubStats } from "@/lib/types";

/**
 * Four headline numbers as stat tiles rather than a chart.
 *
 * A bar chart of four unrelated measures — a count, a count, and two day-spans —
 * would invent a comparison between them that does not exist. When the data is a
 * handful of headline figures, the number is the chart.
 */
export function StatTiles({ stats }: { stats: GitHubStats }) {
  const tiles = [
    {
      label: "Contributions this year",
      value: stats.contributionsLastYear,
      note: "Commits, reviews and issues, last 12 months",
    },
    {
      label: "Public repositories",
      value: stats.publicRepos,
      note: "Excluding forks",
    },
    {
      label: "Current streak",
      value: stats.currentStreakDays,
      note: "Consecutive days with a contribution",
      unit: "days",
    },
    {
      label: "Longest streak",
      value: stats.longestStreakDays,
      note: "Best run in the last 12 months",
      unit: "days",
    },
  ];

  return (
    <dl className="rm-grid grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="surface px-4 py-3.5"
        >
          <dt className="font-mono text-[0.65rem] tracking-[0.12em] text-ink-faint uppercase">
            {tile.label}
          </dt>
          {/*
            Proportional figures, not tabular-nums: these do not sit in a column that
            needs to align, and equal-width digits make a number like 121 look loose
            at this size.
          */}
          <dd className="mt-1.5 font-display text-3xl font-semibold text-ink">
            {tile.value.toLocaleString("en-GB")}
            {tile.unit && (
              <span className="ml-1.5 text-sm font-normal text-ink-faint">{tile.unit}</span>
            )}
          </dd>
          <p className="rm-hide mt-1 text-xs text-ink-soft">{tile.note}</p>
        </div>
      ))}
    </dl>
  );
}
