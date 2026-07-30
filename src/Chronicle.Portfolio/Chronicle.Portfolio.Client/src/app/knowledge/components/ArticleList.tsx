"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PostCard } from "@/lib/types";
import { searchPosts } from "../search";

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
  const [term, setTerm] = useState("");

  /**
   * The last answer, tagged with the term it answers.
   *
   * Storing the term alongside the results is what lets everything else be *derived*
   * rather than kept in sync. "Is a search showing" and "is one in flight" are then
   * facts about the current input, not two more pieces of state that can disagree with
   * it — and nothing has to be reset when the box is cleared.
   */
  const [answer, setAnswer] = useState<{ term: string; results: PostCard[] } | null>(null);

  const query = term.trim();

  // Two characters, because one letter matches most of the archive and the request is
  // wasted before the visitor has said anything.
  const searchActive = query.length >= 2;
  const results = searchActive && answer?.term === query ? answer.results : null;
  const searching = searchActive && answer?.term !== query;

  /*
    Debounced, with stale responses discarded.

    Without the `cancelled` flag a slow request for "cach" can land after a fast one for
    "caching" and overwrite newer results with older ones — the race that makes a search
    box feel haunted.
  */
  useEffect(() => {
    if (!searchActive) {
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      const found = await searchPosts(query);
      if (!cancelled) {
        setAnswer({ term: query, results: found });
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, searchActive]);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [posts]);

  // Search wins when it is running. Combining the two would mean explaining to the
  // reader why a term that clearly appears in an article did not show up - because a
  // tag chip they set two minutes ago was still on.
  const shown = results ?? (active ? posts.filter((p) => p.tags.includes(active)) : posts);

  return (
    <section aria-labelledby="articles-heading" className="mb-16">
      <h2 id="articles-heading" className="mb-2 text-xl font-semibold">
        Articles
      </h2>
      <p className="rm-compact mb-5 max-w-prose text-sm text-ink-soft">
        Write-ups on problems worth explaining properly — mostly ledgers, correctness and
        the things that turned out harder than they looked.
      </p>

      <div className="rm-hide mb-5">
        <label htmlFor="article-search" className="sr-only">
          Search articles
        </label>
        <input
          id="article-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search articles…"
          className="field-input max-w-md"
          autoComplete="off"
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          Searches titles, summaries and full text. Understands quoted
          &ldquo;exact phrases&rdquo;, <code>OR</code>, and a leading <code>-</code> to
          exclude a word.
        </p>
      </div>

      {results !== null && (
        <p className="mb-5 text-sm text-ink-soft">
          {results.length === 0
            ? `Nothing matches “${query}”.`
            : `${results.length} result${results.length === 1 ? "" : "s"} for “${query}”, best match first.`}{" "}
          <button
            type="button"
            onClick={() => setTerm("")}
            className="text-signal underline underline-offset-2"
          >
            Clear
          </button>
        </p>
      )}

      {tags.length > 0 && results === null && (
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
        {results !== null
          ? `${results.length} search results for ${query}.`
          : `Showing ${shown.length} of ${posts.length} articles${active ? ` tagged ${active}` : ""}.`}
      </p>

      {/* While a new search is in flight the previous results are held at reduced
          opacity rather than replaced by a skeleton: the layout does not jump, and the
          old answer stays readable until a better one arrives. */}
      {shown.length > 0 ? (
        <ul
          className={`rm-grid grid gap-3 transition-opacity ${searching ? "opacity-60" : ""}`}
        >
          {shown.map((post) => (
            <li key={post.slug}>
              <article className="group relative surface surface-interactive p-4">
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
