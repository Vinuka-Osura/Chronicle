import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { Certification, Experience } from "@/lib/types";

export async function getCertifications(): Promise<Certification[]> {
  "use cache";
  cacheTag("certifications");
  cacheLife("hours");

  return requestOr<Certification[]>("/api/certifications", []);
}

/**
 * The roles, most recent first.
 *
 * About showed none of this before — the story was told in prose and the actual
 * employment history lived only on the résumé and the timeline. Where someone has
 * worked is the first thing most readers of an About page are looking for.
 */
export async function getExperience(): Promise<Experience[]> {
  "use cache";
  cacheTag("experience");
  cacheLife("hours");

  const roles = await requestOr<Experience[]>("/api/experience", []);

  return [...roles].sort((a, b) => b.startDate.localeCompare(a.startDate));
}
