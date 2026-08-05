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
    /*
      The track is taller than the screen and the inner sticks to the top of it, so the
      hero holds while the headline shrinks into place and then releases. That is the
      whole pinning mechanism — `position: sticky` plus a scroll-driven animation, no
      library — and it collapses to an ordinary section under Recruiter Mode, where the
      extra 90vh of track would be scroll spent on nothing.
    */
    <div className="hero-track" data-scene="Introduction">
      <div className="hero-pin">
        <section className="hero" aria-labelledby="hero-heading">
          {/* The channel strip. Monospace, rules above and below, and the one place on
              the page where the acquire language is literal. */}
          <div className="hero-channel">
            <Acquire text="SOFTWARE ENGINEER" className="hero-channel-label" delay={120} />
            <span className="hero-channel-rule" aria-hidden />
            <Acquire text="ENTERPRISE SYSTEMS" className="hero-channel-label" delay={220} />
          </div>

          <SetLines as="h1" className="hero-headline" delay={320} id="hero-heading">
            Building reliable software by understanding the problem before writing the
            solution.
          </SetLines>

          {/* The arrival delays are in the stylesheet, not on the element. They belong
              to the hero's choreography rather than to this paragraph, and keeping them
              in CSS is what lets the whole sequence run without any JavaScript. */}
          <p className="hero-lede reveal-mask">
            Great software starts with understanding the problem, not writing code. I
            design and build full-stack applications on clean architecture and robust
            backend systems that stay reliable as the requirements move. This site is a
            working example: a .NET&nbsp;10 API and CMS behind a Next.js frontend, so
            everything you read here is content I can edit without a deploy.
          </p>

          {/* The confirmation. Draws last, once the words have landed. */}
          <span className="hero-sweep" aria-hidden />

          <nav className="hero-actions reveal-mask" aria-label="Start here">
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
      </div>
    </div>
  );
}
