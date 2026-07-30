import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/Markdown";
import { getPost } from "../api";

type Params = { slug: string };

/*
 * No generateStaticParams, for the same reason as the case-study route: baking the slug
 * list at build time would 404 any article published in the CMS until the next deploy.
 * The route resolves params at request time inside Suspense, and both cache layers mean
 * the fetch is a cache read rather than a trip to the database.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  /*
    A missing article renders the not-found page but returns HTTP 200, not 404.

    That is a consequence of streaming: notFound() fires inside the Suspense boundary
    below, by which time the status line has already been sent. The only way to get a
    true 404 is generateStaticParams, which would mean baking the slug list at build
    time — and then any article published in the CMS would 404 until the next deploy,
    which is the property this whole architecture exists to protect.

    So the status stays 200 and this stops it mattering: noindex keeps a not-found page
    out of search results, which is the actual harm a soft 404 causes.
  */
  if (!post) {
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
    },
  };
}

function ArticleSkeleton() {
  return (
    <div className="max-w-2xl animate-pulse" aria-busy="true" aria-label="Loading article">
      <div className="mb-4 h-9 w-3/4 rounded bg-rule" />
      <div className="mb-8 h-4 w-1/3 rounded bg-rule" />
      <div className="mb-3 h-4 w-full rounded bg-rule" />
      <div className="mb-3 h-4 w-11/12 rounded bg-rule" />
      <div className="h-4 w-4/5 rounded bg-rule" />
    </div>
  );
}

async function Article({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const published = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <article className="max-w-2xl">
      <nav className="mb-8">
        <Link href="/knowledge" className="text-sm text-signal hover:underline">
          ← All articles
        </Link>
      </nav>

      <header className="mb-8">
        <h1 className="mb-3 text-3xl font-semibold">{post.title}</h1>

        <p className="mb-4 flex flex-wrap items-center gap-x-2 font-mono text-[0.7rem] tracking-[0.12em] text-ink-faint uppercase">
          {published && <span>{published}</span>}
          <span aria-hidden>&middot;</span>
          <span>{post.readingTimeMinutes} min read</span>
        </p>

        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded border border-rule px-2 py-0.5 font-mono text-xs text-ink-soft"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </header>

      {/* Markdown arrives raw from the API and is sanitised here — the content comes from
          a database a CMS writes to, so it is never treated as trusted. */}
      <Markdown>{post.bodyMarkdown}</Markdown>
    </article>
  );
}

export default function ArticlePage({ params }: { params: Promise<Params> }) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <Article params={params} />
    </Suspense>
  );
}
