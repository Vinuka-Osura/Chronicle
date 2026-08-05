"use client";

import { useDeferredValue, useId, useMemo, useRef, useState } from "react";
import { CardGrid } from "@/components/CardGrid";
import { Close, Search } from "@/components/Icon";
import type { ProjectCard as ProjectCardData } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";

type Sort = "curated" | "newest" | "oldest";

/** Three full rows on the widest grid, so a page never ends on a row of one. */
const PER_PAGE = 9;

const SORTS: { key: Sort; label: string }[] = [
  { key: "curated", label: "Curated" },
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
];

/** Everything a search should look at. Built once per project, not per keystroke. */
function haystack(project: ProjectCardData): string {
  return [project.title, project.pitch, ...project.tags, ...project.techStack]
    .join(" ")
    .toLowerCase();
}

/**
 * Search, filter and sort over the already-fetched list.
 *
 * Client-side on purpose. The API supports `?tag=`, but re-fetching for a filter someone
 * is scrubbing through would be a round trip per keystroke on a list of a dozen projects.
 * Filtering in memory is instant; the server filter stays useful for deep links and for
 * anyone consuming the API directly.
 *
 * **Search covers the tech stack, not just the title.** Someone looking for "Postgres"
 * wants the projects that used it, and no title contains the word — matching only titles
 * would return nothing and read as "you have not done that", which is the opposite of
 * true.
 */
