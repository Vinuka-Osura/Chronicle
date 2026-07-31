import Image from "next/image";
import Link from "next/link";
import type { TimelineItem } from "@/lib/types";

const GLYPH: Record<string, string> = {
  experience: "●",
  project: "■",
  certification: "◆",
  milestone: "▲",
  roadmap: "○",
};

const KIND: Record<string, string> = {
  experience: "Role",
  project: "Project",
  certification: "Certification",
  milestone: "Life",
  roadmap: "Goal",
};

function when(item: TimelineItem): string {
  const format = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  if (!item.endDate) return format(item.date);
  return `${format(item.date)} – ${format(item.endDate)}`;
}

/**
 * One moment on the timeline.
 *
 * The card is the thing that had to change. A bordered box of text next to a rule reads
 * as a CV with a line drawn down it, however well the type is set — so this leads with
 * the picture where there is one, and the picture is large enough to be worth looking at
 * rather than a thumbnail apologising for itself.
 *
 * The 3D motion lives entirely in CSS (`timeline-card` in globals.css) and is driven by
 * scroll position, not by JavaScript. That is what lets a card travel through depth for
 * free on the compositor.
 */
export function TimelineCard({
  item,
  side,
}: {
  item: TimelineItem;
  side: "left" | "right";
}) {
  const future = item.type === "roadmap";
  const href = item.slug ? `/projects/${item.slug}` : item.link;

  const body = (
    <>
      {item.imageUrl && (
        <div className="timeline-card-media">
          <Image
            src={item.imageUrl}
            alt=""
            width={800}
            height={450}
            className="h-full w-full object-cover"
            // Below the fold by definition — the first card is already past the header.
            loading="lazy"
            sizes="(min-width: 64rem) 26rem, 100vw"
          />
          {item.videoUrl && (
            <span className="timeline-card-play" aria-hidden>
              ▶
            </span>
          )}
        </div>
      )}

      <div className="timeline-card-body">
        <p className="timeline-card-meta">
          <span aria-hidden className="timeline-card-glyph">
            {GLYPH[item.type] ?? "●"}
          </span>
          <span>{KIND[item.type] ?? item.type}</span>
          <span aria-hidden>·</span>
          <span>{when(item)}</span>
          {future && <span className="timeline-card-goal">not yet</span>}
        </p>

        <h4 className="timeline-card-title">{item.title}</h4>

        {item.subtitle && <p className="timeline-card-subtitle">{item.subtitle}</p>}
        {item.summary && <p className="timeline-card-summary">{item.summary}</p>}

        {item.techStack.length > 0 && (
          <p className="timeline-card-stack rm-hide">
            {item.techStack.slice(0, 5).join(" · ")}
          </p>
        )}

        {item.connections.length > 0 && (
          <ul className="timeline-card-links rm-hide">
            {item.connections.slice(0, 2).map((connection) => (
              <li key={`${connection.kind}-${connection.title}`}>
                <span className="timeline-card-via">{connection.via}</span>{" "}
                {connection.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  return (
    <article
      className="timeline-card"
      data-side={side}
      data-type={item.type}
      data-future={future ? "true" : undefined}
      data-has-media={item.imageUrl ? "true" : undefined}
    >
      {href ? (
        // The whole card is the target. A link that is only the title is a smaller thing
        // to hit than the thing it describes.
        <Link href={href} className="timeline-card-hit">
          {body}
        </Link>
      ) : (
        body
      )}
    </article>
  );
}
