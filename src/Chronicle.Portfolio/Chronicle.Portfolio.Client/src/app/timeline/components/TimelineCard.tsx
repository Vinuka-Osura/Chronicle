import Link from "next/link";
import { anchorId } from "@/lib/anchor";
import type { TimelineConnection, TimelineItem } from "@/lib/types";

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
 * Where a connection points, or null when it points nowhere.
 *
 * Every kind the server actually emits resolves. `project` and `article` carry a real
 * slug; `skill` carries `slug: null` and does not need one, because its `title` IS the
 * skill's name — the same string the skill card is keyed on at the other end. So the
 * relationship the query already computed becomes navigable with no API change.
 *
 * `experience` is in the union and is never produced by any code path today. It returns
 * null rather than guessing, so if one ever is emitted it renders as the plain text it is
 * now instead of as a link to nowhere.
 */
function connectionHref(connection: TimelineConnection): string | null {
  if (connection.kind === "project" && connection.slug) {
    return `/projects/${connection.slug}`;
  }
  if (connection.kind === "article" && connection.slug) {
    return `/knowledge/${connection.slug}`;
  }
  if (connection.kind === "skill") {
    return `/skills#${anchorId("skill", connection.title)}`;
  }
  return null;
}

/**
 * One moment on the timeline.
 *
 * ── Why the whole card is no longer one link ──────────────────────────────────────
 *
 * It used to be: `<Link>` wrapped everything, which made the entire card one hit target.
 * That is the right instinct and the wrong mechanism — an `<a>` may not contain another
 * `<a>`, so every technology and every connection on the card was condemned to be plain
 * text. On a page whose entire argument is that these things are related, the relations
 * were the one part you could not follow.
 *
 * So the link moved onto the title and covers the card with a pseudo-element instead —
 * the pattern `.cert-link::after` already uses on the About page. The chips then lift
 * above that cover with `position: relative`, which is the only genuinely new piece. The
 * card keeps one accessible name, the whole surface stays clickable, and the chips are
 * real links rather than decoration.
 *
 * The 3D motion still lives entirely in CSS and is driven by scroll position, not by
 * JavaScript. That is what lets a card travel through depth for free on the compositor.
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
  const external = Boolean(!item.slug && item.link);

  return (
    <article
      className="timeline-card"
      data-side={side}
      data-type={item.type}
      data-future={future ? "true" : undefined}
      data-has-media={item.imageUrl ? "true" : undefined}
    >
      {item.imageUrl && (
        <div className="timeline-card-media">
          {/*
            A plain <img>, not next/image — the same decision, for the same reason, that
            `ProjectCard` documents.

            next/image routes through the optimizer at /_next/image?url=…, and the
            optimizer fetches that URL server-side rather than letting the browser follow
            it. Uploaded media is a relative /media/… path that only resolves through this
            app's rewrite to the API, and in development the API is https on a self-signed
            certificate — which the optimizer refuses, and reports as
            "url parameter is valid but internal response is invalid".

            There is nothing to optimise against here anyway: the URL comes from the CMS at
            request time, so no build-time knowledge exists, and configuring a remote loader
            for an unknown host is a bigger surface than the saving is worth.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl}
            alt=""
            width={800}
            height={450}
            // Below the fold by definition — the first card is already past the header.
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
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

        <h4 className="timeline-card-title">
          {href ? (
            // The accessible name is the title; the ::after on this link is what makes the
            // whole card the target.
            <Link
              href={href}
              className="timeline-card-hit"
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              {item.title}
            </Link>
          ) : (
            item.title
          )}
        </h4>

        {item.subtitle && <p className="timeline-card-subtitle">{item.subtitle}</p>}
        {item.summary && <p className="timeline-card-summary">{item.summary}</p>}

        {/* The stack, as destinations. Each lands on that skill's own card, where the
            years, the level and every other project that used it already live. */}
        {item.techStack.length > 0 && (
          <ul className="timeline-card-stack rm-hide">
            {item.techStack.slice(0, 5).map((tech) => (
              <li key={tech}>
                <Link
                  href={`/skills#${anchorId("skill", tech)}`}
                  className="timeline-card-chip"
                  title={`${tech} — see the skill`}
                >
                  {tech}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {item.connections.length > 0 && (
          <ul className="timeline-card-links rm-hide">
            {item.connections.slice(0, 2).map((connection) => {
              const to = connectionHref(connection);

              return (
                <li key={`${connection.kind}-${connection.title}`}>
                  <span className="timeline-card-via">{connection.via}</span>{" "}
                  {to ? (
                    <Link href={to} className="timeline-card-rel">
                      {connection.title}
                    </Link>
                  ) : (
                    connection.title
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}
