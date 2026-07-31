import Link from "next/link";
import { Suspense } from "react";
import { getProjects } from "@/app/projects/api";
import { ProjectCard } from "@/app/projects/components/ProjectCard";
import { JsonLd } from "@/components/JsonLd";
import { personSchema, websiteSchema } from "@/lib/structuredData";
import { Hero } from "./components/Hero";
import { StatusStrip, StatusStripSkeleton } from "./components/StatusStrip";

export default async function MissionControl() {
  const featured = await getProjects({ featured: true });

  return (
    <>
      {/* Site-level identity, declared once on the page every crawler reaches first.
          Other pages point at the same @id rather than describing the person again. */}
      <JsonLd data={personSchema()} />
      <JsonLd data={websiteSchema()} />

      {/*
        Streamed separately from the hero. The strip has the shortest cache life on the
        site, so letting it block the page would make the freshest data gate the fastest
        content. The skeleton reserves its height, so nothing below moves when it lands.
      */}
      <Suspense fallback={<StatusStripSkeleton />}>
        <StatusStrip />
      </Suspense>

      <Hero />

      <section data-rise="1" aria-labelledby="featured-heading">
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <h2 id="featured-heading" className="text-section font-semibold">
            Selected work
          </h2>
          <Link href="/projects" className="text-sm text-signal hover:underline">
            All projects
          </Link>
        </div>

        {featured.length > 0 ? (
          /* emerge-set: every direct child surfaces and sinks with the scroll, staggered
             by its position in the grid. Not on the filtered grids elsewhere — those are
             animated by Motion, and a CSS animation on transform would override the
             inline transform Motion uses to close the gaps. */
          <div className="emerge-set rm-grid grid gap-4 sm:grid-cols-2">
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
