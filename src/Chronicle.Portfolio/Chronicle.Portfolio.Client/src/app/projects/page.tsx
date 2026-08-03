import type { Metadata } from "next";
import { Acquire } from "@/components/Acquire";
import { SetLines } from "@/components/SetLines";
import { getProjects } from "./api";
import { ProjectBrowser } from "./components/ProjectBrowser";
import "./projects.css";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Engineering case studies: the problem, the tradeoffs, the architecture and what the results actually were.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  // Counted rather than written, so the opening cannot go stale the day one is added.
  const technologies = new Set(projects.flatMap((project) => project.techStack)).size;

  return (
    <>
      <section
        className="projects-open"
        data-scene="Projects"
        aria-labelledby="projects-heading"
      >
        <div className="hero-channel">
          <Acquire text="CASE STUDIES" className="hero-channel-label" delay={120} />
          <span className="hero-channel-rule" aria-hidden />
          <Acquire
            text={`${projects.length} PUBLISHED`}
            className="hero-channel-label"
            delay={220}
          />
        </div>

        <SetLines as="h1" className="projects-heading" delay={320} id="projects-heading">
          What the problem was, and what it cost to solve.
        </SetLines>

        <p className="projects-lede reveal-mask">
          Each of these is written as a case study rather than a feature list — the
          tradeoffs I made and why, and what happened afterwards. Where a result was
          measured, the number is here with its caveat.
          {technologies > 0 && ` ${technologies} technologies across the set.`}
        </p>
      </section>

      {projects.length > 0 ? (
        <section className="scene projects-scene" data-scene="All work">
          <ProjectBrowser projects={projects} />
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-rule p-6 text-sm text-ink-soft">
          Nothing published yet. Case studies are served from the API, so they appear here
          as soon as they exist in the CMS — no rebuild required.
        </p>
      )}
    </>
  );
}
