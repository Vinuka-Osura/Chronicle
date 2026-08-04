import { Counter } from "@/components/Figure";
import { External } from "@/components/Icon";
import type { ContributedRepo, DayOfWeekTotal, YearTotal } from "@/lib/types";

/**
 * Repositories belonging to other people that this account has contributed to.
 *
 * The strongest claim available on this page and the hardest to manufacture: a merged
 * change in a project you do not own is a third party deciding your work was worth
 * keeping. Own repositories are excluded at the query — including them would turn the
 * one externally-validated figure here into another self-reported one.
 *
 * Ordered by stars, because "which projects" is the question a reader is actually asking.
 */
export function OpenSourceParticipation({ repos }: { repos: ContributedRepo[] }) {
  if (repos.length === 0) return null;

  return (
    <ul className="participation rm-grid" data-stagger data-pop>
      {repos.map((repo) => (
        <li key={repo.nameWithOwner} className="participation-item card">
          <div className="card-body">
            <h3 className="participation-name">
              <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="after:absolute after:inset-0 after:content-['']"
              >
                {repo.nameWithOwner}
              </a>
            </h3>

            {repo.description && (
              <p className="participation-description">{repo.description}</p>
            )}

            <p className="participation-meta">
              {repo.language && <span>{repo.language}</span>}
              {repo.stars > 0 && (
                <span className="participation-stars">
                  {repo.stars.toLocaleString("en-GB")} stars
                </span>
              )}
              <External className="participation-icon" />
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * One bar per year, for the life of the account.
 *
 * The year-to-date bar is the trap here: December against eleven months of a partial year
 * makes the current year look like a decline when it is simply not finished. It is marked
 * rather than hidden, because dropping it would be worse — a chart of your history that
 * silently omits the present.
 */
export function AllTime({ years, currentYear }: { years: YearTotal[]; currentYear: number }) {
  if (years.length < 2) return null;

  const peak = Math.max(...years.map((year) => year.contributions), 1);
  const total = years.reduce((sum, year) => sum + year.contributions, 0);

  return (
    <figure className="chart">
      <figcaption className="chart-head">
        <h3 className="chart-title">Every year on GitHub</h3>
        <p className="chart-note">
          <Counter value={total} /> contributions since {years[0].year}
          {". "}
          {currentYear} is still running, so its bar is a year to date rather than a year.
        </p>
      </figcaption>

      <ul className="years" data-stagger data-slide>
        {years.map((year) => (
          <li key={year.year} className="years-row">
            <span className="years-label">{year.year}</span>
            <span
              className="years-track"
              style={{ "--fill": `${year.contributions / peak}` } as React.CSSProperties}
            >
              <span
                className={`years-fill${year.year === currentYear ? " is-partial" : ""}`}
              />
            </span>
            <span className="years-value">
              {year.contributions.toLocaleString("en-GB")}
              {year.year === currentYear && <span className="years-partial">to date</span>}
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/**
 * Contributions by weekday, as a mean per occurrence of that day.
 *
 * **The mean, not the total, and that is the whole point.** A 365-day window holds 53 of
 * one weekday and 52 of the rest, so raw totals hand one arbitrary day a 2% head start and
 * a reader draws a conclusion about Tuesdays from a rounding artefact.
 */
export function WeekdayRhythm({ days }: { days: DayOfWeekTotal[] }) {
  if (days.length === 0 || days.every((day) => day.total === 0)) return null;

  const peak = Math.max(...days.map((day) => day.mean), 0.001);

  return (
    <figure className="chart">
      <figcaption className="chart-head">
        <h3 className="chart-title">Which days the work happens on</h3>
        <p className="chart-note">
          Average contributions per weekday, not the total — a year contains more of some
          weekdays than others, and totals would read that as a preference.
        </p>
      </figcaption>

      <ul className="weekdays" data-stagger data-pop>
        {days.map((day) => (
          <li key={day.day} className="weekdays-col">
            <span
              className="weekdays-track"
              title={`${day.day}: ${day.mean.toFixed(1)} per ${day.day}, ${day.total} in total`}
            >
              <span
                className="weekdays-fill"
                style={{ "--h": `${(day.mean / peak) * 100}%` } as React.CSSProperties}
              />
            </span>
            <span className="weekdays-value">{day.mean.toFixed(1)}</span>
            <span className="weekdays-label">{day.day.slice(0, 3)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
