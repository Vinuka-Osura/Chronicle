"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { CardGrid } from "@/components/CardGrid";
import { Close, Search } from "@/components/Icon";
import type { ArticleLink, PostCard } from "@/lib/types";
import { searchPosts } from "../search";
import { ArticleCard, fromLink, fromPost, type Article } from "./ArticleCard";

/**
 * Articles from both sources, searchable and filterable by tag.
 *
 * Two different mechanisms on purpose. The tag filter runs in memory, because a chip
 * someone is toggling should not cost a round trip. Full-text search goes to the server,
 * because it reads the article bodies, which are not on this page and should not be.
 *
 * **Search reaches hosted articles only, and the count line says so.** Postgres cannot
 * index a body it does not have, and an article published on Medium leaves only its title
 * and a two-line summary here. Quietly dropping external articles from a result set would
 * teach the reader that they do not exist; saying it costs one clause.
 */
export function ArticleList({
  posts,
  external,
}: {
  posts: PostCard[];
  external: ArticleLink[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const searchId = useId();

  /**
   * The last answer, tagged with the term it answers.
   *
   * Storing the term alongside the results is what lets everything else be *derived*
   * rather than kept in sync. "Is a search showing" and "is one in flight" are then facts
   * about the current input, not two more pieces of state that can disagree with it — and
   * nothing has to be reset when the box is cleared.
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

  /*
    One list from two sources, newest first.

    Sorted rather than concatenated: a reader wants what was written, in the order it was
    written, and grouping by where it happens to be hosted would be organising the archive
    around a fact about infrastructure.
  */
  const everything = useMemo<Article[]>(
    () =>
      [...posts.map(fromPost), ...external.map(fromLink)].sort((a, b) =>
        (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
      ),
    [posts, external],
  );

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const article of everything) {
      for (const tag of article.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    // Commonest first: the tag that filters least is the one most people want.
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [everything]);

  // Search wins when it is running. Combining the two would mean explaining to the reader
  // why a term that clearly appears in an article did not show up — because a tag chip
  // they set two minutes ago was still on.
  const shown = results
    ? results.map(fromPost)
    : active
      ? everything.filter((a) => a.tags.includes(active))
      : everything;

  return (
    <>
      {/*
        The controls arrive in sequence as the scene does — scroll-driven CSS, so they
        reverse on the way back up. The grid below is deliberately NOT in here: its cards
        are Motion-animated so they can move into each other's places when a filter
        changes, and a CSS transform on the same elements would fight Motion's inline one.
      */}
      <div className="article-controls" data-stagger data-slide>
        <div className="browser rm-hide">
          <div className="browser-search">
            <Search className="browser-search-icon" />
            <label htmlFor={searchId} className="sr-only">
              Search articles by title, summary or full text
            </label>
            <input
              id={searchId}
              type="search"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search titles, summaries and full text"
              className="browser-input"
              autoComplete="off"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm("")}
                className="browser-clear"
                aria-label="Clear search"
              >
                <Close />
              </button>
            )}
          </div>
        </div>

        <p className="article-search-help rm-hide">
          Understands quoted &ldquo;exact phrases&rdquo;, <code>OR</code>, and a leading{" "}
          <code>-</code> to exclude a word.
        </p>

        {tags.length > 0 && results === null && (
          /* A group rather than a bare row of buttons: without the label a screen reader
             announces a dozen unrelated toggles and no reason for them. */
          <div role="group" aria-label="Filter articles by tag" className="browser-tags rm-hide">
            <FilterChip
              label="All"
              count={everything.length}
              active={active === null}
              onClick={() => setActive(null)}
            />
            {tags.map(([tag, count]) => (
              <FilterChip
                key={tag}
                label={tag}
                count={count}
                active={active === tag}
                onClick={() => setActive(active === tag ? null : tag)}
              />
            ))}
          </div>
        )}

        {/* The count is on screen as well as announced. A filtered list that silently
            shows four of twelve looks like a list of four. */}
        <p className="browser-count" aria-live="polite">
          {results !== null ? (
            <>
              <strong>{results.length}</strong>{" "}
              {results.length === 1 ? "result" : "results"} for “{query}”
              {results.length > 0 && ", best match first"}
              {". "}
              {/* Stated, not silently applied. Postgres cannot index a body that lives on
                  somebody else's site, so a search that quietly omitted them would teach
                  the reader they do not exist. */}
              {external.length > 0 && (
                <span className="browser-caveat">
                  Search covers articles hosted here, not the {external.length} published
                  elsewhere.{" "}
                </span>
              )}
              <button type="button" onClick={() => setTerm("")} className="browser-reset">
                Clear
              </button>
            </>
          ) : (
            <>
              <strong>{shown.length}</strong>
              {shown.length !== everything.length && ` of ${everything.length}`}{" "}
              {shown.length === 1 ? "article" : "articles"}
              {active ? ` tagged ${active}` : ""}
            </>
          )}
        </p>
      </div>

      {shown.length > 0 ? (
        /* While a new search is in flight the previous results are held at reduced opacity
           rather than replaced by a skeleton: the layout does not jump, and the old answer
           stays readable until a better one arrives. */
        <div className={`article-results${searching ? " is-searching" : ""}`}>
          <CardGrid items={shown} keyOf={(a) => a.key} className="article-grid rm-grid">
            {(article) => <ArticleCard article={article} />}
          </CardGrid>
        </div>
      ) : (
        <div className="browser-empty">
          <p className="browser-empty-line">
            {results !== null ? `Nothing matches “${query}”.` : "Nothing published yet."}
          </p>
          {(results !== null || active) && (
            <button
              type="button"
              className="browser-reset"
              onClick={() => {
                setTerm("");
                setActive(null);
              }}
            >
              Clear the filters
            </button>
          )}
        </div>
      )}
    </>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="browser-chip">
      {label}
      <span className="browser-chip-count">{count}</span>
    </button>
  );
}
