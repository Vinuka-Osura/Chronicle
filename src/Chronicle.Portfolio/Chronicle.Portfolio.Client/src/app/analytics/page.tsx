import type { Metadata } from "next";
import type { GitHubStats } from "@/lib/types";
import { getGitHubStats } from "./api";
import { ContributionHeatmap } from "./components/ContributionHeatmap";
import { LanguageShare } from "./components/LanguageShare";
import { StatTiles } from "./components/StatTiles";

export const metadata: Metadata = {
  title: "Engineering Analytics",
  description:
    "Commit activity, language mix and streaks, pulled from the GitHub API and cached server-side so the page never blocks on a third party.",
};

export default async function AnalyticsPage() {
  const stats = await getGitHubStats();

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-10">
        <p className="mb-2 font-mono text-xs tracking-[0.2em] text-ink-faint uppercase">
          Engineering Analytics
        </p>
        <h1 className="text-title font-semibold">The work, measured</h1>
        <p className="mt-4 max-w-prose text-ink-soft">
          Activity from GitHub rather than claims about it. The numbers are fetched by
          the server every few hours and cached — your browser never talks to GitHub, so
          the page stays fast when GitHub is slow and the API token never leaves the
          server.
        </p>
      </header>

      {stats.isLive ? (
        <div className="space-y-12">
          <StatTiles stats={stats} />
          <ContributionHeatmap
            calendar={stats.calendar}
            total={stats.contributionsLastYear}
          />
          <LanguageShare languages={stats.languages} />
          <Provenance stats={stats} />
        </div>
      ) : (
        <NotConnected />
      )}
    </div>
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
    <footer className="rm-hide border-t border-rule pt-4 text-xs text-ink-faint">
      <p>
        Last refreshed{" "}
        <time dateTime={stats.fetchedAt}>
          {new Date(stats.fetchedAt).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
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
    <div className="surface px-6 py-8">
      <h2 className="text-section font-display font-semibold">Not connected yet</h2>
      <p className="mt-2 max-w-prose text-sm text-ink-soft">
        This page reads from the GitHub API, and the server has not reached it — either
        no account is configured or the request did not get through. Nothing is shown
        rather than zeroes, because &ldquo;no contributions&rdquo; and &ldquo;no
        data&rdquo; are very different claims and only one of them would be true.
      </p>
      <p className="mt-3 text-sm text-ink-soft">
        The{" "}
        <a
          href="https://github.com/Vinuka-Osura"
          className="text-signal hover:underline"
          rel="noreferrer"
          target="_blank"
        >
          GitHub profile
        </a>{" "}
        has the same activity in the meantime.
      </p>
    </div>
  );
}
