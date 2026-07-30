"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PostCard } from "@/lib/types";

function published(iso: string | null): string {
  if (!iso) return "Unpublished";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Articles, filterable by tag in the browser.
 *
 * Same reasoning as the projects list: the API supports `?tag=`, but a filter someone is
 * scrubbing through should not cost a round trip each time. The server filter remains
 * the one that matters for deep links.
 */
export function ArticleList({ posts }: { posts: PostCard[] }) {
  const [active, setActive] = useState<string | null>(null);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [posts]);

  const shown = active ? posts.filter((p) => p.tags.includes(active)) : posts;

  return (
    <section aria-labelledby="articles-heading" className="mb-16">
      <h2 id="articles-heading" className="mb-2 text-xl font-semibold">
        Articles
      </h2>
      <p className="rm-compact mb-5 max-w-prose text-sm text-ink-soft">
        Write-ups on problems worth explaining properly — mostly ledgers, correctness and
        the things that turned out harder than they looked.
      </p>

      {tags.length > 0 && (
        <div className="rm-hide mb-5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-pressed={active === null}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              active === null
                ? "border-signal bg-signal-soft text-ink"
                : "border-rule text-ink-soft hover:border-ink-soft hover:text-ink"
            }`}
          >
            All {posts.length}
          </button>
          {tags.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActive(active === tag ? null : tag)}
              aria-pressed={active === tag}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                active === tag
                  ? "border-signal bg-signal-soft text-ink"
                  : "border-rule text-ink-soft hover:border-ink-soft hover:text-ink"
              }`}
            >
              {tag}
              <span className={active === tag ? "text-signal" : "text-ink-faint"}>{count}</span>
            </button>
          ))}
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        Showing {shown.length} of {posts.length} articles{active ? ` tagged ${active}` : ""}.
      </p>

      {shown.length > 0 ? (
        <ul className="rm-grid grid gap-3">
          {shown.map((post) => (
            <li key={post.slug}>
              <article className="group relative rounded-lg border border-rule bg-paper-raised p-4 transition-colors hover:border-signal">
                <p className="mb-1.5 flex flex-wrap items-center gap-x-2 font-mono text-[0.68rem] tracking-[0.12em] text-ink-faint uppercase">
                  <span>{published(post.publishedAt)}</span>
                  <span aria-hidden>&middot;</span>
                  <span>{post.readingTimeMinutes} min read</span>
                </p>

                <h3 className="mb-1 font-display text-lg font-semibold text-ink">
                  <Link
                    href={`/knowledge/${post.slug}`}
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    {post.title}
                  </Link>
                </h3>

                <p className="rm-compact text-sm text-ink-soft">{post.excerpt}</p>

                {post.tags.length > 0 && (
                  <ul className="rm-hide mt-3 flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded border border-rule px-1.5 py-0.5 font-mono text-[0.7rem] text-ink-soft"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-rule p-6 text-sm text-ink-soft">
          Nothing published yet.
        </p>
      )}
    </section>
  );
}
