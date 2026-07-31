import Link from "next/link";
import { Acquire } from "@/components/Acquire";
import { SetLines } from "@/components/SetLines";

/**
 * The landing section, as an instrument face.
 *
 * Most visitors never reach the Timeline, so this has to carry the same idea on its own:
 * the page does not *appear*, it **acquires** — a channel label locks on, the headline
 * sets line by line, a hairline sweeps across to confirm, and then everything is
 * completely still.
 *
 * The whole sequence is 1.1 seconds and happens once. Three things keep it from being
 * the kind of intro people resent:
 *
 *   - Nothing is hidden waiting for it. Every word is in the HTML, in its final
 *     position, at full contrast. The animation is a mask and a transform laid on top,
 *     so a visitor who arrives mid-sequence — or with JavaScript off, or on the `still`
 *     tier — reads exactly the same page.
 *   - It never blocks. There is no overlay and no gate; you can click a link at 200ms.
 *   - It resolves and stops. Nothing here breathes, pulses or waits to be noticed.
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-heading">
      {/* The channel strip. Monospace, rules above and below, and the one place on the
          page where the acquire language is literal. */}
      <div className="hero-channel">
        <Acquire text="SOFTWARE ENGINEER" className="hero-channel-label" delay={120} />
        <span className="hero-channel-rule" aria-hidden />
        <Acquire text="BANKING SYSTEMS" className="hero-channel-label" delay={220} />
      </div>

      <SetLines as="h1" className="hero-headline" delay={320}>
        I build backends that stay correct when things go wrong.
      </SetLines>

      <p className="hero-lede reveal-mask" data-in-delay="820">
        Most of my work is ledgers, statements and the unglamorous reliability around them
        — the parts where being nearly right is the same as being wrong. This site is a
        working example: a .NET&nbsp;10 API and CMS behind a Next.js frontend, so
        everything you read here is content I can edit without a deploy.
      </p>

      {/* The confirmation. Draws last, once the words have landed. */}
      <span className="hero-sweep" aria-hidden />

      <nav className="hero-actions reveal-mask" data-in-delay="980" aria-label="Start here">
        <Link href="/projects" className="hero-action hero-action-primary">
          Read the case studies
        </Link>
        <Link href="/timeline" className="hero-action">
          Career timeline
        </Link>
        <Link href="/resume" className="hero-action rm-hide">
          Résumé
        </Link>
      </nav>
    </section>
  );
}
