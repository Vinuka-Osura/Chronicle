import Link from "next/link";
import type { ProjectCard as ProjectCardData } from "@/lib/types";

function formatRange(start: string, end: string | null): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  return end ? `${format(start)} – ${format(end)}` : `${format(start)} – ongoing`;
}

/**
 * A stable number from a string. Same slug, same plate, for ever.
 *
 * djb2, because it is four lines and the requirement is only that it spreads evenly and
 * never changes — not that it resists anything.
 */
function hash(text: string): number {
  let value = 5381;
  for (let index = 0; index < text.length; index += 1) {
    value = ((value << 5) + value + text.charCodeAt(index)) | 0;
  }
  return Math.abs(value);
}

/**
 * The plate: a project's picture, or a generated stand-in until there is one.
 *
 * Every project here has `thumbnailUrl: null` today, and a card built around an image
 * that does not exist is a card with a hole in it. So the fallback is not a placeholder
 * box — it is a figure derived from the slug: a hue offset, a rotation and a stripe
 * frequency, all deterministic. Two projects never collide by accident, the same project
 * looks the same on every visit and on every device, and none of it claims to be a
 * screenshot.
 *
 * The moment a real thumbnail is uploaded through the CMS it takes over, with no code
 * change.
 */
function Plate({ project, index }: { project: ProjectCardData; index: number }) {
  if (project.thumbnailUrl) {
    return (
      <span className="card-plate">
        {/*
          A plain <img>, not next/image. The URL comes from the CMS at request time and
          points at object storage, so there is no build-time knowledge to optimise
          against — and configuring a remote loader for an unknown host is a bigger
          surface than the saving is worth at this size.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="card-plate-image"
        />
      </span>
    );
  }

  const seed = hash(project.slug);

  return (
    <span
      className="card-plate card-plate-generated"
      style={
        {
          "--plate-hue": `${seed % 60}deg`,
          "--plate-turn": `${(seed % 7) * 9 - 27}deg`,
          "--plate-gap": `${8 + (seed % 5) * 3}px`,
        } as React.CSSProperties
      }
      aria-hidden
    >
      <span className="card-plate-index">{String(index + 1).padStart(2, "0")}</span>
    </span>
  );
}

/**
 * One project, as a card.
 *
 * The previous version was a bordered box of text — title, pitch, dates, chips — and it
 * read as a search result rather than as a piece of work. The changes that matter are
 * structural rather than decorative: something to look at before you read, a clear
 * first line, and everything administrative demoted to a hairline row at the bottom
 * where it can be found and not have to be read.
 *
 * `index` is presentational, not data: it numbers the card within its grid.
 */
export function ProjectCard({
  project,
  index = 0,
}: {
  project: ProjectCardData;
  index?: number;
}) {
  return (
    <article className="card group">
      <Plate project={project} index={index} />

      <div className="card-body">
        <div className="card-head">
          <h3 className="card-title">
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

          {project.featured && <span className="card-flag rm-hide">Featured</span>}
        </div>

        <p className="card-pitch">{project.pitch}</p>

        <div className="card-foot">
          <span className="card-dates">{formatRange(project.startDate, project.endDate)}</span>

          {project.techStack.length > 0 && (
            <ul className="card-stack">
              {project.techStack.slice(0, 4).map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
              {project.techStack.length > 4 && (
                <li className="card-stack-more">+{project.techStack.length - 4}</li>
              )}
            </ul>
          )}

          {/* Moves on hover. The one piece of decoration here, and it is pointing at
              where the card goes. */}
          <span className="card-arrow" aria-hidden>
            →
          </span>
        </div>
      </div>
    </article>
  );
}