export function ProjectBrowser({ projects }: { projects: ProjectCardData[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>("curated");
  const searchId = useId();
  const gridRef = useRef<HTMLDivElement>(null);

  /*
    The typed value drives the input; a deferred copy drives the list.

    Without this, every keystroke re-runs the filter AND re-runs Motion's layout
    animation over the whole grid, and the input starts dropping characters on a slower
    machine. Deferring lets the field stay responsive and the grid catch up.
  */
  const deferred = useDeferredValue(query);

  const searchable = useMemo(
    () => projects.map((project) => ({ project, text: haystack(project) })),
    [projects],
  );

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      for (const value of project.tags) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    // Commonest first: the tag that filters least is the one most people want.
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [projects]);

  const shown = useMemo(() => {
    const needle = deferred.trim().toLowerCase();

    const matched = searchable
      .filter(({ project, text }) => {
        if (tag && !project.tags.includes(tag)) return false;
        if (!needle) return true;
        // Every word must appear somewhere, in any order — "postgres ledger" should
        // find the ledger project, and a strict phrase match would not.
        return needle.split(/\s+/).every((word) => text.includes(word));
      })
      .map(({ project }) => project);

    if (sort === "curated") return matched;

    const direction = sort === "newest" ? -1 : 1;
    return [...matched].sort(
      (a, b) => direction * a.startDate.localeCompare(b.startDate),
    );
  }, [searchable, deferred, tag, sort]);

  const filtering = Boolean(tag) || query.trim().length > 0;

  /*
    Pagination, and it is deliberately invisible until it is needed.

    Nine per page — three full rows on the widest grid, so a page never ends on a row of
    one. Below that threshold the controls do not render at all: a pager under a list of
    four is a control that can only ever say "1 of 1", which is furniture pretending to
    be a feature.

    The page resets whenever the filter or the sort changes, and it resets in the handlers
    that change them rather than in an effect watching them. An effect would be a second
    render pass to correct state the first pass already knew was wrong — which is what
    `react-hooks/set-state-in-effect` exists to catch.

    `current` is clamped independently, so a stale page can never render a blank grid even
    for one frame. The reset is about where the reader lands, not about correctness.
  */
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const current = Math.min(page, pages - 1);

  // Every filter change goes through one of these, so "reset to the first page" is
  // stated once rather than remembered at six call sites.
  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(0);
  };

  const changeTag = (value: string | null) => {
    setTag(value);
    setPage(0);
  };

  const changeSort = (value: Sort) => {
    setSort(value);
    setPage(0);
  };

  const visible = useMemo(
    () => (shown.length > PER_PAGE ? shown.slice(current * PER_PAGE, current * PER_PAGE + PER_PAGE) : shown),
    [shown, current],
  );

  const goTo = (next: number) => {
    setPage(next);
    // Back to the top of the grid, not the top of the document: the filters above stay
    // put, which is where someone paging through a filtered list is looking.
    gridRef.current?.scrollIntoView({
      behavior: globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  };

  return (
    <>
      <div className="browser rm-hide">
        <div className="browser-search">
          <Search className="browser-search-icon" />
          <label htmlFor={searchId} className="sr-only">
            Search projects by name, technology or tag
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder="Search by name, technology or tag"
            className="browser-input"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => changeQuery("")}
              className="browser-clear"
              aria-label="Clear search"
            >
              <Close />
            </button>
          )}
        </div>

        <div className="browser-sort" role="group" aria-label="Sort projects">
          {SORTS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => changeSort(option.key)}
              aria-pressed={sort === option.key}
              className="browser-sort-option"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {tags.length > 0 && (
        /* A group rather than a bare row of buttons: without the label a screen reader
           announces a dozen unrelated toggles and no reason for them. */
        <div role="group" aria-label="Filter projects by tag" className="browser-tags rm-hide">
          <FilterChip
            label="All"
            count={projects.length}
            active={tag === null}
            onClick={() => changeTag(null)}
          />
          {tags.map(([value, count]) => (
            <FilterChip
              key={value}
              label={value}
              count={count}
              active={tag === value}
              onClick={() => changeTag(tag === value ? null : value)}
            />
          ))}
        </div>
      )}

      {/* The count is on screen as well as announced. A filtered list that silently
          shows four of twelve looks like a list of four. */}
      <p className="browser-count rm-hide" aria-live="polite">
        {filtering ? (
          <>
            <strong>{shown.length}</strong> of {projects.length}
            {tag ? ` tagged ${tag}` : ""}
            {query.trim() ? ` matching “${query.trim()}”` : ""}
          </>
        ) : (
          <>
            <strong>{projects.length}</strong>{" "}
            {projects.length === 1 ? "case study" : "case studies"}
          </>
        )}
      </p>

      {/*
        The cards are h3, so without this the page jumps h1 to h3 and anyone navigating
        by heading loses the structure. Not visible, because the heading above already
        says it and repeating it on screen would be noise.
      */}
      <h2 className="sr-only">All projects</h2>

      {shown.length > 0 ? (
        <div ref={gridRef} className="scroll-mt-28">
          <CardGrid
            items={visible}
            keyOf={(project) => project.slug}
            className="projects-grid rm-grid"
          >
            {(project) => <ProjectCard project={project} />}
          </CardGrid>

          {pages > 1 && (
            <nav className="pager rm-hide" aria-label="Pages of projects">
              <button
                type="button"
                className="pager-step"
                onClick={() => goTo(current - 1)}
                disabled={current === 0}
              >
                <span aria-hidden>←</span> Previous
              </button>

              <ol className="pager-list">
                {Array.from({ length: pages }, (_, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      className="pager-page"
                      aria-current={i === current ? "page" : undefined}
                      onClick={() => goTo(i)}
                    >
                      <span className="sr-only">Page </span>
                      {i + 1}
                    </button>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                className="pager-step"
                onClick={() => goTo(current + 1)}
                disabled={current === pages - 1}
              >
                Next <span aria-hidden>→</span>
              </button>
            </nav>
          )}
        </div>
      ) : (
        <div className="browser-empty">
          <p className="browser-empty-line">Nothing matches that.</p>
          <button type="button" className="browser-reset" onClick={() => { changeQuery(""); changeTag(null); }}>
            Clear the filters
          </button>
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
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="browser-chip"
    >
      {label}
      <span className="browser-chip-count">{count}</span>
    </button>
  );
}
