import Link from "next/link";
import { Suspense } from "react";
import { getProjects } from "@/app/projects/api";
import { ProjectCard } from "@/app/projects/components/ProjectCard";
import { StatusStrip, StatusStripSkeleton } from "./components/StatusStrip";

export default async function MissionControl() {
  const featured = await getProjects({ featured: true });

  return (
    <>
      {/*
        Streamed separately from the hero. The strip has the shortest cache life on the
        site, so letting it block the page would make the freshest data gate the fastest
        content. The skeleton reserves its height, so nothing below moves when it lands.
      */}
      <Suspense fallback={<StatusStripSkeleton />}>
        <StatusStrip />
      </Suspense>

      <section className="mb-20 max-w-3xl">
        <p className="mb-4 font-mono text-xs tracking-[0.2em] text-signal uppercase">
          Software Engineer &middot; Banking systems
        </p>

        <h1 className="text-hero mb-6 leading-[1.05] font-semibold">
          I build backends that stay correct when things go wrong.
        </h1>

        <p className="rm-compact mb-8 text-lg text-ink-soft">
          Most of my work is ledgers, statements and the unglamorous reliability around
          them — the parts where being nearly right is the same as being wrong. This site
          is a working example of it: a .NET&nbsp;10 API and CMS behind a Next.js
          frontend, so everything you read here is content I can edit without a deploy.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/projects"
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-signal"
          >
            Read the case studies
          </Link>
          <Link
            href="/resume"
            className="rounded-md border border-rule px-4 py-2 text-sm font-medium transition-colors hover:border-signal"
          >
            Résumé
          </Link>
          <Link
            href="/timeline"
            className="rm-hide rounded-md border border-rule px-4 py-2 text-sm font-medium transition-colors hover:border-signal"
          >
            Career timeline
          </Link>
        </div>
      </section>

      <section aria-labelledby="featured-heading">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 id="featured-heading" className="text-xl font-semibold">
            Selected work
          </h2>
          <Link href="/projects" className="text-sm text-signal hover:underline">
            All projects
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="rm-grid grid gap-4 sm:grid-cols-2">
            {featured.map((project) => (
              <ProjectCard key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-rule p-6 text-sm text-ink-soft">
            No projects are published yet. They are served from the API, so they appear
            here as soon as they exist in the CMS — no rebuild required.
          </p>
        )}
      </section>
    </>
  );
}
