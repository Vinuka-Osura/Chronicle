import { requestOr } from "@/lib/http";
import type { PostCard } from "@/lib/types";

/**
 * Ranked search, run in the browser as the visitor types.
 *
 * Deliberately *not* in `api.ts`: everything there carries `use cache`, which makes it
 * server-only. This one is called from a client component and must not be cached anyway
 * — the whole point is that the answer changes with every keystroke.
 *
 * Unlike the tag filter, this cannot be done client-side. The server ranks by relevance
 * and stems words, so "caching" finds "cached" and an article *about* a subject outranks
 * one that mentions it once in passing. Substring matching in JavaScript does neither.
 */
export function searchPosts(term: string): Promise<PostCard[]> {
  return requestOr<PostCard[]>(`/api/posts/search?q=${encodeURIComponent(term)}`, []);
}
