import type { Timeline, TimelineEra, TimelineItem } from "@/lib/types";
import { TimelineNode } from "./TimelineNode";

/**
 * Groups items into eras, then years within an era, preserving chronological order and
 * inserting the today boundary at the right place.
 *
 * Items with no era are not dropped — they collect under a null-era group so a gap in
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

export function TimelineStream({ timeline }: { timeline: Timeline }) {
  const groups = groupByEra(timeline);
  const today = timeline.today;

  // The first future item is where the boundary goes, so it lands in correct
  // chronological position rather than pinned somewhere arbitrary.
  //
  // Resolved to a key up front rather than tracked with a mutable flag during the map:
  // reassigning a variable mid-render is unsafe once React can pause and resume a render,
  // and react-hooks/immutability is right to reject it.
  const firstFuture = timeline.items.find((i) => i.date > today);
  const boundaryKey = firstFuture ? itemKey(firstFuture) : null;

  return (
    <div id="timeline-start" className="relative">
      {/* The spine. Decorative: the ordered lists below carry the actual structure. */}
      <span aria-hidden className="timeline-spine" />

      {groups.map((group) => (
        <section
          key={group.era?.id ?? "no-era"}
          aria-labelledby={group.era ? `era-${group.era.id}` : undefined}
          className="timeline-era"
        >
          {group.era ? (
            <header
              id={`era-${group.era.id}`}
              data-era-marker={group.era.id}
              className="timeline-era-band scroll-mt-32"
            >
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                {group.era.name}
              </h2>
              <p className="font-mono text-[0.7rem] tracking-[0.12em] text-ink-faint uppercase">
                {group.era.startDate.slice(0, 4)} —{" "}
                {group.era.endDate ? group.era.endDate.slice(0, 4) : "present"}
              </p>
              {group.era.tagline && (
                <p className="rm-hide mt-1 max-w-prose text-sm text-ink-soft">
                  {group.era.tagline}
                </p>
              )}
            </header>
          ) : (
            <p className="timeline-era-band font-mono text-xs tracking-[0.14em] text-ink-faint uppercase">
              Before the first chapter
            </p>
          )}

          {group.years.map((yearGroup) => {
            // When every item in a year is the same type, the lens CSS can collapse the
            // year heading along with them instead of leaving an orphan year number.
            const types = new Set(yearGroup.items.map((i) => i.type));
            const onlyType = types.size === 1 ? [...types][0] : undefined;

            return (
              <div key={yearGroup.year} className="timeline-year" data-only={onlyType}>
                <h3
                  id={`year-${yearGroup.year}`}
                  data-year-marker={yearGroup.year}
                  className="timeline-year-marker scroll-mt-32"
                >
                  {yearGroup.year}
                </h3>

                <ol className="timeline-items">
                  {yearGroup.items.map((item) => {
                    const key = itemKey(item);
                    return (
                      <TodayBoundaryWrapper
                        key={key}
                        draw={key === boundaryKey}
                        today={today}
                      >
                        <TimelineNode item={item} isFuture={item.date > today} />
                      </TodayBoundaryWrapper>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </section>
      ))}

      {/* Everything is in the past, so the boundary belongs at the end. */}
      {!firstFuture && <TodayLine today={today} trailing />}
    </div>
  );
}

function TodayBoundaryWrapper({
  draw,
  today,
  children,
}: {
  draw: boolean;
  today: string;
  children: React.ReactNode;
}) {
  if (!draw) return <>{children}</>;

  return (
    <>
      <TodayLine today={today} />
      {children}
    </>
  );
}

function TodayLine({ today, trailing = false }: { today: string; trailing?: boolean }) {
  const label = new Date(today).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <li
      id={trailing ? "timeline-today" : "timeline-today"}
      className="timeline-today col-span-full scroll-mt-32 list-none"
    >
      <span aria-hidden className="timeline-today-dot" />
      <p className="font-mono text-[0.7rem] tracking-[0.16em] text-signal uppercase">
        You are here
      </p>
      <p className="text-sm text-ink-soft">{label}</p>
      {!trailing && (
        <p id="timeline-future" className="rm-hide mt-1 text-xs text-ink-faint">
          Everything below is a stated goal, not an achievement.
        </p>
      )}
    </li>
  );
}
