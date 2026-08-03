import Link from "next/link";
import type { Skill } from "@/lib/types";

/** Five dots rather than a bar: a discrete scale should not look continuous. */
function ProficiencyMeter({ rank, label }: { rank: number; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      role="img"
      aria-label={`Proficiency: ${label}, ${rank} of 5`}
    >
      {[1, 2, 3, 4, 5].map((step) => (
        <span
          key={step}
          aria-hidden
          className={`size-1.5 rounded-full ${step <= rank ? "bg-signal" : "bg-rule"}`}
        />
      ))}
    </span>
  );
}

function years(value: number): string {
  // 3.0 should read "3 years", not "3.0 years".
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${rounded} ${value === 1 ? "year" : "years"}`;
}

export function SkillCard({ skill }: { skill: Skill }) {
  return (
    /* skill-card is the hook the vortex looks for, as well as the style. */
    <article className="skill-card surface p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className="font-display font-semibold">{skill.name}</h3>
        <ProficiencyMeter rank={skill.proficiencyRank} label={skill.proficiency} />
      </div>

      <p className="mb-3 font-mono text-xs text-ink-faint">{years(skill.yearsExperience)}</p>

      {/*
        The point of the page. These are not typed in anywhere - they are worked out
        from the projects and roles that reference this skill, so the claim and the
        evidence cannot drift apart.
      */}
      {skill.usedIn.length > 0 ? (
        <div>
          <p className="mb-1.5 font-mono text-[0.65rem] tracking-[0.14em] text-ink-faint uppercase">
            Used in
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {skill.usedIn.map((usage) => (
              <li key={`${usage.kind}-${usage.title}`}>
                {usage.slug ? (
                  <Link
                    href={`/projects/${usage.slug}`}
                    className="inline-block rounded border border-rule px-1.5 py-0.5 text-xs text-ink-soft transition-colors hover:border-signal hover:text-ink"
                  >
                    {usage.title}
                  </Link>
                ) : (
                  <span className="inline-block rounded border border-dashed border-rule px-1.5 py-0.5 text-xs text-ink-faint">
                    {usage.title}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        // Honest rather than hidden: a skill with nothing behind it says so.
        <p className="text-xs text-ink-faint italic">Not yet used in published work.</p>
      )}
    </article>
  );
}
