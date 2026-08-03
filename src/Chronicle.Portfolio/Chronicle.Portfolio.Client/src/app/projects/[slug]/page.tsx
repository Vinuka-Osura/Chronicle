import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@/components/Icon";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProject, getProjects } from "../api";
import { CaseStudyNav } from "../components/CaseStudyNav";
import { ArchitectureDiagram } from "@/components/ArchitectureDiagram";
import { MetricCards } from "../components/MetricCards";
import { JsonLd } from "@/components/JsonLd";
import { Markdown } from "@/components/Markdown";
import { breadcrumbSchema, projectSchema } from "@/lib/structuredData";
import "../projects.css";

type Params = { slug: string };

/*
 * Deliberately no generateStaticParams here.
 *
 * Baking the slug list at build time would mean a project added in the CMS 404s until
 * the site is redeployed - which contradicts the whole point of putting content behind
 * an API. So the route resolves its params at request time inside a Suspense boundary:
 * Next still prerenders the surrounding shell, and the case study streams in.
 *
 * It is not the slow path it looks like. The API output-caches this response and the
 * `use cache` wrapper in lib/api.ts caches it again on this side, so in practice the
 * fetch is a cache read.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  // params is a Promise in Next 16.
  const { slug } = await params;
  const project = await getProject(slug);

  /*
    Renders the not-found page but returns HTTP 200 — notFound() fires inside the
    Suspense boundary below, after the status line has been sent. A true 404 would need
    generateStaticParams, which would mean any project published in the CMS 404s until
    the next deploy. noindex keeps the soft 404 out of search results instead, which is
    the harm that actually matters. Same reasoning as the article route.
  */
  if (!project) {
    return {
      title: "Project not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: project.title,
    description: project.pitch,
    openGraph: {
      title: project.title,
      description: project.pitch,
      type: "article",
      images: project.screenshots[0]?.url ? [project.screenshots[0].url] : undefined,
    },
  };
}

/**
 * One case-study section, which disappears entirely when there is nothing to put in it.
 *
 * `extra` is for anything richer than prose — the architecture diagram. The section
 * appears if *either* the prose or the extra content exists, so a project can have a
 * diagram with no written notes, or notes with no diagram, and neither case leaves an
 * empty heading behind.
 */
function Section({
  heading,
  body,
  extra,
}: {
  heading: string;
  body: string | null | undefined;
  extra?: React.ReactNode;
}) {
  if (!body && !extra) return null;

  return (
    <section className="mb-12">
      <h2 className="text-section mb-3 font-semibold">{heading}</h2>
      {body && <Markdown>{body}</Markdown>}
      {extra}
    </section>
  );
}

function CaseStudySkeleton() {
  return (
    <div className="max-w-3xl animate-pulse" aria-busy="true" aria-label="Loading case study">
      <div className="mb-4 h-10 w-2/3 rounded bg-rule" />
      <div className="mb-8 h-5 w-full rounded bg-rule" />
      <div className="mb-3 h-4 w-full rounded bg-rule" />
      <div className="mb-3 h-4 w-11/12 rounded bg-rule" />
      <div className="h-4 w-4/5 rounded bg-rule" />
    </div>
  );
}

async function CaseStudy({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  /*
    Both together rather than one after the other. The list is needed only for the
    next/previous links at the very bottom, so awaiting it after the case study would
    add its latency to a page that is otherwise ready — and both are `use cache`, so
    after the first render this is two cache reads.
  */
  const [project, siblings] = await Promise.all([getProject(slug), getProjects()]);

  if (!project) {
    notFound();
  }

  const links = [
    { href: project.demoUrl, label: "Live demo" },
    { href: project.githubUrl, label: "Source" },
    { href: project.docsUrl, label: "Docs" },
    { href: project.videoUrl, label: "Walkthrough" },
  ].filter((link): link is { href: string; label: string } => Boolean(link.href));

  return (
    <article className="max-w-3xl">
      <JsonLd
        data={projectSchema({
          title: project.title,
          pitch: project.pitch,
          slug,
          startDate: project.startDate,
          endDate: project.endDate,
          techStack: project.techStack,
          githubUrl: project.githubUrl,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Projects", path: "/projects" },
          { name: project.title, path: `/projects/${slug}` },
        ])}
      />

      <nav className="mb-8">
        <Link href="/projects" className="back-link">
          <ArrowLeft />
          All projects
        </Link>
      </nav>

      {/* 1. Hero */}
      <header className="mb-12">
        <h1 className="text-title mb-3 font-semibold">{project.title}</h1>
        <p className="rm-compact mb-5 text-lg text-ink-soft">{project.pitch}</p>

        {project.techStack.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {project.techStack.map((tech) => (
              <li
                key={tech}
                className="rounded border border-rule px-2 py-0.5 font-mono text-xs text-ink-soft"
              >
                {tech}
              </li>
            ))}
          </ul>
        )}
      </header>

      {/* 2-7. The template. Absent sections vanish rather than showing empty headings. */}
      <Section heading="The problem" body={project.problem} />
      <Section heading="Solution and key decisions" body={project.solution} />
      <Section heading="Tradeoffs" body={project.keyDecisions} />
      {/* The element is only passed when there is a diagram to draw. Passing it
          unconditionally would make `extra` truthy even when it renders nothing, and
          a project with neither notes nor diagram would show an empty heading. */}
      <Section
        heading="Architecture"
        body={project.architectureNotes}
        extra={
          project.architectureDiagram ? (
            <ArchitectureDiagram
              source={project.architectureDiagram}
              caption={`How ${project.title} fits together.`}
            />
          ) : undefined
        }
      />
      {/* Numbers beside the prose, not instead of it: the figure is what a reader
          scans for, and the prose is what stops it being misread. */}
      <Section
        heading="Results"
        body={project.results}
        extra={project.metrics.length > 0 ? <MetricCards metrics={project.metrics} /> : undefined}
      />
      <Section heading="What I learned" body={project.lessonsLearned} />

      {/* 8. Artifacts */}
      {links.length > 0 && (
        <section className="mb-12">
          <h2 className="text-section mb-3 font-semibold">Links</h2>
          <ul className="flex flex-wrap gap-3">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-rule px-3 py-1.5 text-sm transition-colors hover:border-signal"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Where to go next. A case study that ends at a back link asks the reader to go
          up a level and choose again, and most of them leave instead. */}
      <CaseStudyNav projects={siblings} slug={slug} />
    </article>
  );
}

export default function CaseStudyPage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<CaseStudySkeleton />}>
      <CaseStudy params={params} />
    </Suspense>
  );
}
