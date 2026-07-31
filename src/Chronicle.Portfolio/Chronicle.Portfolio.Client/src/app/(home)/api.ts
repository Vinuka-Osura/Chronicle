import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { ProjectMetric, SiteStatus } from "@/lib/types";
import { getProject, getProjects } from "@/app/projects/api";

/** A project metric, plus the work it came from. */
export interface ProofMetric extends ProjectMetric {
  projectTitle: string;
  projectSlug: string;
}

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

/** How many figures the Proof scene will hold before it stops being a scene. */
const MOST_METRICS = 6;

/**
 * The outcome metrics from the featured projects, flattened and attributed.
 *
 * These are the strongest sentences on the site — "2.4s to 40ms", "0 balance
 * discrepancies in 18 months" — and they were previously buried on the case-study pages,
 * which is the last place someone deciding whether to keep reading will look.
 *
 * They live on the project DETAIL, not on the card, so this fans out: the featured list,
 * then one detail per project. That is three requests rather than one, and it is fine —
 * every one of them is `use cache` and tagged `projects`, so they collapse to a single
 * cached result that a CMS edit invalidates along with everything else about a project.
 *
 * Attribution is not decoration. A number with no source is a claim; a number with the
 * project it came from is evidence, and the link lets anyone go and check it.
 */
export async function getProofMetrics(): Promise<ProofMetric[]> {
  "use cache";
  cacheTag("projects");
  cacheLife("hours");

  const featured = await getProjects({ featured: true });

  const details = await Promise.all(featured.map((project) => getProject(project.slug)));

  return details
    .filter((detail) => detail !== null)
    .flatMap((detail) =>
      detail.metrics.map((metric) => ({
        ...metric,
        projectTitle: detail.title,
        projectSlug: detail.slug,
      })),
    )
    .slice(0, MOST_METRICS);
}
