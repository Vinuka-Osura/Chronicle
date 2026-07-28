import { cacheLife, cacheTag } from "next/cache";
import type { ProjectCard, ProjectDetail } from "./types";

/**
 * Typed client over the Chronicle read-only API.
 *
 * In development the Aspire AppHost injects the server's address as
 * NEXT_PUBLIC_API_BASE_URL, so nothing here hardcodes a port that can drift.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5080";

class ApiError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`GET ${path} responded ${status}`);
    this.name = "ApiError";
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new ApiError(path, response.status);
  }

  return (await response.json()) as T;
}

/**
 * Content endpoints degrade to an empty result instead of throwing.
 *
 * The alternative is that `next build` fails whenever the API happens to be
 * unreachable - which is the normal case in CI, where the frontend is built without a
 * database behind it. A page that renders its empty state is a better failure than a
 * build that cannot run at all, and the warning still names what broke.
 */
async function requestOr<T>(path: string, fallback: T): Promise<T> {
  try {
    return await request<T>(path);
  } catch (error) {
    console.warn(
      `[chronicle] ${path} unavailable, rendering empty state.`,
      error instanceof Error ? error.message : error,
    );
    return fallback;
  }
}

export async function getProjects(filter?: {
  tag?: string;
  featured?: boolean;
}): Promise<ProjectCard[]> {
  "use cache";
  // Tagged so the whole page can be revalidated when the CMS publishes a change.
  cacheTag("projects");
  cacheLife("hours");

  const query = new URLSearchParams();
  if (filter?.tag) query.set("tag", filter.tag);
  if (filter?.featured !== undefined) query.set("featured", String(filter.featured));

  const suffix = query.size > 0 ? `?${query}` : "";
  return requestOr<ProjectCard[]>(`/api/projects${suffix}`, []);
}

export async function getProject(slug: string): Promise<ProjectDetail | null> {
  "use cache";
  cacheTag("projects", `project:${slug}`);
  cacheLife("hours");

  try {
    return await request<ProjectDetail>(`/api/projects/${slug}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    console.warn(`[chronicle] /api/projects/${slug} unavailable.`, error);
    return null;
  }
}
