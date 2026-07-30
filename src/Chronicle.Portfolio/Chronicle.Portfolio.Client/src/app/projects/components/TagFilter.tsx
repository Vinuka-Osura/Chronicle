"use client";

import { useMemo, useState } from "react";
import type { ProjectCard as ProjectCardData } from "@/lib/types";
import { CardGrid } from "@/components/CardGrid";
import { ProjectCard } from "./ProjectCard";

/**
 * Tag filtering over the already-fetched list.
 *
 * Client-side on purpose. The server supports `?tag=`, but re-fetching for a filter the
 * visitor is scrubbing through would mean a round trip per click on a list of a dozen
 * projects. Filtering in memory is instant; the API filter stays useful for deep links
 * and for anyone consuming it directly.
 */
export function TagFilter({ projects }: { projects: ProjectCardData[] }) {
  const [active, setActive] = useState<string | null>(null);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      for (const tag of project.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    // Commonest first: the tag that filters least is the one most people want.
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [projects]);

  const shown = active ? projects.filter((p) => p.tags.includes(active)) : projects;

  return (
    <>
      {tags.length > 0 && (
        <>
          {/* A group rather than a bare row of buttons: without the label, a screen
              reader announces eleven unrelated toggles and no reason for them. */}
          <div
            role="group"
            aria-label="Filter projects by tag"
            className="rm-hide mb-6 flex flex-wrap items-center gap-1.5"
          >
            <FilterChip
              label="All"
              count={projects.length}
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

          {/* Announced politely so a screen-reader user hears the list change without the
              filter stealing focus mid-click. */}
          <p aria-live="polite" className="sr-only">
            Showing {shown.length} of {projects.length} projects
            {active ? ` tagged ${active}` : ""}.
          </p>
        </>
      )}

      {/*
        The cards are h3, so without this the page jumps h1 to h3 and anyone navigating
        by heading loses the structure. Not visible, because the h1 directly above
        already says "Projects" and repeating it on screen would be noise.
      */}
      <h2 className="sr-only">All projects</h2>

      <CardGrid
        items={shown}
        keyOf={(project) => project.slug}
        className="rm-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {(project) => <ProjectCard project={project} />}
      </CardGrid>
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-signal bg-signal-soft text-ink"
          : "border-rule text-ink-soft hover:border-ink-soft hover:text-ink"
      }`}
    >
      {label}
      <span className={active ? "text-signal" : "text-ink-faint"}>{count}</span>
    </button>
  );
}
