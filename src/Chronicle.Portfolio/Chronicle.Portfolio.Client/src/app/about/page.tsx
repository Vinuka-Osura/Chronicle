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
          <Acquire text="VINUKA OSURA" className="hero-channel-label" delay={220} />
        </div>

        <SetLines as="h1" className="about-heading" delay={320} id="about-heading">
          Engineering through curiosity.
        </SetLines>

        <div className="about-intro">
          <div>
            <p className="about-lede reveal-mask">
              I enjoy building software, but what keeps me engaged is understanding why
              systems behave the way they do — and that question is usually more useful
              than the feature that prompted it.
            </p>
          </div>

          {/*
            A stand-in portrait. An illustration rather than a stock photograph, because
            a stock face is a picture of somebody else on a page about this person.

            It is a static asset rather than CMS content on purpose: there is no avatar
            field on the profile yet, and inventing a column for a placeholder would mean
            a migration to add it and another to change it the moment a real photograph
            arrives. Marked decorative — every fact about who this is, is in the text
            beside it.
          */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/avatar-placeholder.svg"
            alt=""
            width={200}
            height={200}
            className="about-portrait rm-hide"
          />
        </div>
      </section>

      {/*
        Prose lives in the page for now. It moves into the CMS with the About editor, at
        which point this becomes a Markdown render like the case studies and the copy
        stops needing a deploy to change.
      */}
      <section className="scene" data-scene="The story" aria-labelledby="story-heading">
        <p className="scene-eyebrow">The story</p>
        <h2 id="story-heading" className="scene-heading">
          The process is where the lessons are.
        </h2>

        <div className="story rm-compact" data-stagger>
          <p>
            Whether it is investigating a ZIP bomb vulnerability, redesigning an
            architecture, or making an existing application faster, I prefer starting
            with the underlying problem rather than jumping to the implementation.
          </p>

          {/* The one sentence worth stopping on, set as a pull quote rather than left
              buried in the middle of a paragraph where nobody would find it. */}
          <blockquote className="story-pull">
            Instead of only the polished outcomes, I write down the real challenges — the
            unexpected failures, the architectural decisions, and the trade-offs. Every
            one of them reveals something that makes the next system better.
          </blockquote>

          <p>
            Professionally I work in the Microsoft ecosystem, building enterprise
            applications with C#, ASP.NET Core, Entity Framework Core, SQL Server and
            PostgreSQL. Alongside that I build full-stack applications with Next.js and
            NestJS, using Docker, Git and DevOps practices to get things from development
            into production.
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
