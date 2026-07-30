import type { Metadata } from "next";
import { getTimeline } from "./api";
import { ContextBar } from "./components/ContextBar";
import { Scrubber } from "./components/Scrubber";
import { TimelineStream } from "./components/TimelineStream";

export const metadata: Metadata = {
  title: "Timeline",
  description:
    "Career and life on one axis — roles, projects, certifications, milestones and stated goals, from the beginning to what comes next.",
};

export default async function TimelinePage() {
  const timeline = await getTimeline();

  const eraNames = Object.fromEntries(timeline.eras.map((era) => [era.id, era.name]));
  const span =
    timeline.items.length > 0
      ? `${timeline.items[0].date.slice(0, 4)}–${timeline.items.at(-1)!.date.slice(0, 4)}`
      : null;

  return (
    <>
      <header className="mb-6 max-w-2xl">
        <h1 className="text-title mb-3 font-semibold">Timeline</h1>
        <p className="rm-compact text-ink-soft">
          Career and life on one axis{span ? `, ${span}` : ""}. Everything below the
          &ldquo;you are here&rdquo; line is a stated goal rather than something already
          done. Use the lenses to show only what you came for.
        </p>
      </header>

      {timeline.items.length > 0 ? (
        <>
          <ContextBar eraNames={eraNames} />
          {/* Clears the fixed scrubber, so the last node is never hidden behind it. */}
          <div className="pb-24">
            <TimelineStream timeline={timeline} />
          </div>
          <Scrubber timeline={timeline} />
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-rule p-6 text-sm text-ink-soft">
          Nothing on the timeline yet. It is served from the API, so entries appear here
          as soon as they exist in the CMS — no rebuild required.
        </p>
      )}
    </>
  );
}
