import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { GitHubStats } from "@/lib/types";

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
