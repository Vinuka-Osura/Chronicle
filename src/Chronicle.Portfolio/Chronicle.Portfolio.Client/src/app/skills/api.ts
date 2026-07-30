import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { SkillGroup } from "@/lib/types";

/**
 * Skills grouped by category, each carrying the work that used it.
 *
 * Tagged with projects and experience as well as skills: the usage list is derived from
 * those join tables, so editing a project changes this page even though no skill row
 * moved. Without those tags the page would keep serving a stale set of links.
 */
export async function getSkills(): Promise<SkillGroup[]> {
  "use cache";
  cacheTag("skills", "projects", "experience");
  cacheLife("hours");

  return requestOr<SkillGroup[]>("/api/skills", []);
}
