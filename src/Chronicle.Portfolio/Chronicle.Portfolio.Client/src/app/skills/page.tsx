import type { Metadata } from "next";
import { Acquire } from "@/components/Acquire";
import { SetLines } from "@/components/SetLines";
import { getSkills } from "./api";
import { SkillCard } from "./components/SkillCard";
import { Vortex } from "./components/Vortex";
import "./skills.css";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Skills by domain, each with years of experience and links to the projects and roles that actually used it.",
};

export default async function SkillsPage() {
  const groups = await getSkills();

  const total = groups.reduce((count, group) => count + group.skills.length, 0);

  return (
    <>
      {/* Draws behind the cards, and nothing depends on it: the cards arrive under
          their own CSS whether or not a canvas ever appears. */}
      <Vortex />

      <section className="skills-open" data-scene="Skills" aria-labelledby="skills-heading">
        <div className="hero-channel">
          <Acquire text="SKILLS" className="hero-channel-label" delay={120} />
          <span className="hero-channel-rule" aria-hidden />
          <Acquire
            text={`${total} TRACKED`}
            className="hero-channel-label"
            delay={220}
          />
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

      {groups.length > 0 ? (
        groups.map((group) => (
          <section
            key={group.category}
            className="scene skills-group"
            data-scene={group.category}
            aria-labelledby={`skills-${group.category}`}
          >
            <p className="scene-eyebrow" id={`skills-${group.category}`}>
              {group.category}
            </p>

            {/* data-weave: odd cards drop from above, even ones rise from below — so a
                row settles like something laid down rather than a queue arriving. */}
            <div className="skills-grid rm-grid" data-stagger data-weave>
              {group.skills.map((skill) => (
                <SkillCard key={skill.name} skill={skill} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <p className="rounded-lg border border-dashed border-rule p-6 text-sm text-ink-soft">
          No skills published yet.
        </p>
      )}
    </>
  );
}
