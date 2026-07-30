import type { Metadata } from "next";
import Link from "next/link";
import { getResumeData } from "./api";
import { PrintButton } from "./components/PrintButton";

export const metadata: Metadata = {
  title: "Résumé",
  description:
    "Experience, skills, education and selected work — assembled from the same data as the rest of the site, so it cannot go stale.",
};

function years(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function range(start: string, end: string | null): string {
  return end ? `${years(start)} – ${years(end)}` : `${years(start)} – present`;
}

export default async function ResumePage() {
  const { experience, skills, projects, certifications, timeline } = await getResumeData();

  const education = timeline.items.filter(
    (i) => i.type === "milestone" && i.category === "Education",
  );

  // Featured first, then most recent. A résumé shows the best three, not everything.
  const selected = projects.slice(0, 3);

  return (
    <div className="resume mx-auto max-w-3xl">
      <div className="rm-hide-print mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-prose text-sm text-ink-soft">
          Built from the same data as the rest of the site, so it cannot disagree with it.
          Print or save as PDF — the output is selectable text, which is what an
          applicant-tracking system needs to read it.
        </p>
        <PrintButton />
      </div>

      <header className="resume-header">
        <h1 className="text-3xl font-semibold">Sam Iversen</h1>
        <p className="text-ink-soft">Software Engineer &middot; payments systems and reliability</p>
        <p className="resume-contact font-mono text-xs text-ink-faint">
          <Link href="/contact" className="rm-hide-print text-signal hover:underline">
            Contact
          </Link>
          <span className="hidden print:inline">sam@example.com</span>
          <span aria-hidden> &middot; </span>
          <a href="https://github.com/Vinuka-Osura" target="_blank" rel="noreferrer">
            github.com/Vinuka-Osura
          </a>
        </p>
      </header>

      <section className="resume-section">
        <h2>Summary</h2>
        <p className="text-sm text-ink-soft">
          Backend engineer working on payments systems — ledgers, settlement and
          reconciliation. Most of my work is in domains where being nearly right is the
          same as being wrong, which shapes how I build: correctness first, predictable
          under load, and diagnosable when it does fail.
        </p>
      </section>

      {experience.length > 0 && (
        <section className="resume-section">
          <h2>Experience</h2>
          <ul className="space-y-4">
            {experience.map((role) => (
              <li key={role.id}>
                <div className="resume-entry-head">
                  <h3 className="font-semibold text-ink">
                    {role.role}
                    <span className="font-normal text-ink-soft"> &middot; {role.company}</span>
                  </h3>
                  <span className="font-mono text-xs text-ink-faint">
                    {range(role.startDate, role.endDate)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-ink-soft">{role.summary}</p>

                {role.highlights.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                    {role.highlights.map((highlight) => (
                      <li key={highlight} className="flex gap-2">
                        <span aria-hidden className="text-signal">
                          —
                        </span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {role.techStack.length > 0 && (
                  <p className="mt-1.5 font-mono text-xs text-ink-faint">
                    {role.techStack.join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {selected.length > 0 && (
        <section className="resume-section">
          <h2>Selected work</h2>
          <ul className="space-y-3">
            {selected.map((project) => (
              <li key={project.slug}>
                <div className="resume-entry-head">
                  <h3 className="font-semibold text-ink">
                    <Link href={`/projects/${project.slug}`}>{project.title}</Link>
                  </h3>
                  <span className="font-mono text-xs text-ink-faint">
                    {range(project.startDate, project.endDate)}
                  </span>
                </div>
                <p className="text-sm text-ink-soft">{project.pitch}</p>
                {project.techStack.length > 0 && (
                  <p className="mt-1 font-mono text-xs text-ink-faint">
                    {project.techStack.join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section className="resume-section">
          <h2>Skills</h2>
          <ul className="space-y-1.5">
            {skills.map((group) => (
              <li key={group.category} className="text-sm">
                <span className="font-medium text-ink">{group.category}</span>
                <span className="text-ink-soft">
                  {" — "}
                  {group.skills
                    .map((s) => `${s.name} (${s.yearsExperience}y)`)
                    .join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {education.length > 0 && (
        <section className="resume-section">
          <h2>Education</h2>
          <ul className="space-y-2">
            {education.map((item) => (
              <li key={item.title}>
                <div className="resume-entry-head">
                  <h3 className="font-semibold text-ink">{item.title}</h3>
                  <span className="font-mono text-xs text-ink-faint">
                    {range(item.date, item.endDate)}
                  </span>
                </div>
                {item.summary && <p className="text-sm text-ink-soft">{item.summary}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {certifications.length > 0 && (
        <section className="resume-section">
          <h2>Certifications</h2>
          <ul className="space-y-1">
            {certifications.map((cert) => (
              <li key={cert.name} className="resume-entry-head text-sm">
                <span className="text-ink">
                  {cert.name}
                  <span className="text-ink-soft"> &middot; {cert.issuer}</span>
                </span>
                <span className="font-mono text-xs text-ink-faint">
                  {years(cert.issueDate)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
