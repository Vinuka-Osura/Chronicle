import { cacheLife, cacheTag } from "next/cache";
import { ApiError, query, request, requestOr } from "@/lib/http";
import type { ProjectCard, ProjectDetail } from "@/lib/types";

/**
 * Fetchers for the Projects feature.
 *
 * Cache tags mirror the server's output-cache tags, so the two layers invalidate on the
 * same vocabulary rather than drifting apart.
 */

export async function getProjects(filter?: {
  tag?: string;
  featured?: boolean;
}): Promise<ProjectCard[]> {
  "use cache";
  cacheTag("projects");
  cacheLife("hours");

  const suffix = query({ tag: filter?.tag, featured: filter?.featured });
  return requestOr<ProjectCard[]>(`/api/projects${suffix}`, []);
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  "use cache";
  cacheTag("projects", `project:${slug}`);
  cacheLife("hours");

  try {
    return await request<ProjectDetail>(`/api/projects/${slug}`);
  } catch (error) {
    // A missing project is a 404 page, not a site error.
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    console.warn(`[chronicle] /api/projects/${slug} unavailable.`, error);
    return null;
  }
}
