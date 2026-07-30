import type { LearningItem, LearningStatus } from "@/lib/types";

/** Ordered by how far along it is, so the meter and the label agree. */
const STATUS_RANK: Record<LearningStatus, number> = {
  Exploring: 1,
  Learning: 2,
  Comfortable: 3,
};

function StatusPips({ status }: { status: LearningStatus }) {
  const rank = STATUS_RANK[status];

  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`Status: ${status}`}>
      {[1, 2, 3].map((step) => (
        <span
          key={step}
          aria-hidden
          className={`h-1 w-4 rounded-full ${step <= rank ? "bg-signal" : "bg-rule"}`}
        />
      ))}
    </span>
  );
}

/**
 * What is currently being studied.
 *
 * The honest half of the Knowledge Core: an item at 15% with "no production use yet"
 * says more about how someone works than a list of things they claim to know.
 */
export function LearningBoard({ items }: { items: LearningItem[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="learning-heading">
      <h2 id="learning-heading" className="text-section mb-2 font-semibold">
        Currently learning
      </h2>
      <p className="rm-compact mb-5 max-w-prose text-sm text-ink-soft">
        Where things actually stand, including the ones barely started. A learning board
        that only lists finished topics is a skills list wearing a disguise.
      </p>

      <ul className="rm-grid grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.topic}
            className="surface p-4"
          >
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <h3 className="font-display font-semibold text-ink">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-signal"
                  >
                    {item.topic}
                  </a>
                ) : (
                  item.topic
                )}
              </h3>
              <StatusPips status={item.status} />
            </div>

            <p className="rm-compact mb-3 text-sm text-ink-soft">{item.note}</p>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[0.65rem] tracking-[0.12em] text-ink-faint uppercase">
                {item.status}
              </span>
              {item.progressPercent !== null && (
                <>
                  <span
                    aria-hidden
                    className="h-1 flex-1 overflow-hidden rounded-full bg-rule"
                  >
                    <span
                      className="block h-full rounded-full bg-signal"
                      style={{ width: `${item.progressPercent}%` }}
                    />
                  </span>
                  <span className="font-mono text-[0.65rem] text-ink-faint">
                    {item.progressPercent}%
                  </span>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
