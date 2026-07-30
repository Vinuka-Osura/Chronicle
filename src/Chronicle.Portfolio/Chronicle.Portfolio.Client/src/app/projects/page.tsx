import type { Metadata } from "next";
import { getProjects } from "./api";
import { TagFilter } from "./components/TagFilter";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Engineering case studies: the problem, the tradeoffs, the architecture and what the results actually were.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <header className="mb-10 max-w-2xl">
        <h1 className="text-title mb-3 font-semibold">Projects</h1>
        <p className="rm-compact text-ink-soft">
          Each of these is written as a case study rather than a feature list â€” what the
          problem was, which tradeoffs I made and why, and what happened afterwards.
        </p>
      </header>

      {projects.length > 0 ? (
        <TagFilter projects={projects} />
      ) : (
        <p className="rounded-lg border border-dashed border-rule p-6 text-sm text-ink-soft">
          Nothing published yet.
        </p>
      )}
    </>
  );
}
