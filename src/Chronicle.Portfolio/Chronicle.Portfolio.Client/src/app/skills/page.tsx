import type { Metadata } from "next";
import { Acquire } from "@/components/Acquire";
import { Counter } from "@/components/Figure";
import { SetLines } from "@/components/SetLines";
import { getSkills } from "./api";
import { SkillCard } from "./components/SkillCard";
import "./skills.css";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Skills by domain, each with years of experience and links to the projects and roles that actually used it.",
};

export default async function SkillsPage() {
  const groups = await getSkills();

  const all = groups.flatMap((group) => group.skills);

  /*
    Everything below is counted rather than written.

    A hand-typed "14 skills across 5 domains" is a sentence that goes quietly wrong the
    first time one is added in the admin, and nobody proof-reads a number they wrote
    once. These are derived on every render, so they cannot drift.
  */
  const deepest = all.reduce((most, skill) => Math.max(most, skill.yearsExperience), 0);
  const evidenced = new Set(
    all.flatMap((skill) => skill.usedIn.map((usage) => `${usage.kind}:${usage.title}`)),
  );

  // Strongest first inside each group, and the fullest groups first, so the page opens
  // on its best material rather than on whatever the alphabet decided.
  const ordered = groups
    .filter((group) => group.skills.length > 0)
    .map((group) => ({
      ...group,
      skills: [...group.skills].sort(
        (a, b) =>
          b.proficiencyRank - a.proficiencyRank || b.yearsExperience - a.yearsExperience,
      ),
    }))
    .sort((a, b) => b.skills.length - a.skills.length);

  return (
    <>
      <section className="skills-open" data-scene="Skills" aria-labelledby="skills-heading">
        <div className="hero-channel">
          <Acquire text="SKILLS" className="hero-channel-label" delay={120} />
          <span className="hero-channel-rule" aria-hidden />
          <Acquire text={`${all.length} TRACKED`} className="hero-channel-label" delay={220} />
        </div>

        <SetLines as="h1" className="skills-heading" delay={320} id="skills-heading">
          Everything here links to the work that used it.
        </SetLines>

        <p className="skills-lede reveal-mask">
          Those links are worked out from the projects and roles themselves rather than
          typed in, so nothing on this page can claim experience the work does not show.
          A skill with nothing behind it says so.
        </p>
      </section>

      {ordered.length > 0 ? (
        <>
          <section className="scene skills-summary-scene" data-scene="At a glance">
            <dl className="skills-summary" data-stagger>
              <div className="skills-figure">
                <dt>Skills tracked</dt>
                <dd>
                  <Counter value={all.length} />
                </dd>
              </div>
              <div className="skills-figure">
                <dt>Domains</dt>
                <dd>
                  <Counter value={ordered.length} />
                </dd>
              </div>
              <div className="skills-figure">
                <dt>Deepest</dt>
                <dd>
                  <Counter
                    value={deepest}
                    decimals={Number.isInteger(deepest) ? 0 : 1}
                  />
                  <span className="skills-figure-unit">years</span>
                </dd>
              </div>
              <div className="skills-figure">
                <dt>Pieces of evidence</dt>
                <dd>
                  <Counter value={evidenced.size} />
                </dd>
              </div>
            </dl>
          </section>

          {ordered.map((group) => (
            <section
              key={group.category}
              className="scene skills-group"
              data-scene={group.category}
              aria-labelledby={`skills-${group.category}`}
            >
              <div className="skills-group-head">
                <p className="scene-eyebrow" id={`skills-${group.category}`}>
                  {group.category}
                </p>
                <p className="skills-group-count">
                  {group.skills.length} {group.skills.length === 1 ? "skill" : "skills"}
                  <span aria-hidden> &middot; </span>
                  strongest {group.skills[0].name}
                </p>
              </div>

              <div className="skills-grid rm-grid" data-stagger>
                {group.skills.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} deepest={deepest} />
                ))}
              </div>
            </section>
          ))}
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-rule p-6 text-sm text-ink-soft">
          No skills published yet.
        </p>
      )}
    </>
  );
}
