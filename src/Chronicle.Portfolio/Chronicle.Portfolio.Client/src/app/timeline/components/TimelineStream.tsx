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
              {/*
                The heading links to its own id, so clicking a chapter puts it in the
                address bar. Native anchor behaviour: no JavaScript, and it works from a
                pasted URL on first load.
              */}
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                <a href={`#era-${group.era.id}`} className="timeline-anchor">
                  {group.era.name}
                </a>
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
                  <a href={`#year-${yearGroup.year}`} className="timeline-anchor">
                    {yearGroup.year}
                  </a>
                </h3>

                <ol className="timeline-items">
                  {yearGroup.items.map((item) => {
                    const key = itemKey(item);
                    return (
                      <TodayBoundaryWrapper
                        key={key}
                        draw={key === boundaryKey}
                        today={today}
                        items={timeline.items}
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
      {!firstFuture && <TodayLine today={today} items={timeline.items} trailing />}
    </div>
  );
}

function TodayBoundaryWrapper({
  draw,
  today,
  items,
  children,
}: {
  draw: boolean;
  today: string;
  items: TimelineItem[];
  children: React.ReactNode;
}) {
  if (!draw) return <>{children}</>;

  return (
    <>
      <TodayLine today={today} items={items} />
      {children}
    </>
  );
}

/**
 * Anything that happened on today's date in an earlier year.
 *
 * Returns nothing when there is no match, and the caller renders nothing — a feature
 * that manufactures a coincidence is worse than one that waits for a real one.
 */
function onThisDay(items: TimelineItem[], today: string) {
  const monthDay = today.slice(5);
  const thisYear = today.slice(0, 4);

  return items
    .filter((i) => i.date.slice(5) === monthDay && i.date.slice(0, 4) !== thisYear)
    .map((i) => ({
      item: i,
      yearsAgo: Number(thisYear) - Number(i.date.slice(0, 4)),
    }))
    .sort((a, b) => a.yearsAgo - b.yearsAgo);
}

function TodayLine({
  today,
  items,
  trailing = false,
}: {
  today: string;
  items: TimelineItem[];
  trailing?: boolean;
}) {
  const label = new Date(today).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const anniversaries = onThisDay(items, today);

  return (
    <li id="timeline-today" className="timeline-today col-span-full scroll-mt-32 list-none">
      <span aria-hidden className="timeline-today-dot" />
      <p className="font-mono text-[0.7rem] tracking-[0.16em] text-signal uppercase">
        You are here
      </p>
      <p className="text-sm text-ink-soft">{label}</p>

      {anniversaries.length > 0 && (
        <p className="rm-hide mt-1 text-xs text-ink-faint">
          {anniversaries.map(({ item, yearsAgo }) => (
            <span key={`${item.type}-${item.date}`} className="block">
              {yearsAgo === 1 ? "One year ago today" : `${yearsAgo} years ago today`} —{" "}
              {item.title}
            </span>
          ))}
        </p>
      )}

      {!trailing && (
        <p id="timeline-future" className="rm-hide mt-1 text-xs text-ink-faint">
          Everything below is a stated goal, not an achievement.
        </p>
      )}
    </li>
  );
}
