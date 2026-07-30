import Link from "next/link";
import type { TimelineItem, TimelineItemType } from "@/lib/types";

const GLYPH: Record<TimelineItemType, string> = {
  experience: "●",
  project: "■",
  milestone: "▲",
  certification: "◆",
  roadmap: "○",
};

/** The word a reader sees. Shape alone never carries the meaning. */
const TYPE_LABEL: Record<TimelineItemType, string> = {
  experience: "Role",
  project: "Project",
  milestone: "Milestone",
  certification: "Certification",
  roadmap: "Goal",
};

function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function dateRange(start: string, end: string | null, isFuture: boolean): string {
  if (isFuture) return `target ${monthYear(start)}`;
  return end ? `${monthYear(start)} – ${monthYear(end)}` : `${monthYear(start)} – now`;
}

/**
 * One item on the timeline.
 *
 * `data-node` is what the lens CSS keys off, so filtering happens before hydration and
 * works with JavaScript disabled. `id` makes every node a scroll target for the
 * connections that reference it.
 */
export function TimelineNode({ item, isFuture }: { item: TimelineItem; isFuture: boolean }) {
  const isProject = item.type === "project" && item.slug;
  const nodeId = `node-${item.type}-${item.date}-${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  return (
    <li
      id={nodeId}
      data-node={item.type}
      data-track={item.track}
      className={`timeline-node group relative scroll-mt-32 ${
        item.track === "life" ? "lg:col-start-2" : "lg:col-start-1"
      }`}
    >
      {/* The dot on the spine. Hollow for anything that has not happened. */}
      <span
        aria-hidden
        className={`timeline-dot ${isFuture ? "is-future" : ""}`}
        data-glyph={GLYPH[item.type]}
      />

      <article
        className={`rounded-lg border bg-paper-raised p-4 transition-colors ${
          isFuture
            ? "border-dashed border-rule/70 text-ink-soft"
            : "border-rule hover:border-signal"
        }`}
      >
        <p className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.68rem] tracking-[0.12em] text-ink-faint uppercase">
          <span aria-hidden>{GLYPH[item.type]}</span>
          <span>{TYPE_LABEL[item.type]}</span>
          {item.category && <span>&middot; {item.category}</span>}
          {item.status && <span>&middot; {item.status.replace(/([a-z])([A-Z])/g, "$1 $2")}</span>}
          <span className="ms-auto normal-case">{dateRange(item.date, item.endDate, isFuture)}</span>
        </p>

        <h3 className="font-display text-base font-semibold text-ink">
          {isProject ? (
            <Link
              href={`/projects/${item.slug}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {item.title}
            </Link>
          ) : item.link ? (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="after:absolute after:inset-0 after:content-['']"
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </h3>

        {item.subtitle && <p className="text-sm text-ink-soft">{item.subtitle}</p>}
        {item.summary && <p className="rm-compact mt-2 text-sm text-ink-soft">{item.summary}</p>}

        {item.highlights.length > 0 && (
          <ul className="rm-compact mt-3 space-y-1 text-sm text-ink-soft">
            {item.highlights.map((highlight) => (
              <li key={highlight} className="flex gap-2">
                <span aria-hidden className="text-signal">
                  —
                </span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        )}

        {item.techStack.length > 0 && (
          <ul className="rm-hide mt-3 flex flex-wrap gap-1.5">
            {item.techStack.slice(0, 6).map((tech) => (
              <li
                key={tech}
                className="rounded border border-rule px-1.5 py-0.5 font-mono text-[0.7rem] text-ink-soft"
              >
                {tech}
              </li>
            ))}
          </ul>
        )}

        {/*
          Connections are links that scroll to their target, not decoration. Relying on
          a hover highlight alone would feel dead whenever the related node happened to
          be scrolled out of view.

          relative z-10 keeps them clickable above the card-wide overlay link.
        */}
        {item.connections.length > 0 && (
          <div className="rm-hide relative z-10 mt-3 border-t border-rule pt-3">
            <p className="mb-1.5 font-mono text-[0.62rem] tracking-[0.14em] text-ink-faint uppercase">
              Connects to
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {item.connections.map((connection) => (
                <li key={`${connection.kind}-${connection.title}`}>
                  <ConnectionChip connection={connection} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </li>
  );
}

function ConnectionChip({ connection }: { connection: TimelineItem["connections"][number] }) {
  const label = (
    <>
      {connection.title}
      <span className="ml-1 text-ink-faint">· {connection.via}</span>
    </>
  );

  // max-w-full + break-words: an article title plus its reason can be long, and at 360px
  // a single unbroken chip would push the page into horizontal scroll.
  const className =
    "inline-block max-w-full rounded border border-rule px-1.5 py-0.5 text-xs break-words text-ink-soft transition-colors hover:border-signal hover:text-ink";

  if (connection.kind === "project" && connection.slug) {
    return (
      <Link href={`/projects/${connection.slug}`} className={className}>
        {label}
      </Link>
    );
  }

  if (connection.kind === "article" && connection.slug) {
    return (
      <Link href={`/knowledge/${connection.slug}`} className={className}>
        {label}
      </Link>
    );
  }

  // A skill has no page of its own yet; the Skills page is the closest useful target.
  if (connection.kind === "skill") {
    return (
      <Link href="/skills" className={className}>
        {label}
      </Link>
    );
  }

  return <span className={`${className} cursor-default`}>{label}</span>;
}
