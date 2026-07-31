import Link from "next/link";
import { Counter, Ring, Sparkline, Transition } from "@/components/Figure";
import { SetLines } from "@/components/SetLines";
import type { GitHubStats } from "@/lib/types";
import type { ProofMetric } from "../api";

/** Sums the daily contribution calendar into weeks, for the sparkline. */
function byWeek(days: { count: number }[]): number[] {
  const weeks: number[] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7).reduce((total, day) => total + day.count, 0));
  }
  return weeks;
}

/**
 * The pinned scene: what the work actually did.
 *
 * Every portfolio says it built things. Very few say what happened afterwards, because
 * the numbers are unflattering or nobody measured. These come from the CMS, carry their
 * own caveats, and name the project they belong to — which is the difference between a
 * claim and a citation.
 *
 * It is one of only two pinned sections on the page. Pinning is a strong move and it
 * spends the visitor's scroll, so it is reserved for the two moments worth holding still
 * for. The rest of the page keeps moving normally.
 */
export function Proof({
  metrics,
  stats,
}: {
  metrics: ProofMetric[];
  stats: GitHubStats | null;
}) {
  const weeks = stats ? byWeek(stats.calendar) : [];
  const streakRatio =
    stats && stats.longestStreakDays > 0
      ? (stats.currentStreakDays / stats.longestStreakDays) * 100
      : null;

  /*
    Only figures that have something to say.

    The endpoint answers `isLive: true` with every count at zero when no GitHub token is
    configured, which is accurate and would read as broken — "0 contributions this year"
    in display type is a worse claim than no claim. Each figure appears on its own merit,
    and if none of them do, the band goes with them.
  */
  const figures = stats
    ? [
        {
          key: "contributions",
          value: stats.contributionsLastYear,
          label: "Contributions, 12 months",
        },
        { key: "repos", value: stats.publicRepos, label: "Public repositories" },
      ].filter((figure) => figure.value > 0)
    : [];

  const hasPulse = figures.length > 0 || streakRatio !== null || weeks.length > 1;

  // Nothing to prove yet: better no section than a heading over an empty grid.
  if (metrics.length === 0 && !hasPulse) return null;

  return (
    /* The track is taller than the screen; the inner sticks. That is the whole pinning
       mechanism — no library, and it releases by itself when the track runs out. */
    <section className="scene-track rm-hide" data-scene="Outcomes" aria-labelledby="proof-heading">
      <div className="scene-pin">
        <div className="scene-inner">
          <p className="scene-eyebrow">Outcomes</p>

          <SetLines as="h2" className="scene-heading" id="proof-heading">
            Shipping is the easy half. This is what happened next.
          </SetLines>

          {metrics.length > 0 && (
            <ul className="proof-grid" data-stagger>
              {metrics.map((metric) => (
                <li key={`${metric.projectSlug}-${metric.label}`} className="proof-item">
                  <p className="proof-label">{metric.label}</p>

                  {/* Values like "2.4s to 40ms" animate the change they describe. Ones
                      that are simply a number are left alone rather than forced into a
                      shape the data does not have. */}
                  <p className="proof-value">
                    <Transition value={metric.value} />
                  </p>

                  {metric.note && <p className="proof-note">{metric.note}</p>}

                  <Link href={`/projects/${metric.projectSlug}`} className="proof-source">
                    {metric.projectTitle}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {hasPulse && stats && (
            <div className="pulse">
              <div className="pulse-figures">
                {figures.map((figure) => (
                  <div key={figure.key} className="pulse-figure">
                    <span className="pulse-value">
                      <Counter value={figure.value} />
                    </span>
                    <span className="pulse-label">{figure.label}</span>
                  </div>
                ))}

                {/* A ring only because this is a true ratio. The counts beside it have no
                    denominator, so they stay as numbers. */}
                {streakRatio !== null && (
                  <Ring
                    percent={streakRatio}
                    label="Streak vs best"
                    caption={`${stats.currentStreakDays} days, against a best of ${stats.longestStreakDays}`}
                  />
                )}
              </div>

              {weeks.length > 1 && (
                <div className="pulse-spark">
                  <Sparkline
                    points={weeks}
                    label={`Weekly contributions over the last ${weeks.length} weeks`}
                  />
                  <p className="pulse-spark-label">
                    Weekly contributions
                    <Link href="/analytics" className="pulse-spark-link">
                      See the detail
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
