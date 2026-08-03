import type { Metadata } from "next";
import Link from "next/link";
import { getLearningItems } from "@/app/knowledge/api";
import { SetLines } from "@/components/SetLines";
import { Acquire } from "@/components/Acquire";
import { getCertifications, getExperience } from "./api";
import { CertificationsStrip } from "./components/CertificationsStrip";
import { LearningNow } from "./components/LearningNow";
import { Roles } from "./components/Roles";
import "./about.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "How I got into engineering, what I care about building, and the credentials behind it.",
};

export default async function AboutPage() {
  const [certifications, roles, learning] = await Promise.all([
    getCertifications(),
    getExperience(),
    getLearningItems(),
  ]);

  return (
    <>
      <section className="about-open" data-scene="About" aria-labelledby="about-heading">
        <div className="hero-channel">
          <Acquire text="ABOUT" className="hero-channel-label" delay={120} />
          <span className="hero-channel-rule" aria-hidden />
          <Acquire text="SAM IVERSEN" className="hero-channel-label" delay={220} />
        </div>

        <SetLines as="h1" className="about-heading" delay={320} id="about-heading">
          Payments, where being nearly right is the same as being wrong.
        </SetLines>

        <p className="about-lede reveal-mask">
          Ledgers, settlement, reconciliation, and the unglamorous reliability work
          around all three. It turns out to be a good way to learn how to build things
          properly, because the domain does not let you get away with anything.
        </p>
      </section>

      {/*
        DEMO CONTENT. This is Sam Iversen, the fictional engineer the seed data
        describes — written so the application reads as a finished thing before anyone's
        real history is in it.

        Prose lives in the page for now. It moves into the CMS with the About editor, at
        which point this becomes a Markdown render like the case studies and the copy
        stops needing a deploy to change.
      */}
      <section className="scene" data-scene="The story" aria-labelledby="story-heading">
        <p className="scene-eyebrow">The story</p>
        <h2 id="story-heading" className="scene-heading">
          It started with a spreadsheet nobody wanted to open.
        </h2>

        <div className="story rm-compact" data-stagger>
          <p>
            I started out automating a month-end statement process that used to be done
            by hand, and stayed because the problems kept getting more interesting.
          </p>

          {/* The one sentence worth stopping on, set as a pull quote rather than left
              buried in the middle of a paragraph where nobody would find it. */}
          <blockquote className="story-pull">
            The work I am proudest of is a double-entry ledger that had to stay correct
            while several transfers posted at the same instant — a problem where the
            naive answer looks fine right up until money goes missing.
          </blockquote>

          <p>
            What I care about is the unglamorous part: systems that behave predictably
            under load, that fail in ways you can diagnose, and that the next engineer
            can understand without a handover call.
          </p>

          <p>
            This site is built the same way — a real backend with a real CMS, because a
            portfolio claiming full-stack ability ought to demonstrate it rather than
            assert it. You can{" "}
            <Link href="/projects" className="text-signal hover:underline">
              read the case studies
            </Link>{" "}
            or{" "}
            <a
              href="https://github.com/Vinuka-Osura/Chronicle"
              target="_blank"
              rel="noreferrer"
              className="text-signal hover:underline"
            >
              read the source
            </a>
            . Where I am heading is on the{" "}
            <Link href="/timeline" className="text-signal hover:underline">
              timeline
            </Link>
            , stated plainly as goals rather than implied as achievements.
          </p>
        </div>
      </section>

      <Roles roles={roles} />

      <LearningNow items={learning} />

      <CertificationsStrip items={certifications} />

      <section className="closing rm-hide" data-scene="Next" aria-labelledby="about-next">
        <p className="scene-eyebrow">Next</p>
        <SetLines as="h2" className="closing-heading" id="about-next">
          That is the short version. The long one is the timeline.
        </SetLines>

        <nav className="closing-actions" aria-label="Where to go next">
          <Link href="/timeline" className="hero-action hero-action-primary">
            The whole route
          </Link>
          <Link href="/contact" className="hero-action">
            Get in touch
          </Link>
        </nav>
      </section>
    </>
  );
}
