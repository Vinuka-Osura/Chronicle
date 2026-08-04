import type { Metadata } from "next";
import { Acquire } from "@/components/Acquire";
import { SetLines } from "@/components/SetLines";
import { SourceTag } from "@/app/analytics/components/SourceTag";
import { getExternalStats } from "@/app/analytics/api";
import { getLearningItems, getPosts } from "./api";
import { ArticleList } from "./components/ArticleList";
import { Credentials } from "./components/Credentials";
import { LearningBoard } from "./components/LearningBoard";
import { DockerImages } from "./components/Published";
import { SectionGuide, type GuideEntry } from "./components/SectionGuide";
import "./knowledge.css";

export const metadata: Metadata = {
  title: "Knowledge",
  description:
    "Articles published elsewhere, credentials somebody else issued, images anyone can pull, and an honest view of what is still being learned.",
};

/*
  ─────────────────────────────────────────────────────────────────────────────────
  Everything on this page is evidence of knowing something, at different strengths.

    Articles     — I understood it well enough to explain it in public
    Credentials  — somebody else set an exam and marked it
    Images       — I published something people can pull
    Learning     — I do not know it yet, and here is how far I have got

  That frame is why the credentials sit here rather than on Analytics. Analytics
  answers "how much"; this page answers "and here it is". The Analytics hero claims
  the work is "measured rather than claimed" — a list of certificates is a claim
  with provenance, not a measurement, and it was quietly making that sentence false.

  The learning board's argument is untouched by the company: a page that shows both
  an invigilated exam and a topic at 15% is making a stronger point than either
  alone, not a weaker one.
  ─────────────────────────────────────────────────────────────────────────────────
*/
export default async function KnowledgePage() {
  // Independent of each other, and independently failable — a broken Medium feed must
  // not cost the learning board.
  const [posts, learning, external] = await Promise.all([
    getPosts(),
    getLearningItems(),
    getExternalStats(),
  ]);

  const articles = external.articles;
  const totalArticles = posts.length + articles.length;
  const credentials = external.badges;

  const anything =
    totalArticles > 0 ||
    credentials.length > 0 ||
    external.dockerHub !== null ||
    learning.length > 0;

  // Same order as the sections themselves, and derived from the same conditions — so the
  // guide cannot list a section that did not render, or miss one that did.
  const guide: GuideEntry[] = [
    ...(credentials.length > 0
      ? [{ id: "credentials", label: "Certifications", count: credentials.length }]
      : []),
    ...(totalArticles > 0
      ? [{ id: "articles", label: "Articles", count: totalArticles }]
      : []),
    ...(external.dockerHub
      ? [{ id: "images", label: "Images", count: external.dockerHub.repositories }]
      : []),
    ...(learning.length > 0
      ? [{ id: "learning", label: "Learning", count: learning.length }]
      : []),
  ];

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
            text={`${totalArticles} WRITTEN · ${credentials.length} EARNED · ${learning.length} IN PROGRESS`}
            className="hero-channel-label"
            delay={220}
          />
        </div>

        <SetLines as="h1" className="knowledge-heading" delay={320} id="knowledge-heading">
          What I know, and what there is to show for it.
        </SetLines>

        <p className="knowledge-lede reveal-mask">
          Four kinds of evidence, in descending order of how much anyone else had to agree
          with me. The last one is the useful one: a board of what I am still working out
          says more than a list of things I claim to know.
        </p>
      </section>

      {!anything ? (
        <p className="knowledge-empty">
          Nothing here yet. Articles, credentials and learning items are served from the
          API, so they appear as soon as they exist — no rebuild required.
        </p>
      ) : (
        <>
          {/* Built from what actually rendered, so it can never offer a destination that
              is not there. */}
          <SectionGuide entries={guide} />

          {/*
            Credentials first, ahead of everything the site says about itself.

            This is the only section on the page whose contents somebody else issued and
            a stranger can verify in one click. Ordering by strength of evidence rather
            than by how much there is of it puts the hardest-to-fake claim where a
            recruiter looks first.
          */}
          {credentials.length > 0 && (
            <section
              id="credentials"
              className="scene"
              data-scene="Credentials"
              aria-labelledby="credentials-heading"
            >
              <div className="scene-head">
                <p className="scene-eyebrow">Marked by somebody else</p>
                <SourceTag source="credentials" />
              </div>
              <h2 id="credentials-heading" className="scene-heading">
                Exams somebody else set and somebody else marked.
              </h2>
              <p className="knowledge-sub rm-compact">
                Merged from the CMS and from Credly, with the source shown so a line typed in
                by hand is distinguishable from one a third party will confirm. Anything past
                its renewal date says so rather than quietly passing as current.
              </p>

              <Credentials badges={credentials} today={external.today} />
            </section>
          )}

          {totalArticles > 0 && (
            <section
              id="articles"
              className="scene"
              data-scene="Articles"
              aria-labelledby="articles-heading"
            >
              <div className="scene-head">
                <p className="scene-eyebrow">Written down</p>
                {articles.length > 0 && <SourceTag source="medium" />}
              </div>
              <h2 id="articles-heading" className="scene-heading">
                Problems worth explaining properly.
              </h2>
              <p className="knowledge-sub rm-compact">
                Mostly ledgers, correctness, and the things that turned out harder than they
                looked. Anything published elsewhere links out to where it lives.
              </p>

              <ArticleList posts={posts} external={articles} />
            </section>
          )}

          {external.dockerHub && (
            <section
              id="images"
              className="scene"
              data-scene="Images"
              aria-labelledby="docker-heading"
            >
              <div className="scene-head">
                <p className="scene-eyebrow">Published</p>
                <SourceTag source="docker" />
              </div>
              <h2 id="docker-heading" className="scene-heading">
                Container images other people can pull.
              </h2>

              <DockerImages docker={external.dockerHub} />
            </section>
          )}

          {learning.length > 0 && (
            <section
              id="learning"
              className="scene"
              data-scene="Learning"
              aria-labelledby="learning-heading"
            >
              <div className="scene-head">
                <p className="scene-eyebrow">Still working out</p>
              </div>
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
