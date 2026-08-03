import type { Experience } from "@/lib/types";

function span(start: string, end: string | null): string {
  const format = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });

  return end ? `${format(start)} – ${format(end)}` : `${format(start)} – present`;
}

/**
 * Where the work actually happened.
 *
 * The About page told a story and never said where any of it took place — the roles
 * existed only on the résumé and the timeline. That is the first thing most people read
 * an About page to find out, so it belongs here too, drawn from the same rows rather
 * than typed out again.
 *
 * Laid out as a ledger rather than as cards: a rule per role, the dates set in the
 * margin, and the highlights indented under each. Cards would give four roles equal
 * visual weight with four certifications further down, and they are not the same kind
 * of thing.
 */
/** English for a count, up to the point where a numeral reads better. */
const WORDS = ["no", "one", "two", "three", "four", "five", "six"];
const count = (n: number) => WORDS[n] ?? String(n);

export function Roles({ roles }: { roles: Experience[] }) {
  if (roles.length === 0) return null;

  /*
    The heading is derived, not written.

    A hand-written "four years in three places" is a sentence that silently becomes a
    lie the first time a role is added in the CMS — and nobody proof-reads a heading
    they wrote once. Counting the rows means it cannot drift.
  */
  const companies = new Set(roles.map((role) => role.company)).size;

  /*
    No year total, and that is a constraint rather than an omission: working out how
    long an ongoing role has run needs the current time, and reading the clock in a
    server component is exactly what Cache Components forbids — it did throw here
    before this was removed. The date range under each role says the same thing without
    anyone needing to know what today is.
  */
  const heading =
    companies === 1
      ? `${count(roles.length)} ${roles.length === 1 ? "role" : "roles"}, one company.`
      : `${count(roles.length)} roles across ${count(companies)} companies.`;

  return (
    <section className="scene" data-scene="Where" aria-labelledby="roles-heading">
      <p className="scene-eyebrow">Where</p>
      <h2 id="roles-heading" className="scene-heading">
        {/* Capitalised here rather than in the string, so the words stay reusable. */}
        <span className="first-letter:uppercase">{heading}</span>
      </h2>

      <ol className="roles" data-stagger>
        {roles.map((role) => (
          <li key={role.id} className="role">
              <div className="role-head">
                <div>
                  <h3 className="role-title">{role.role}</h3>
                  <p className="role-company">{role.company}</p>
                </div>

                <div className="role-when">
                  <span className="role-dates">{span(role.startDate, role.endDate)}</span>
                </div>
              </div>

              <p className="role-summary">{role.summary}</p>

              {role.highlights.length > 0 && (
                <ul className="role-highlights rm-compact">
                  {role.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              )}

              {role.techStack.length > 0 && (
                <ul className="role-stack rm-hide">
                  {role.techStack.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              )}
          </li>
        ))}
      </ol>
    </section>
  );
}
