import { cacheLife, cacheTag } from "next/cache";
import { ApiError, request, requestOr } from "@/lib/http";
import type { LearningItem, PostCard, PostDetail } from "@/lib/types";

export async function getPosts(): Promise<PostCard[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("hours");

  return requestOr<PostCard[]>("/api/posts", []);
}

export async function getPost(slug: string): Promise<PostDetail | null> {
  "use cache";
  cacheTag("posts", `post:${slug}`);
  cacheLife("hours");

  try {
    return await request<PostDetail>(`/api/posts/${slug}`);
  } catch (error) {
    // A missing or unpublished article is a 404 page, not a site error.
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    console.warn(`[chronicle] /api/posts/${slug} unavailable.`, error);
    return null;
  }
}

export async function getLearningItems(): Promise<LearningItem[]> {
  "use cache";
  cacheTag("learning");
  cacheLife("hours");

  return requestOr<LearningItem[]>("/api/learning", []);
}
