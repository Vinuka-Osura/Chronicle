import { Counter } from "@/components/Figure";
import type { LearningItem, LearningStatus } from "@/lib/types";

/** Ordered by how far along it is, so the pips and the label agree. */
const STATUS_RANK: Record<LearningStatus, number> = {
  Exploring: 1,
  Learning: 2,
  Comfortable: 3,
};

/**
 * Three discrete steps, not a continuous bar.
 *
 * Status is ordinal — Exploring, Learning, Comfortable — with no claim that the gaps
 * between them are equal. Drawing it as a fill would invent a scale the data does not
 * have; segments that light up say "the second of three" and nothing more.
 */
function StatusPips({ status }: { status: LearningStatus }) {
  const rank = STATUS_RANK[status];

  return (
    <span className="learn-pips" role="img" aria-label={`Status: ${status}`}>
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          aria-hidden
          className={`learn-pip${step <= rank ? " is-lit" : ""}`}
          /* Each pip lights a beat after the one before it, driven by the scene's own
             scroll position rather than a timer, so it reverses on the way back up. */
          style={{ "--pip": step } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

/**
 * What is currently being studied.
 *
 * The honest half of the Knowledge Core: an item at 15% with "no production use yet" says
 * more about how someone works than a list of things they claim to know.
 *
 * The progress bar is one of the few figures on this site that has genuinely earned one —
 * `progressPercent` is a real proportion of a whole, so a fill asserts a scale that
 * actually exists. It animates as `scaleX` on an inner element rather than `width`, which
 * would be a layout write on every frame.
 */
export function LearningBoard({ items }: { items: LearningItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="learn-grid rm-grid" data-stagger data-pop>
      {items.map((item) => (
        <li key={item.topic} className="learn-card card">
          <div className="learn-head">
            <h3 className="learn-topic">
              {item.link ? (
                <a href={item.link} target="_blank" rel="noreferrer">
                  {item.topic}
                </a>
              ) : (
                item.topic
              )}
            </h3>
            <StatusPips status={item.status} />
          </div>

          <p className="learn-note rm-compact">{item.note}</p>

          <div className="learn-foot">
            <span className="learn-status">{item.status}</span>

            {item.progressPercent !== null && (
              <>
                <span
                  aria-hidden
                  className="learn-meter"
                  style={
                    { "--fill": `${item.progressPercent / 100}` } as React.CSSProperties
                  }
                >
                  <span className="learn-meter-fill" />
                </span>
                <span className="learn-percent">
                  <Counter value={item.progressPercent} />%
                </span>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
