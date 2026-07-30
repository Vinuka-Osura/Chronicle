import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { Timeline } from "@/lib/types";

/**
 * The whole timeline in one request.
 *
 * Tagged with every source that feeds it — editing a project, a role or an era all
 * change this page even though only one table moved.
 */
export async function getTimeline(): Promise<Timeline> {
  "use cache";
  cacheTag(
    "timeline",
    "projects",
    "experience",
    "certifications",
    "roadmap",
    "milestones",
    "eras",
  );
  cacheLife("hours");

  return requestOr<Timeline>("/api/timeline", {
    // An empty timeline still needs a today, or the page cannot decide where the
    // boundary goes. The server normally supplies this.
    today: new Date().toISOString().slice(0, 10),
    eras: [],
    items: [],
  });
}
