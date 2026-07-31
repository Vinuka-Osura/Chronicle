import Link from "next/link";
import { BarSeries, Counter, Ring } from "@/components/Figure";
import type { GitHubStats, ProjectCard, SkillGroup, Timeline } from "@/lib/types";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Contributions grouped into the last twelve calendar months, oldest first. */
function byMonth(days: { date: string; count: number }[]) {
  if (days.length === 0) return null;

  const buckets = new Map<string, number>();
  for (const day of days) {
    const key = day.date.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + day.count);
  }

  const keys = [...buckets.keys()].sort().slice(-12);
  return {
    points: keys.map((k) => buckets.get(k) ?? 0),
    // Month initial. Twelve of them is the most a card this size can label legibly.
    labels: keys.map((k) => MONTHS[Number(k.slice(5, 7)) - 1]),
  };
}

/** Projects per year, from their start dates. */
function projectsByYear(projects: ProjectCard[]) {
  if (projects.length === 0) return null;

  const buckets = new Map<string, number>();
  for (const project of projects) {
    const year = project.startDate.slice(0, 4);
    buckets.set(year, (buckets.get(year) ?? 0) + 1);
  }

  const keys = [...buckets.keys()].sort().slice(-6);
  return {
    points: keys.map((k) => buckets.get(k) ?? 0),
    labels: keys.map((k) => k.slice(2)),
    total: projects.length,
  };
}

/** Timeline entries per year, so the chart is the shape of the career. */
function timelineByYear(timeline: Timeline | null) {
  if (!timeline || timeline.items.length === 0) return null;

  const buckets = new Map<string, number>();
  for (const item of timeline.items) {
    const year = item.date.slice(0, 4);
    buckets.set(year, (buckets.get(year) ?? 0) + 1);
  }

  const keys = [...buckets.keys()].sort();
  const span = keys.length > 1 ? Number(keys[keys.length - 1]) - Number(keys[0]) + 1 : 1;

  return {
    points: keys.map((k) => buckets.get(k) ?? 0),
    labels: keys.map((k) => k.slice(2)),
    total: timeline.items.length,
    span,
  };
}

/** Distinct technologies across the projects, and how deep each project's stack is. */
function techBreadth(projects: ProjectCard[]) {
  const withStacks = projects.filter((p) => p.techStack.length > 0);
  if (withStacks.length === 0) return null;

  const distinct = new Set(withStacks.flatMap((p) => p.techStack));

  return {
    total: distinct.size,
    points: withStacks.map((p) => p.techStack.length),
    // First two letters of each project, which is as much as a column this wide holds.
    labels: withStacks.map((p) => p.title.slice(0, 2)),
    names: withStacks.map((p) => `${p.title} ${p.techStack.length}`),
  };
}

