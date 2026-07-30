import type { Metadata } from "next";
import { getLearningItems, getPosts } from "./api";
import { ArticleList } from "./components/ArticleList";
import { LearningBoard } from "./components/LearningBoard";

export const metadata: Metadata = {
  title: "Knowledge",
  description:
    "Technical write-ups, and an honest view of what is currently being learned — including the topics barely started.",
};

export default async function KnowledgePage() {
  // Independent of each other, so they are fetched together rather than in sequence.
  const [posts, learning] = await Promise.all([getPosts(), getLearningItems()]);

  return (
    <>
      <header className="mb-10 max-w-2xl">
        <h1 className="mb-3 text-3xl font-semibold">Knowledge</h1>
        <p className="rm-compact text-ink-soft">
          Two halves of the same thing: what I have worked out and written down, and what
          I am still working out. The second half is the more useful one.
        </p>
      </header>

      {posts.length > 0 || learning.length > 0 ? (
        <>
          <ArticleList posts={posts} />
          <LearningBoard items={learning} />
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-rule p-6 text-sm text-ink-soft">
          Nothing here yet. Articles and learning items are served from the API, so they
          appear as soon as they exist in the CMS — no rebuild required.
        </p>
      )}
    </>
  );
}
