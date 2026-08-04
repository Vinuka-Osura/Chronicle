import type { Metadata } from "next";
import { Acquire } from "@/components/Acquire";
import { Counter, Ring } from "@/components/Figure";
import { SetLines } from "@/components/SetLines";
import Link from "next/link";
import type { ExternalStats, GitHubStats } from "@/lib/types";
import { getExternalStats, getGitHubStats } from "./api";
import { ContributionHeatmap } from "./components/ContributionHeatmap";
import { ContributionMix, PrivateWork } from "./components/ContributionMix";
import { LanguageShare } from "./components/LanguageShare";
import { AllTime, OpenSourceParticipation, WeekdayRhythm } from "./components/Participation";
import { SourceTag } from "./components/SourceTag";
import { StackOverflow } from "./components/StackOverflow";
import { StatTiles } from "./components/StatTiles";
import { WorkOverTime } from "./components/WorkOverTime";
import "./analytics.css";

export const metadata: Metadata = {
  title: "Engineering Analytics",
  description:
    "Commit activity, contribution mix, language spread and open-source participation, pulled from the GitHub API and cached server-side so the page never blocks on a third party.",
};

export default async function AnalyticsPage() {
  // Fetched together, but they fail independently — GitHub being unreachable must not
  // blank the credentials, and a broken Medium feed must not cost the contribution graph.
  const [stats, external] = await Promise.all([getGitHubStats(), getExternalStats()]);

  const hasExternal =
    external.stackOverflow !== null ||
    external.badges.length > 0 ||
    external.dockerHub !== null ||
    external.articles.length > 0;

  if (!stats.isLive && !hasExternal) {
    return (
      <>
        <Opening stats={stats} />
        <NotConnected />
      </>
    );
  }

  const { breakdown } = stats;

  return (
    <>
      <Opening stats={stats} />

      {/* Each section guards on its own data rather than on one flag, so GitHub being
          unreachable costs exactly the GitHub sections and nothing else on the page. */}
      {stats.isLive && (
        <section className="scene" data-scene="Headline" aria-labelledby="headline-heading">
          <div className="scene-head">
            <p className="scene-eyebrow">The last twelve months</p>
            <SourceTag source="github" />
          </div>
          <h2 id="headline-heading" className="scene-heading">
            What the year actually contained.
          </h2>
          <StatTiles stats={stats} />
          <NoContributionData stats={stats} />
        </section>
      )}

      {stats.weekly.length > 0 && (
        <section className="scene" data-scene="Over time" aria-labelledby="overtime-heading">
          <div className="scene-head">
            <p className="scene-eyebrow">Shape of the year</p>
            <SourceTag source="github" />
          </div>
          <h2 id="overtime-heading" className="scene-heading">
            Work is not evenly spread, and pretending otherwise helps nobody.
          </h2>
          <WorkOverTime weeks={stats.weekly} />
        </section>
      )}

      {breakdown && (
        <section className="scene" data-scene="Mix" aria-labelledby="mix-heading">
          <div className="scene-head">
            <p className="scene-eyebrow">What it was made of</p>
            <SourceTag source="github" />
          </div>
          <h2 id="mix-heading" className="scene-heading">
            A year of commits and a year of code review are not the same year.
          </h2>
          <p className="analytics-sub rm-compact">
            These four are what GitHub counts as a contribution, and they add up to the
            headline number — so the proportions here are real rather than a shape drawn
            over a total.
          </p>

          <div className="mix-layout">
            <ContributionMix breakdown={breakdown} />
            <PrivateWork breakdown={breakdown} />
          </div>
        </section>
      )}

      {stats.calendarDays > 0 && (
        <section className="scene" data-scene="Rhythm" aria-labelledby="rhythm-heading">
          <div className="scene-head">
            <p className="scene-eyebrow">Rhythm</p>
            <SourceTag source="github" />
          </div>
          <h2 id="rhythm-heading" className="scene-heading">
            Consistency, with the quiet stretches left in.
          </h2>
          <Consistency stats={stats} />
          <ContributionHeatmap calendar={stats.calendar} total={stats.contributionsLastYear} />
          <WeekdayRhythm days={stats.byDayOfWeek} />
        </section>
      )}

      {stats.contributedTo.length > 0 && (
        <section
          className="scene"
          data-scene="Open source"
          aria-labelledby="participation-heading"
        >
          <div className="scene-head">
            <p className="scene-eyebrow">Other people&rsquo;s projects</p>
            <SourceTag source="github" />
          </div>
          <h2 id="participation-heading" className="scene-heading">
            Changes somebody else decided were worth keeping.
          </h2>
          <p className="analytics-sub rm-compact">
            Repositories I do not own, where a maintainer reviewed and merged the work.
            Everything else on this page is self-reported; this is the part that is not.
          </p>
          <OpenSourceParticipation repos={stats.contributedTo} />
        </section>
      )}

      {stats.languages.length > 0 && (
        <section className="scene" data-scene="Languages" aria-labelledby="languages-heading">
          <div className="scene-head">
            <p className="scene-eyebrow">Spread</p>
            <SourceTag source="github" />
          </div>
          <h2 id="languages-heading" className="scene-heading">
            What the code is written in.
          </h2>
          <LanguageShare languages={stats.languages} />
          <AllTime years={stats.years} currentYear={currentYear(stats)} />
        </section>
      )}

      {external.stackOverflow && (
        <section className="scene" data-scene="Answers" aria-labelledby="so-heading">
          <div className="scene-head">
            <p className="scene-eyebrow">Being useful to strangers</p>
            <SourceTag source="stackoverflow" />
          </div>
          <h2 id="so-heading" className="scene-heading">
            Reputation is what other people thought was worth an upvote.
          </h2>
          <p className="analytics-sub rm-compact">
            The second figure on this page that a third party controls. Reputation is a bare
            count and gets a counter; the accepted-answer rate is a real proportion and is the
            only thing here drawn as one.
          </p>
          <StackOverflow stats={external.stackOverflow} />
        </section>
      )}

      <Output external={external} />

      <Provenance stats={stats} />
    </>
  );
}

