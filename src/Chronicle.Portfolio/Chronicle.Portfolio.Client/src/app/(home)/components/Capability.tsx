import Link from "next/link";
import { Meter } from "@/components/Figure";
import { SetLines } from "@/components/SetLines";
import type { SkillGroup } from "@/lib/types";

/** The ordinal scale, weakest first. Index + 1 is how many segments light up. */
const LEVELS = ["Learning", "Working", "Strong", "Deep"] as const;

/** Enough to show range without turning the section into the Skills page. */
const PER_CATEGORY = 4;
const CATEGORIES = 4;

function rank(proficiencyRank: number) {
  return Math.max(1, Math.min(LEVELS.length, proficiencyRank));
}

/**
 * Range, in one screen.
 *
 * The Skills page is exhaustive and that is right for the Skills page. This is the
 * argument for reading it: four categories, the strongest few in each, and — the part
 * that makes it evidence rather than a word cloud — how many projects each one has
 * actually been used on.
 *
 * Proficiency is drawn as discrete segments rather than a bar. It is an ordinal scale:
 * "deep" outranks "strong", but not by a measurable amount, and a continuous bar would
 * claim a precision the data does not have.
 */
export function Capability({ groups }: { groups: SkillGroup[] }) {
  const shown = groups
    .filter((group) => group.skills.length > 0)
    .slice(0, CATEGORIES)
    .map((group) => ({
      ...group,
      skills: [...group.skills]
        .sort((a, b) => b.proficiencyRank - a.proficiencyRank || b.yearsExperience - a.yearsExperience)
        .slice(0, PER_CATEGORY),
    }));

  if (shown.length === 0) return null;

  return (
    <section className="scene" data-scene="Range" aria-labelledby="capability-heading">
      <p className="scene-eyebrow">Range</p>

      <SetLines as="h2" className="scene-heading" id="capability-heading">
        Depth in a few places, working knowledge either side of them.
      </SetLines>

      <div className="capability-grid" data-stagger>
        {shown.map((group) => (
          <div key={group.category} className="capability-column">
            <h3 className="capability-category">{group.category}</h3>

            <ul className="capability-list">
              {group.skills.map((skill) => (
                <li key={skill.name} className="capability-skill">
                  <span className="capability-name">{skill.name}</span>

                  <Meter
                    level={rank(skill.proficiencyRank)}
                    levels={LEVELS.length}
                    label={`${skill.name}: ${LEVELS[rank(skill.proficiencyRank) - 1]}`}
                  />

                  {/* The number that turns a list of names into a claim someone can
                      check — and it is a count, so it stays a count. */}
                  <span className="capability-used">
                    {skill.usedIn.length > 0
                      ? `${skill.usedIn.length} ${skill.usedIn.length === 1 ? "project" : "projects"}`
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Link href="/skills" className="scene-more">
        Every skill, and where each one was used
      </Link>
    </section>
  );
}
