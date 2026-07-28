import Link from "next/link";
import type { ProjectCard as ProjectCardData } from "@/lib/types";

function formatRange(start: string, end: string | null): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
    });

  return end ? `${format(start)} – ${format(end)}` : `${format(start)} – ongoing`;
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <article className="group relative flex flex-col rounded-lg border border-rule bg-paper-raised p-5 transition-colors hover:border-signal">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">
          {/*
            The whole card is clickable via the ::after overlay, but the anchor wraps
            only the title so screen readers announce a sensibly named link rather than
            the card's entire contents.
          */}
          <Link
            href={`/projects/${project.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {project.title}
          </Link>
        </h3>

        {project.featured && (
          <span className="rm-hide shrink-0 rounded-full bg-signal-soft px-2 py-0.5 font-mono text-[0.65rem] tracking-wider text-signal uppercase">
            Featured
          </span>
        )}
      </div>

      <p className="mb-3 text-sm text-ink-soft">{project.pitch}</p>

      <p className="mb-4 font-mono text-xs text-ink-faint">
        {formatRange(project.startDate, project.endDate)}
      </p>

      {project.techStack.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-1.5">
          {project.techStack.slice(0, 6).map((tech) => (
            <li
              key={tech}
              className="rounded border border-rule px-1.5 py-0.5 font-mono text-[0.7rem] text-ink-soft"
            >
              {tech}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
