import Link from "next/link";
import { Counter } from "@/components/Figure";
import type { LearningItem } from "@/lib/types";

/** Enough to show direction without turning About into the Knowledge page. */
const SHOWN = 4;

/**
 * What is currently being learned, with how far along it is.
 *
 * `progressPercent` is one of the few genuine 0–100 ratios in the whole data model, so
 * this is one of the few places a filling bar is honest rather than decorative. An item
 * without one still appears — it simply shows its status and no bar, because a missing
 * measurement should read as missing rather than as zero.
 *
 * On an About page this does more work than it looks like it does: a list of things
 * someone is currently bad at, published, is a harder claim to fake than a list of
 * things they are good at.
 */
export function LearningNow({ items }: { items: LearningItem[] }) {
  const shown = items.slice(0, SHOWN);
  if (shown.length === 0) return null;

  return (
    <section className="scene" data-scene="Learning" aria-labelledby="learning-heading">
      <p className="scene-eyebrow">Learning</p>
      <h2 id="learning-heading" className="scene-heading">
        What I am currently bad at, and getting less bad at.
      </h2>

      {/* The weave: odd cards drop from above, even ones rise from below. */}
      <div className="learning-grid" data-stagger data-weave>
        {shown.map((item) => (
          <article key={item.topic} className="learning-card">
            <p className="learning-status">
              <span className="proof-dot" aria-hidden />
              {item.status}
            </p>

            <h3 className="learning-topic">{item.topic}</h3>
            <p className="learning-note">{item.note}</p>

            {item.progressPercent !== null && (
              <div className="learning-progress">
                <span className="learning-track" aria-hidden>
                  <span
                    className="learning-fill"
                    style={{ width: `${Math.min(100, Math.max(0, item.progressPercent))}%` }}
                  >
                    <span className="bar-fill" />
                  </span>
                </span>
                <span className="learning-percent">
                  <Counter value={item.progressPercent} />%
                </span>
              </div>
            )}

            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="learning-link"
              >
                What I am reading →
              </a>
            )}
          </article>
        ))}
      </div>

      <Link href="/knowledge" className="scene-more">
        Everything I have written down
      </Link>
    </section>
  );
}
