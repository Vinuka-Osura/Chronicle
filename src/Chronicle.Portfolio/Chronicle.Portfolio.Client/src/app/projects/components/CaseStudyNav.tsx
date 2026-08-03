import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@/components/Icon";
import type { ProjectCard } from "@/lib/types";

/**
 * The next and previous case study, in the order the page itself uses.
 *
 * A case study that ends at a back link asks the reader to go up a level and choose
 * again, and most of them will simply leave instead. Offering the neighbouring project
 * by name is the one piece of navigation on a portfolio that reliably turns one read
 * into two.
 *
 * The order is the list's own — featured, then whatever the editor set in the admin, then
 * most recent — so "next" here means the same thing it means on the index. Deriving it
 * from the same call rather than sorting again is what keeps that true.
 */
export function CaseStudyNav({
  projects,
  slug,
}: {
  projects: ProjectCard[];
  slug: string;
}) {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return null;

  const previous = index > 0 ? projects[index - 1] : null;
  const next = index < projects.length - 1 ? projects[index + 1] : null;

  // A single published project has no neighbours, and two empty halves of a nav is
  // worse than no nav.
  if (!previous && !next) return null;

  return (
    <nav className="case-nav rm-hide" aria-label="Other case studies">
      {previous ? (
        <Link href={`/projects/${previous.slug}`} className="case-nav-link is-previous">
          <span className="case-nav-label">
            <ArrowLeft />
            Previous
          </span>
          <span className="case-nav-title">{previous.title}</span>
        </Link>
      ) : (
        // Holds the column so a lone "next" does not slide to the left edge and read
        // as "previous".
        <span aria-hidden />
      )}

      {next && (
        <Link href={`/projects/${next.slug}`} className="case-nav-link is-next">
          <span className="case-nav-label">
            Next
            <ArrowRight />
          </span>
          <span className="case-nav-title">{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
