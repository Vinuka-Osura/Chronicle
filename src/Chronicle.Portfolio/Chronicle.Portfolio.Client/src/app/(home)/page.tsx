import Link from "next/link";
import { Suspense } from "react";
import { getGitHubStats } from "@/app/analytics/api";
import { getProjects } from "@/app/projects/api";
import { ProjectCard } from "@/app/projects/components/ProjectCard";
import { getSkills } from "@/app/skills/api";
import { JsonLd } from "@/components/JsonLd";
import { personSchema, websiteSchema } from "@/lib/structuredData";
import { getProofMetrics } from "./api";
import { Capability } from "./components/Capability";
import { Closing } from "./components/Closing";
import { Hero } from "./components/Hero";
import { Proof } from "./components/Proof";
import { StatusStrip, StatusStripSkeleton } from "./components/StatusStrip";
import "./home.css";

export default async function MissionControl() {
  /*
    Fetched together rather than in sequence. Each of these is `use cache` behind its
    own tag, so the cost after the first render is a cache read — but on a cold render
    awaiting them one after another would make the page as slow as the sum of the API,
    rather than as slow as its slowest call.
  */
  const [featured, metrics, stats, skills] = await Promise.all([
    getProjects({ featured: true }),
    getProofMetrics(),
    getGitHubStats(),
    getSkills(),
  ]);

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

      <section className="scene" data-scene="Selected work" aria-labelledby="featured-heading">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <div>
            <p className="scene-eyebrow">Selected work</p>
            <h2 id="featured-heading" className="scene-heading">
              Four systems, and what each one had to survive.
            </h2>
          </div>

          <Link href="/projects" className="shrink-0 text-sm text-signal hover:underline">
            All projects
          </Link>
        </div>

        {featured.length > 0 ? (
          /* data-stagger: every direct child arrives on its own offset range. */
          <div className="rm-grid grid gap-5 sm:grid-cols-2" data-stagger>
            {featured.map((project, index) => (
              <ProjectCard key={project.slug} project={project} index={index} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-rule p-6 text-sm text-ink-soft">
            No projects are published yet. They are served from the API, so they appear
            here as soon as they exist in the CMS — no rebuild required.
          </p>
        )}
      </section>

      {/* The second and last pinned scene. Renders nothing at all if there is neither a
          published metric nor a GitHub token configured. */}
      <Proof metrics={metrics} stats={stats.isLive ? stats : null} />

      <Capability groups={skills} />

      <Closing />
    </>
  );
}
