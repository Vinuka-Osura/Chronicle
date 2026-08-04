import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { ExternalStats, GitHubStats } from "@/lib/types";

const NOT_CONNECTED: GitHubStats = {
  isLive: false,
  fetchedAt: new Date(0).toISOString(),
  contributionsLastYear: 0,
  publicRepos: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  busiestDayCount: 0,
  busiestDay: null,
  calendarFrom: null,
  calendarTo: null,
  calendar: [],
  languages: [],
  lastCommit: null,
  repos: [],
  breakdown: null,
  weekly: [],
  years: [],
  byDayOfWeek: [],
  contributedTo: [],
  activeDays: 0,
  calendarDays: 0,
  longestGapDays: 0,
};

/**
 * GitHub activity, already cached twice before it reaches here — once in the database
 * row the server refreshes every few hours, once in the API's output cache.
 *
 * `minutes` rather than `hours`: this is the one content page whose numbers imply
 * recency, and the layers underneath already stop it from becoming a GitHub call.
 *
 * No cache tag from the CMS, because nothing an editor can do changes what GitHub
 * reports — this is the only fetcher on the site with no editorial input at all.
 */
export async function getGitHubStats(): Promise<GitHubStats> {
  "use cache";
  cacheTag("github-stats");
  cacheLife("minutes");

  return requestOr<GitHubStats>("/api/github/stats", NOT_CONNECTED);
}

/** Nothing configured and nothing to show are the same thing here, and both render nothing. */
const NOTHING_EXTERNAL: ExternalStats = {
  stackOverflow: null,
  badges: [],
  dockerHub: null,
  articles: [],
};

/**
 * Stack Overflow, credentials, Docker Hub and Medium, in one call.
 *
 * Separate from `getGitHubStats` rather than merged into it, because the two fail
 * independently: GitHub being unreachable must not blank the credentials, and a broken
 * Medium feed must not cost the contribution graph. Tagged separately for the same reason.
 *
 * `hours`, not `minutes`: unlike the GitHub figures, none of this claims to be recent —
 * a badge earned last March is not more true for being fetched a minute ago.
 */
export async function getExternalStats(): Promise<ExternalStats> {
  "use cache";
  cacheTag("external-stats", "certifications");
  cacheLife("hours");

  return requestOr<ExternalStats>("/api/external/stats", NOTHING_EXTERNAL);
}