/** How long ago, in the coarsest unit that is still true. */
function since(iso: string): string {
  const then = new Date(iso).getTime();
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/**
 * The second half of the Outcomes scene: the work in aggregate.
 *
 * Where the metric cards above are individual claims about individual systems, these are
 * the shape of the whole thing — and unlike those, every one of them has a real series
 * behind it, so every one of them can carry a chart honestly.
 *
 * **That is the rule the whole file follows.** A card appears only when the data it
 * needs actually arrived, and each chart is drawn from measurements rather than fitted
 * to a layout. There is no card here waiting for a number to be invented for it: with no
 * GitHub token the four GitHub cards simply do not render, and the two derived from
 * content still do.
 */
export function Pulse({
  stats,
  projects,
  skills,
  timeline,
}: {
  stats: GitHubStats | null;
  projects: ProjectCard[];
  skills: SkillGroup[];
  timeline: Timeline | null;
}) {
  const months = stats ? byMonth(stats.calendar) : null;
  const years = projectsByYear(projects);
  const career = timelineByYear(timeline);
  const tech = techBreadth(projects);

  const streakRatio =
    stats && stats.longestStreakDays > 0
      ? (stats.currentStreakDays / stats.longestStreakDays) * 100
      : null;

  const languages = stats?.languages.slice(0, 5) ?? [];
  const repos = stats?.repos.slice(0, 5) ?? [];

  const categories = skills
    .filter((group) => group.skills.length > 0)
    .slice(0, 7)
    .map((group) => ({ label: group.category, count: group.skills.length }));

  const skillTotal = categories.reduce((total, c) => total + c.count, 0);

  const cards = [
    months !== null && stats && stats.contributionsLastYear > 0,
    languages.length > 0,
    streakRatio !== null,
    repos.length > 0,
    years !== null,
    categories.length > 0,
    career !== null,
    tech !== null,
  ].filter(Boolean).length;

  if (cards === 0) return null;

  return (
    <div className="pulse-grid" data-stagger data-pop>
      {/* ── Contributions, with the twelve months behind the number ───────────── */}
      {months && stats && stats.contributionsLastYear > 0 && (
        <article className="pulse-card">
          <p className="pulse-card-label">
            <span className="proof-dot" aria-hidden />
            Contributions
          </p>
          <p className="metric-figure">
            <Counter value={stats.contributionsLastYear} />
            <span className="metric-unit">last 12 months</span>
          </p>
          <BarSeries
            points={months.points}
            labels={months.labels}
            label="Contributions per month over the last twelve months"
            highlightLast
          />
        </article>
      )}

      {/* ── Language mix ──────────────────────────────────────────────────────── */}
      {languages.length > 0 && (
        <article className="pulse-card">
          <p className="pulse-card-label">
            <span className="proof-dot" aria-hidden />
            Written in
          </p>
          <p className="metric-figure">
            <Counter value={languages[0].percent} decimals={1} />
            <span className="metric-unit">% {languages[0].name}</span>
          </p>

          {/* One hue for every row. Languages are nominal — reordering them changes
              nothing — so spending the colour channel on identity would re-encode what
              the bar length already says. The name beside each bar is the identity. */}
          <ul className="pulse-rows">
            {languages.map((language) => (
              <li key={language.name} className="pulse-row">
                <span className="pulse-row-name">{language.name}</span>
                <span className="pulse-row-track">
                  <span
                    className="pulse-row-bar"
                    style={{ width: `${Math.max(2, (language.percent / languages[0].percent) * 100)}%` }}
                  >
                    <span className="bar-fill" />
                  </span>
                </span>
                <span className="pulse-row-value">{language.percent.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </article>
      )}

      {/* ── Streak. A ring, because this one is a genuine ratio ───────────────── */}
      {streakRatio !== null && stats && (
        <article className="pulse-card pulse-card-centred">
          <p className="pulse-card-label">
            <span className="proof-dot" aria-hidden />
            Streak
          </p>
          <Ring
            percent={streakRatio}
            label="Current streak against personal best"
            caption={`${stats.currentStreakDays} days, against a best of ${stats.longestStreakDays}`}
          />
        </article>
      )}

      {/* ── Repositories, named, with when each was last touched ──────────────── */}
      {repos.length > 0 && stats && (
        <article className="pulse-card">
          <p className="pulse-card-label">
            <span className="proof-dot" aria-hidden />
            Public repositories
          </p>
          <p className="metric-figure">
            <Counter value={stats.publicRepos} />
            <span className="metric-unit">on GitHub</span>
          </p>

          <ul className="pulse-repos">
            {repos.map((repo) => (
              <li key={repo.name}>
                <a href={repo.url} target="_blank" rel="noreferrer" className="pulse-repo">
                  <span className="pulse-repo-name">{repo.name}</span>
                  {repo.language && <span className="pulse-repo-lang">{repo.language}</span>}
                  <span className="pulse-repo-when">{since(repo.pushedAt)}</span>
                </a>
              </li>
            ))}
          </ul>
        </article>
      )}

      {/* ── Projects per year ─────────────────────────────────────────────────── */}
      {years && (
        <article className="pulse-card">
          <p className="pulse-card-label">
            <span className="proof-dot" aria-hidden />
            Projects
          </p>
          <p className="metric-figure">
            <Counter value={years.total} />
            <span className="metric-unit">shipped</span>
          </p>
          <BarSeries
            points={years.points}
            labels={years.labels}
            label="Projects started per year"
            highlightLast
          />
        </article>
      )}

      {/* ── Skills by category ────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <article className="pulse-card">
          <p className="pulse-card-label">
            <span className="proof-dot" aria-hidden />
            Skills tracked
          </p>
          <p className="metric-figure">
            <Counter value={skillTotal} />
            <span className="metric-unit">across {categories.length}</span>
          </p>
          <BarSeries
            points={categories.map((c) => c.count)}
            labels={categories.map((c) => c.label.slice(0, 2))}
            label={`Skills per category: ${categories.map((c) => `${c.label} ${c.count}`).join(", ")}`}
          />
          <Link href="/analytics" className="pulse-more">
            The full analytics
          </Link>
        </article>
      )}

      {/* ── The career, as entries per year ───────────────────────────────────── */}
      {career && (
        <article className="pulse-card">
          <p className="pulse-card-label">
            <span className="proof-dot" aria-hidden />
            Timeline
          </p>
          <p className="metric-figure">
            <Counter value={career.total} />
            <span className="metric-unit">entries over {career.span}y</span>
          </p>
          <BarSeries
            points={career.points}
            labels={career.labels}
            label="Timeline entries per year"
            highlightLast
          />
        </article>
      )}

      {/* ── Stack breadth ─────────────────────────────────────────────────────── */}
      {tech && (
        <article className="pulse-card">
          <p className="pulse-card-label">
            <span className="proof-dot" aria-hidden />
            Technologies
          </p>
          <p className="metric-figure">
            <Counter value={tech.total} />
            <span className="metric-unit">distinct</span>
          </p>
          <BarSeries
            points={tech.points}
            labels={tech.labels}
            label={`Stack size per project: ${tech.names.join(", ")}`}
          />
        </article>
      )}
    </div>
  );
}
