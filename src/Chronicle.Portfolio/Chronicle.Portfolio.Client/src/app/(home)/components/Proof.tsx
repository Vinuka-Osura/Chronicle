import Link from "next/link";
import { MetricValue } from "@/components/Figure";
import { SetLines } from "@/components/SetLines";
import type { ProofMetric } from "../api";

/**
 * The pinned scene: what the work actually did.
 *
 * Every portfolio says it built things. Very few say what happened afterwards, because
 * the numbers are unflattering or nobody measured. These come from the CMS, carry their
 * own caveats, and name the project they belong to — which is the difference between a
 * claim and a citation.
 *
 * It is one of only two pinned sections on the page. Pinning is a strong move and it
 * spends the visitor's scroll, so it is reserved for the two moments worth holding still
 * for. The rest of the page keeps moving normally.
 */
export function Proof({ metrics }: { metrics: ProofMetric[] }) {
  // Nothing published yet: better no section than a heading over an empty grid.
  if (metrics.length === 0) return null;

  return (
    /* Not pinned. It was, and holding the reader still to look at three figures they
       could already read spent a screen and a half of scroll on nothing — which is the
       failure this technique is famous for. The hero is the one place on the site that
       still holds. */
    <section
      className="scene rm-hide"
      data-scene="Outcomes"
      aria-labelledby="proof-heading"
    >
      <p className="scene-eyebrow">Outcomes</p>

      <SetLines as="h2" className="scene-heading" id="proof-heading">
        Shipping is the easy half. This is what happened next.
      </SetLines>

      <ul className="proof-grid" data-stagger>
        {metrics.map((metric) => (
          <li
            key={`${metric.projectSlug}-${metric.label}`}
            className="proof-item"
          >
            <p className="proof-label">
              <span className="proof-dot" aria-hidden />
              {metric.label}
            </p>

            {/*
                MetricValue decides how much shape the value can carry. "2.4s to
                    40ms" gets a counting figure, a multiple and a comparison bar; "0"
                    gets a counting figure and nothing else; anything unparseable is
                    printed as written. None of that is chosen here, because the answer
                    depends on the value rather than on the layout.
              */}
            <div className="proof-value">
              <MetricValue value={metric.value} />
            </div>

            {metric.note && <p className="proof-note">{metric.note}</p>}

            <Link
              href={`/projects/${metric.projectSlug}`}
              className="proof-source"
            >
              {metric.projectTitle}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
