import type { Metadata } from "next";
import { Acquire } from "@/components/Acquire";
import { SetLines } from "@/components/SetLines";
import { getLearningItems, getPosts } from "./api";
import { ArticleList } from "./components/ArticleList";
import { LearningBoard } from "./components/LearningBoard";
import "./knowledge.css";

export const metadata: Metadata = {
  title: "Knowledge",
  description:
    "Technical write-ups, and an honest view of what is currently being learned — including the topics barely started.",
};

export default async function KnowledgePage() {
  // Independent of each other, so they are fetched together rather than in sequence.
  const [posts, learning] = await Promise.all([getPosts(), getLearningItems()]);

  // Counted rather than written, so the opening cannot go stale the day one is added.
  const topics = new Set(posts.flatMap((post) => post.tags)).size;
  const minutes = posts.reduce((total, post) => total + post.readingTimeMinutes, 0);

  return (
    <>
      <section
        className="knowledge-open"
        data-scene="Knowledge"
        aria-labelledby="knowledge-heading"
      >
        <div className="hero-channel">
          <Acquire text="KNOWLEDGE" className="hero-channel-label" delay={120} />
          <span className="hero-channel-rule" aria-hidden />
          <Acquire
            text={`${posts.length} WRITTEN · ${learning.length} IN PROGRESS`}
            className="hero-channel-label"
            delay={220}
          />
        </div>

        <SetLines as="h1" className="knowledge-heading" delay={320} id="knowledge-heading">
          What I have worked out, and what I am still working out.
        </SetLines>

        <p className="knowledge-lede reveal-mask">
          The second half is the more useful one. A learning board that lists only finished
          topics is a skills list wearing a disguise, so the ones barely started are here
          too, with how far along they actually are.
          {minutes > 0 && ` ${minutes} minutes of reading across ${topics} topics.`}
        </p>
      </section>

      {posts.length === 0 && learning.length === 0 ? (
        <p className="knowledge-empty">
          Nothing here yet. Articles and learning items are served from the API, so they
          appear as soon as they exist in the CMS — no rebuild required.
        </p>
      ) : (
        <>
          {posts.length > 0 && (
            <section className="scene" data-scene="Articles" aria-labelledby="articles-heading">
              <p className="scene-eyebrow">Written down</p>
              <h2 id="articles-heading" className="scene-heading">
                Problems worth explaining properly.
              </h2>
              <p className="knowledge-sub rm-compact">
                Mostly ledgers, correctness, and the things that turned out harder than they
                looked. Search reads the full text of every article, not just the titles.
              </p>

              <ArticleList posts={posts} />
            </section>
          )}

          {learning.length > 0 && (
            <section className="scene" data-scene="Learning" aria-labelledby="learning-heading">
              <p className="scene-eyebrow">Still working out</p>
              <h2 id="learning-heading" className="scene-heading">
                Where things actually stand.
              </h2>
              <p className="knowledge-sub rm-compact">
                Each of these is where it is, not where it would look best. The percentage is
                my own estimate of how much of the topic I have covered, which is why it sits
                beside a note saying what that has and has not amounted to.
              </p>

              <LearningBoard items={learning} />
            </section>
          )}
        </>
      )}
    </>
  );
}
