import type { Metadata } from "next";
import Link from "next/link";
import { getCertifications } from "./api";
import { CertificationsStrip } from "./components/CertificationsStrip";

export const metadata: Metadata = {
  title: "About",
  description:
    "How I got into engineering, what I care about building, and the credentials behind it.",
};

export default async function AboutPage() {
  const certifications = await getCertifications();

  return (
    <div className="max-w-3xl">
      <h1 className="text-title mb-6 font-semibold">About</h1>

      {/*
        DEMO CONTENT. This is Sam Iversen, the fictional engineer the seed data
        describes — written so the application reads as a finished thing before anyone's
        real history is in it.

        Prose lives in the page for now. It moves into the CMS with the About editor, at
        which point this becomes a Markdown render like the case studies and the copy
        stops needing a deploy to change.
      */}
      <div className="rm-compact space-y-4 text-ink-soft">
        <p>
          I am a software engineer working on payments systems — ledgers, settlement,
          reconciliation, and the reliability work around them. It is a domain where
          being nearly right is indistinguishable from being wrong, which turns out to be
          a good way to learn how to build things properly.
        </p>
        <p>
          I started out automating a month-end statement process that used to be done by
          hand, and stayed because the problems kept getting more interesting. The work I
          am proudest of is a double-entry ledger that had to stay correct while several
          transfers posted at the same instant — a problem where the naive answer looks
          fine right up until money goes missing.
        </p>
        <p>
          What I care about is the unglamorous part: systems that behave predictably
          under load, that fail in ways you can diagnose, and that the next engineer can
          understand without a handover call. This site is built the same way — a real
          backend with a real CMS, because a portfolio claiming full-stack ability ought
          to demonstrate it rather than assert it. You can{" "}
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
          .
        </p>
        <p>
          Where I am heading is on the{" "}
          <Link href="/timeline" className="text-signal hover:underline">
            timeline
          </Link>
          , stated plainly as goals rather than implied as achievements.
        </p>
      </div>

      <CertificationsStrip items={certifications} />
    </div>
  );
}
