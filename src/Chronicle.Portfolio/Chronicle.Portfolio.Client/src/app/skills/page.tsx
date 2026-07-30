import type { Metadata } from "next";
import { getSkills } from "./api";
import { SkillCard } from "./components/SkillCard";

export const metadata: Metadata = {
  title: "Skills",
  description:
    "Skills by domain, each with years of experience and links to the projects and roles that actually used it.",
};

export default async function SkillsPage() {
  const groups = await getSkills();

  return (
    <>
      <header className="mb-10 max-w-2xl">
        <h1 className="mb-3 text-3xl font-semibold">Skills</h1>
        <p className="rm-compact text-ink-soft">
          Every skill below links to the work that used it. Those links are worked out
          from the projects and roles themselves rather than typed in, so nothing here
          can claim experience the work does not show.
        </p>
      </header>

      {groups.length > 0 ? (
        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.category} aria-labelledby={`skills-${group.category}`}>
              <h2
                id={`skills-${group.category}`}
                className="mb-4 font-mono text-xs tracking-[0.18em] text-ink-faint uppercase"
              >
                {group.category}
              </h2>

              <div className="rm-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.skills.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-rule p-6 text-sm text-ink-soft">
          No skills published yet.
        </p>
      )}
    </>
  );
}
