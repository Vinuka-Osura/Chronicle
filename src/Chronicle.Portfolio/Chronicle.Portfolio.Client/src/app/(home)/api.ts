import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { SiteStatus } from "@/lib/types";

/**
 * Mission Control's status strip.
 *
 * Short cache life on purpose: this is the one surface that claims to be live, and an
 * hour-old "currently working on" would be a small lie. Minutes is honest without
 * hitting the API on every visit.
 */
export async function getSiteStatus(): Promise<SiteStatus | null> {
  "use cache";
  cacheTag("status");
  cacheLife("minutes");

  return requestOr<SiteStatus | null>("/api/status", null);
}