/**
 * How much was published, as counts — and nothing else.
 *
 * The credentials, the images and the articles themselves moved to Knowledge, and this is
 * what belongs here instead. The distinction is the page's own claim: the hero says the
 * work is **measured** rather than claimed, and a list of certificates is a claim with
 * provenance, not a measurement. Three sections of them were quietly making that sentence
 * false.
 *
 * Counters, never bars. A pull count has no ceiling and an article count has no
 * denominator, so there is nothing here a proportional form could honestly assert.
 */
function Output({ external }: { external: ExternalStats }) {
  const tiles = [
    external.articles.length > 0 && {
      label: "Articles published",
      value: external.articles.length,
      note: "Written for somewhere that is not this site",
    },
    external.dockerHub && {
      label: "Images published",
      value: external.dockerHub.repositories,
      note: "Public container images anyone can pull",
    },
    external.dockerHub &&
      external.dockerHub.totalPulls > 0 && {
        label: "Image pulls",
        value: external.dockerHub.totalPulls,
        note: "Across every published image, all time",
      },
    external.badges.length > 0 && {
      label: "Credentials held",
      value: external.badges.length,
      note: "Certifications, Applied Skills, badges and training",
    },
  ].filter((tile): tile is { label: string; value: number; note: string } => Boolean(tile));

  if (tiles.length === 0) return null;

  return (
    <section className="scene" data-scene="Output" aria-labelledby="output-heading">
      <div className="scene-head">
        <p className="scene-eyebrow">Output</p>
      </div>
      <h2 id="output-heading" className="scene-heading">
        What came out of it.
      </h2>
      <p className="analytics-sub rm-compact">
        The counts only. The articles, images and credentials themselves are on{" "}
        <Link href="/knowledge" className="analytics-link">
          Knowledge
        </Link>{" "}
        — this page is for what can be measured.
      </p>

      <dl className="rm-grid grid grid-cols-2 gap-3 lg:grid-cols-4" data-stagger data-pop>
        {tiles.map((tile) => (
          <div key={tile.label} className="surface px-4 py-3.5">
            <dt className="font-mono text-[0.65rem] tracking-[0.12em] text-ink-faint uppercase">
              {tile.label}
            </dt>
            <dd className="mt-1.5 font-display text-3xl font-semibold text-ink">
              <Counter value={tile.value} />
            </dd>
            <p className="rm-hide mt-1 text-xs text-ink-soft">{tile.note}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * The year to compare the last bar against.
 *
 * Taken from the calendar's own end date, not the clock. A Server Component may not read
 * the clock at all under Cache Components — and the server's date is the right answer
 * anyway, because it is the date the data was actually gathered against.
 */
function currentYear(stats: GitHubStats): number {
  const anchor = stats.calendarTo ?? stats.fetchedAt;
  return Number(anchor.slice(0, 4));
}

function Opening({ stats }: { stats: GitHubStats }) {
  return (
    <section
      className="analytics-open"
      data-scene="Analytics"
      aria-labelledby="analytics-heading"
    >
      <div className="hero-channel">
        <Acquire text="ENGINEERING ANALYTICS" className="hero-channel-label" delay={120} />
        <span className="hero-channel-rule" aria-hidden />
        <Acquire
          text={stats.isLive ? "LIVE FROM GITHUB" : "NOT CONNECTED"}
          className="hero-channel-label"
          delay={220}
        />
      </div>

      <SetLines as="h1" className="analytics-heading" delay={320} id="analytics-heading">
        The work, measured rather than claimed.
      </SetLines>

      <p className="analytics-lede reveal-mask">
        Activity from the GitHub API, fetched by the server every few hours and cached.
        Your browser never talks to GitHub, so the page stays fast when GitHub is slow and
        the token never leaves the server.
      </p>
    </section>
  );
}

/**
 * Consistency, stated with its own counterexample beside it.
 *
 * The active-days ratio is one of the few figures here that has earned a ring: days with a
 * contribution over days in the window is a real proportion of a real whole. The longest
 * gap sits next to the longest streak on purpose — a page that shows only the best run is
 * a page selecting its own evidence.
 */
function Consistency({ stats }: { stats: GitHubStats }) {
  if (stats.calendarDays === 0) return null;

  const ratio = stats.activeDays / stats.calendarDays;

  return (
    <div className="consistency" data-stagger data-pop>
      <div className="consistency-ring">
        <Ring percent={ratio * 100} label="Days with something on them" />
        <div>
          <p className="consistency-note">
            <Counter value={stats.activeDays} /> of {stats.calendarDays} days in the
            window. A real proportion of a real whole, which is why it gets a ring — most
            numbers on this page do not.
          </p>
        </div>
      </div>

      <dl className="consistency-pair">
        <div>
          <dt>Longest streak</dt>
          <dd>
            <Counter value={stats.longestStreakDays} /> days
          </dd>
        </div>
        <div>
          <dt>Longest gap</dt>
          <dd>
            <Counter value={stats.longestGapDays} /> days
          </dd>
        </div>
      </dl>

      <p className="consistency-caveat">
        The gap is here because the streak on its own is a number chosen for how it looks.
      </p>
    </div>
  );
}

/**
 * The half-connected state, which is the one that actually misleads.
 *
 * Repositories and languages come from the REST API and work with no credential at all.
 * The contribution calendar exists **only** on the authenticated GraphQL API, so without a
 * token those tiles are structurally zero — and a zero next to a working repository count
 * reads as "this person did nothing this year" rather than "this was never fetched".
 *
 * Saying so is not an apology for a missing feature; it is the same rule the rest of the
 * page follows, which is that an absence must never be presented as a measurement.
 */
function NoContributionData({ stats }: { stats: GitHubStats }) {
  if (stats.calendarDays > 0) return null;

  return (
    <p className="analytics-notice rm-hide">
      <strong>Contribution figures are not connected.</strong> Repositories and languages
      come from GitHub&rsquo;s public REST API, but the contribution calendar exists only
      on the authenticated GraphQL API — so the counts above are zero because nothing was
      fetched, not because nothing happened. They fill in on their own once a token is
      configured; no rebuild, no code change.
    </p>
  );
}

/**
 * Where the numbers came from and how old they are.
 *
 * A page of statistics with no stated age invites the reader to assume they are live.
 * These are not, by design, so the page says so rather than letting them infer it.
 */
function Provenance({ stats }: { stats: GitHubStats }) {
  return (
    <footer className="rm-hide analytics-provenance">
      <p>
        Last refreshed{" "}
        <time dateTime={stats.fetchedAt}>
          {new Date(stats.fetchedAt).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          })}{" "}
          UTC
        </time>
        {stats.busiestDay && (
          <>
            {" · busiest day was "}
            <time dateTime={stats.busiestDay}>
              {new Date(`${stats.busiestDay}T00:00:00Z`).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </time>
            {` with ${stats.busiestDayCount}`}
          </>
        )}
        .
      </p>
    </footer>
  );
}

/**
 * The honest empty state. Zeroes in the stat tiles would read as "this person does
 * nothing" rather than "nothing has been connected yet", which is the opposite of true.
 */
function NotConnected() {
  return (
    <div className="analytics-empty">
      <h2 className="text-section font-display font-semibold">Not connected yet</h2>
      <p className="mt-2 max-w-prose text-sm text-ink-soft">
        This page reads from the GitHub API and the server has not reached it — either no
        account is configured or the request did not get through. Nothing is shown rather
        than zeroes, because &ldquo;no contributions&rdquo; and &ldquo;no data&rdquo; are
        very different claims and only one of them would be true.
      </p>
    </div>
  );
}
