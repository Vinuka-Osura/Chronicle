import Link from "next/link";
import { SetLines } from "@/components/SetLines";

/**
 * The last thing on the page, and the reason the page ends rather than stops.
 *
 * A long scroll that simply runs out into a footer leaves the reader nowhere. This is a
 * full-height sign-off with one sentence and two ways forward — and it is the only place
 * on the Home page that asks for anything, which is what stops the rest of it feeling
 * like a pitch.
 */
export function Closing() {
  return (
    <section className="closing" data-scene="Get in touch" aria-labelledby="closing-heading">
      <p className="scene-eyebrow">Next</p>

      <SetLines as="h2" className="closing-heading" id="closing-heading">
        If any of this is the kind of problem you have, I would like to hear about it.
      </SetLines>

      <p className="closing-lede reveal-mask-in-view">
        The case studies go into what broke and what it cost. The timeline is the whole
        route here, including the parts that did not work.
      </p>

      <nav className="closing-actions" aria-label="Where to go next">
        <Link href="/contact" className="hero-action hero-action-primary">
          Start a conversation
        </Link>
        <Link href="/projects" className="hero-action">
          Read the case studies
        </Link>
      </nav>
    </section>
  );
}
