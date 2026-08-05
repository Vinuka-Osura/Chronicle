import type { Metadata } from "next";
import { Acquire } from "@/components/Acquire";
import { SetLines } from "@/components/SetLines";
import { getTimeline } from "./api";
import "./timeline.css";
import { ContextBar } from "./components/ContextBar";
import { TimelineStream } from "./components/TimelineStream";
import { Transport } from "./components/Transport";

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
      {/* Onto the shared scene vocabulary. This page predated all of it and was the last
          one still carrying a bare <header>. */}
      <section className="timeline-open" data-scene="Timeline" aria-labelledby="timeline-heading">
        <div className="hero-channel">
          <Acquire text="TIMELINE" className="hero-channel-label" delay={120} />
          <span className="hero-channel-rule" aria-hidden />
          <Acquire
            text={span ? span.replace("–", " – ") : "NOTHING YET"}
            className="hero-channel-label"
            delay={220}
          />
        </div>

        <SetLines as="h1" className="timeline-heading" delay={320} id="timeline-heading">
          Career and life on one axis.
        </SetLines>

        <p className="timeline-lede reveal-mask rm-compact">
          Everything below the &ldquo;you are here&rdquo; line is a stated goal rather than
          something already done. The control along the bottom is the whole span at once —
          one curve per kind, marked at the dates things actually happened, and a playhead
          you can drag to travel through the years.
        </p>
      </section>

      {timeline.items.length > 0 ? (
        <>
          <ContextBar eraNames={eraNames} />
          {/* Breathing room only. The transport is sticky rather than fixed, so it takes
              up its own space at the end of the page and no longer needs the stream to
              reserve any on its behalf. */}
          <div className="pb-10">
            <TimelineStream timeline={timeline} />
          </div>
          <Transport timeline={timeline} />
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
