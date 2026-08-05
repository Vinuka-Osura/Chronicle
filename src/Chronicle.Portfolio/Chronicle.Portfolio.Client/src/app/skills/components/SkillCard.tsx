import Link from "next/link";
import { anchorId } from "@/lib/anchor";
import type { Skill } from "@/lib/types";

function years(value: number): string {
  // 3.0 should read "3 years", not "3.0 years".
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} ${value === 1 ? "year" : "years"}`;
}

/** Five steps rather than a bar: a named scale should not look continuous. */
function ProficiencyMeter({ rank, label }: { rank: number; label: string }) {
  return (
    <span
      className="skill-meter"
      role="img"
      aria-label={`Proficiency: ${label}, ${rank} of 5`}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <span key={step} aria-hidden className={step <= rank ? "is-on" : ""} />
      ))}
    </span>
  );
}

/**
 * One skill, with the evidence for it.
 *
 * The previous card put the years, the meter and one undifferentiated list of "used in"
 * chips in a row and left it there. Three changes, all of them showing something that
 * was already in the data and was not being said:
 *
 *   - The proficiency level is NAMED, not just plotted. Four dots out of five is a
 *     position on a scale nobody has been shown; "Advanced" is the scale.
 *   - Years get a bar measured against the deepest skill on the page. Every skill is in
 *     the same unit, so that comparison is real — which is the whole test for whether a
 *     bar is allowed to exist.
 *   - The usage is SPLIT. `usedIn` already distinguishes a project from a role and the
 *     card rendered both identically, so "used on four things" was hiding the more
 *     interesting "two shipped projects and two jobs".
 */
export function SkillCard({ skill, deepest }: { skill: Skill; deepest: number }) {
  const projects = skill.usedIn.filter((usage) => usage.kind === "project");
  const roles = skill.usedIn.filter((usage) => usage.kind === "experience");

  // Floored, so the shallowest skill is a visible bar rather than a hairline that
  // reads as a rendering failure.
  const share = deepest > 0 ? Math.max(0.08, skill.yearsExperience / deepest) : 0;

  return (
    // The anchor a case study's tech-stack chip links to. `scroll-mt` clears the sticky
    // header, which would otherwise cover the card the reader just asked to see.
    <article className="skill-card scroll-mt-28" id={anchorId("skill", skill.name)}>
      <div className="skill-head">
        <h3 className="skill-name">{skill.name}</h3>
        <span className="skill-level">{skill.proficiency}</span>
      </div>

      <div className="skill-depth">
        <ProficiencyMeter rank={skill.proficiencyRank} label={skill.proficiency} />
        <span className="skill-years">{years(skill.yearsExperience)}</span>
      </div>

      {/* Outer span carries the real length so it is correct without JavaScript; the
          inner one is what scales, because animating width is a layout write. */}
      <span className="skill-bar" aria-hidden>
        <span className="skill-bar-length" style={{ width: `${share * 100}%` }}>
          <span className="bar-fill" />
        </span>
      </span>

      {/*
        The point of the page. These are not typed in anywhere — they are worked out
        from the projects and roles that reference this skill, so the claim and the
        evidence cannot drift apart.
      */}
      {skill.usedIn.length > 0 ? (
        <div className="skill-usage">
          {projects.length > 0 && (
            <div className="skill-usage-group">
              <p className="skill-usage-label">
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </p>
              <ul className="skill-chips">
                {projects.map((usage) => (
                  <li key={`p-${usage.title}`}>
                    {usage.slug ? (
                      <Link href={`/projects/${usage.slug}`} className="skill-chip is-link">
                        {usage.title}
                      </Link>
                    ) : (
                      <span className="skill-chip">{usage.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {roles.length > 0 && (
            <div className="skill-usage-group">
              <p className="skill-usage-label">
                {roles.length} {roles.length === 1 ? "role" : "roles"}
              </p>
              <ul className="skill-chips">
                {roles.map((usage) => (
                  <li key={`r-${usage.title}`}>
                    <span className="skill-chip is-role">{usage.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        // Honest rather than hidden: a skill with nothing behind it says so.
        <p className="skill-unused">Not yet used in published work.</p>
      )}
    </article>
  );
}
