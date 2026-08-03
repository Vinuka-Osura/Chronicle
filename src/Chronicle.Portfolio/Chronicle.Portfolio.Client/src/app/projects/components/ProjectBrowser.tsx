"use client";

import { useDeferredValue, useId, useMemo, useState } from "react";
import { CardGrid } from "@/components/CardGrid";
import { Close, Search } from "@/components/Icon";
import type { ProjectCard as ProjectCardData } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";

type Sort = "curated" | "newest" | "oldest";

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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, technology or tag"
            className="browser-input"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
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
              onClick={() => setSort(option.key)}
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
            onClick={() => setTag(null)}
          />
          {tags.map(([value, count]) => (
            <FilterChip
              key={value}
              label={value}
              count={count}
              active={tag === value}
              onClick={() => setTag(tag === value ? null : value)}
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
        <CardGrid
          items={shown}
          keyOf={(project) => project.slug}
          className="projects-grid rm-grid"
        >
          {(project) => <ProjectCard project={project} />}
        </CardGrid>
      ) : (
        <div className="browser-empty">
          <p className="browser-empty-line">Nothing matches that.</p>
          <button type="button" className="browser-reset" onClick={() => { setQuery(""); setTag(null); }}>
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
