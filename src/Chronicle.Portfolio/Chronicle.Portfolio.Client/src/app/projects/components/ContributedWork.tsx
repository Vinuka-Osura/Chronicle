import type { ProjectCard as ProjectCardData } from "@/lib/types";
import { CardGrid } from "@/components/CardGrid";
import { ProjectCard } from "./ProjectCard";

/**
 * Work done for somebody else, grouped under whoever owns it.
 *
 * ── Why this is a section and not a filter ────────────────────────────────────────
 *
 * These could have been a tag in the browser above. They are not, because the
 * distinction is not a topic — it is a difference in what the reader is being shown.
 * A personal project is work the author is free to publish and free to have built badly;
 * work for a client was scoped by somebody else, constrained by their systems, and is
 * here only because they agreed it could be. Filing that under "Backend, Fintech" would
 * flatten the one thing about it a reader should know first.
 *
 * ── Why the owner's name is a heading ─────────────────────────────────────────────
 *
 * Grouping states the attribution once per organisation instead of repeating it on every
 * card, and it makes the shape of a career legible at a glance: four projects under one
 * employer reads as a tenure, where four cards scattered through a grid reads as four
 * unrelated things.
 *
 * ── The permission line is not decoration ─────────────────────────────────────────
 *
 * Naming a real company on a public page is a claim about that company. The note beside
 * the name is what says they agreed to it, and it is rendered verbatim rather than
 * summarised into a badge — "Approved for portfolio use by X" is something a reader can
 * weigh, where a green tick is a claim with no author behind it.
 *
 * It cannot be missing: the API guarantees a permission note wherever there is an owner,
 * and a database check constraint guarantees that in turn.
 */
export function ContributedWork({
  groups,
}: {
  groups: { owner: string; projects: ProjectCardData[] }[];
}) {
  if (groups.length === 0) return null;

  return (
    <section className="scene" data-scene="For others" aria-labelledby="contributed-heading">
      <p className="scene-eyebrow">For others</p>
      <h2 id="contributed-heading" className="scene-heading">
        Work I did not own, shown with permission.
      </h2>

      <p className="contributed-lede rm-compact">
        Built inside somebody else&rsquo;s systems, to their requirements. Each of these is
        here because the organisation that owns it agreed it could be — the source is
        theirs and is not linked, so what is written up is the problem, the approach and
        what changed.
      </p>

      {groups.map((group) => (
        <section key={group.owner} className="contributed-group">
          <header className="contributed-owner">
            <h3 className="contributed-owner-name">{group.owner}</h3>
            <p className="contributed-count">
              {group.projects.length}{" "}
              {group.projects.length === 1 ? "project" : "projects"}
            </p>
          </header>

          <CardGrid
            items={group.projects}
            keyOf={(project) => project.slug}
            className="projects-grid rm-grid"
          >
            {(project) => <ProjectCard project={project} />}
          </CardGrid>
        </section>
      ))}
    </section>
  );
}
