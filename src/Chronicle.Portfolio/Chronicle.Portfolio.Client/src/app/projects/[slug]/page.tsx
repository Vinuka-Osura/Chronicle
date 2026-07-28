import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProject } from "@/lib/api";
import { Markdown } from "@/components/Markdown";

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

  if (!project) {
    return { title: "Project not found" };
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

/** A case-study section that simply does not render when its content is absent. */
function Section({
  heading,
  body,
}: {
  heading: string;
  body: string | null | undefined;
}) {
  if (!body) return null;

  return (
    <section className="mb-12">
      <h2 className="mb-3 text-xl font-semibold">{heading}</h2>
      <Markdown>{body}</Markdown>
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
  const project = await getProject(slug);

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
      <nav className="mb-8">
        <Link href="/projects" className="text-sm text-signal hover:underline">
          ← All projects
        </Link>
      </nav>

      {/* 1. Hero */}
      <header className="mb-12">
        <h1 className="mb-3 text-4xl font-semibold">{project.title}</h1>
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
      <Section heading="Architecture" body={project.architectureNotes} />
      <Section heading="Results" body={project.results} />
      <Section heading="What I learned" body={project.lessonsLearned} />

      {/* 8. Artifacts */}
      {links.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-3 text-xl font-semibold">Links</h2>
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
