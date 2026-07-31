import type { Timeline, TimelineEra, TimelineItem } from "@/lib/types";
import { TimelineCard } from "./TimelineCard";

/**
 * Groups items into eras, then years within an era, preserving chronological order.
 *
 * Items with no era are not dropped — they collect under a null-era group, so a gap in
 * the era list can never lose content.
 */
export interface EraGroup {
  era: TimelineEra | null;
  years: { year: string; items: TimelineItem[] }[];
}

export function groupByEra(timeline: Timeline): EraGroup[] {
  const byId = new Map(timeline.eras.map((e) => [e.id, e]));
  const groups: EraGroup[] = [];

  for (const item of timeline.items) {
    const era = item.eraId ? (byId.get(item.eraId) ?? null) : null;
    const year = item.date.slice(0, 4);

    let group = groups.at(-1);
    if (!group || group.era?.id !== era?.id) {
      group = { era, years: [] };
      groups.push(group);
    }

    let yearGroup = group.years.at(-1);
    if (!yearGroup || yearGroup.year !== year) {
      yearGroup = { year, items: [] };
      group.years.push(yearGroup);
    }

    yearGroup.items.push(item);
  }

  return groups;
}

const itemKey = (item: TimelineItem) => `${item.type}-${item.date}-${item.title}`;

/**
 * The timeline as a journey rather than a list.
 *
 * Every card, the path and the era names move on scroll, and all of it is CSS —
 * `timeline.css` holds the motion. Nothing here measures anything or runs per frame,
 * which is what keeps this smooth with forty cards on a phone.
 *
 * Layout is one column below `lg` and two tracks either side of the path above it, with
 * career on the left and life on the right. At narrow widths two ~350px columns plus a
 * path is worse than one column, so the tracks merge and the card's own glyph carries
 * which side it came from.
 */
export function TimelineStream({ timeline }: { timeline: Timeline }) {
  const groups = groupByEra(timeline);
  const today = timeline.today;

  // The boundary goes before the first future item, so it lands in true chronological
  // position. Resolved to a key up front rather than tracked with a mutable flag during
  // the map: reassigning mid-render is unsafe once React can pause and resume.
  const firstFuture = timeline.items.find((i) => i.date > today);
  const boundaryKey = firstFuture ? itemKey(firstFuture) : null;

  return (
    <div id="timeline-start" data-timeline className="timeline-stage relative">
      <div className="timeline-path" aria-hidden />

      {groups.map((group) => (
        <section
          key={group.era?.id ?? "unplaced"}
          className="timeline-era relative"
          aria-labelledby={group.era ? `era-${group.era.id}` : undefined}
        >
          {group.era && (
            <>
              {/* Decorative, and enormous. The chapter name you are inside, drifting
                  behind the content at a different rate — which is most of the reason
                  the scene reads as having depth. */}
              <span className="timeline-era-ghost" aria-hidden>
                {group.era.name}
              </span>

              <header className="timeline-era-head">
                <h2
                  id={`era-${group.era.id}`}
                  className="text-section font-semibold text-ink"
                >
                  <a href={`#era-${group.era.id}`} className="hover:text-signal">
                    {group.era.name}
                  </a>
                </h2>
                {group.era.tagline && (
                  <p className="text-sm text-ink-soft">{group.era.tagline}</p>
                )}
              </header>
            </>
          )}

          {group.years.map((yearGroup) => (
            <div key={`${group.era?.id ?? "none"}-${yearGroup.year}`} className="relative">
              <h3
                id={`year-${yearGroup.year}`}
                className="timeline-year"
                aria-label={`Year ${yearGroup.year}`}
              >
                {yearGroup.year}
              </h3>

              <ul className="timeline-items">
                {yearGroup.items.map((item) => {
                  const side = item.track === "life" ? "right" : "left";

                  return (
                    <li
                      key={itemKey(item)}
                      className="timeline-slot"
                      data-side={side}
                      // The lens filter hides by node type, and it hides the whole slot
                      // so the dot on the path goes with the card rather than being left
                      // behind pointing at nothing.
                      data-node={item.type}
                    >
                      {itemKey(item) === boundaryKey && (
                        <p className="timeline-today">
                          <span aria-hidden>—</span> today <span aria-hidden>—</span>
                          <span className="timeline-today-note">
                            everything below is a stated intention
                          </span>
                        </p>
                      )}

                      <TimelineCard item={item} side={side} />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
