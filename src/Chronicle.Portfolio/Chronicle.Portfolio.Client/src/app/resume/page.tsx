import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { apiUrl } from "@/lib/http";
import type { Certification, Experience, ProjectCard, Resume, ResumeEducation, SkillGroup } from "@/lib/types";
import { RESUME_DOCX_PATH, getResume } from "./api";
import { ResumeActions } from "./components/ResumeActions";
import "./resume.css";

export const metadata: Metadata = {
  title: "Résumé",
  description:
    "Experience, skills, education and selected work — assembled from the same data as the rest of the site, so it cannot go stale.",
};

/*
  ─────────────────────────────────────────────────────────────────────────────────
  This page is written for a parser first and a reader second, and where the two
  disagree the parser wins.

  What that costs, concretely:

  - **One column.** Two columns read better on screen and are extracted in the wrong
    order by roughly half of applicant-tracking systems, which interleave the columns
    line by line and turn a job title into a sentence about a programming language.
  - **Conventional headings.** "Experience", "Education", "Skills" — matched against a
    fixed vocabulary. The site's own voice would be better writing and an unrecognised
    section.
  - **Real list markup with CSS markers.** The bullets are `::marker`, not a character in
    a span. A glyph in the text layer is extracted as part of the sentence, so every
    achievement arrives prefixed with an em dash.
  - **No graphics.** No meters, no rings, no card art — all of which exist elsewhere on
    this site and none of which survive text extraction as anything but a gap.

  The animation is the shared scene vocabulary and nothing bespoke: it is CSS-only and
  scroll-driven, so it does not exist on paper and cannot affect what is extracted.
  ─────────────────────────────────────────────────────────────────────────────────
*/

/** "Mar 2024". Month precision is all a CV claims, and all it should. */
function month(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function range(start: string, end: string | null): string {
  return `${month(start)} – ${end ? month(end) : "Present"}`;
}

/** Strips the scheme so a link reads as a handle. The href keeps the real address. */
function label(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export default async function ResumePage() {
  const resume = await getResume();
  const { profile } = resume;

  return (
    <div className="resume">
      <div className="resume-intro rm-hide-print">
        <p className="resume-note">
          Built from the same rows as the rest of the site, so it cannot disagree with it.
          Both downloads are selectable text in a single column — which is what an
          applicant-tracking system needs in order to read it at all.
        </p>
        <ResumeActions docxUrl={apiUrl(RESUME_DOCX_PATH)} />
      </div>

      {profile ? (
        <article className="resume-sheet">
          <ResumeHeader profile={profile} />

          <Section title="Professional summary">
            <p className="resume-summary">{profile.summary}</p>
          </Section>

          <ExperienceSection roles={resume.roles} />
          <EducationSection education={resume.education} />
          <ProjectsSection projects={resume.projects} />
          <SkillsSection groups={resume.skills} />
          <CertificationsSection certifications={resume.certifications} />

          {profile.availability && (
            <Section title="Availability">
              <p className="resume-summary">{profile.availability}</p>
            </Section>
          )}
        </article>
      ) : (
        /* No invented person. Every line of a CV is a claim about someone real, so an
           unfilled profile is an empty state rather than a plausible-looking default. */
        <p className="resume-empty">
          No profile has been set yet. The name, contact details and summary come from the
          CMS — once they exist, this page assembles the rest from the roles, skills,
          education and projects already published.
        </p>
      )}
    </div>
  );
}

function ResumeHeader({ profile }: { profile: NonNullable<Resume["profile"]> }) {
  /*
    Every contact detail is text, in one line, in the order a parser expects. The links
    are anchors so they are clickable on screen and in a PDF, and the visible label is the
    address itself so nothing is lost when the anchor is flattened away.
  */
  const links = [
    profile.linkedInUrl,
    profile.gitHubUrl,
    profile.websiteUrl,
  ].filter((url): url is string => Boolean(url));

  return (
    <header className="resume-head">
      <h1 className="resume-name">{profile.fullName}</h1>
      <p className="resume-headline">{profile.headline}</p>

      <address className="resume-contact">
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        {profile.phone && (
          <>
            <Dot />
            <a href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`}>{profile.phone}</a>
          </>
        )}
        {profile.location && (
          <>
            <Dot />
            <span>{profile.location}</span>
          </>
        )}
        {links.map((url) => (
          <Fragment key={url}>
            <Dot />
            <a href={url} target="_blank" rel="noreferrer">
              {label(url)}
            </a>
          </Fragment>
        ))}
      </address>
    </header>
  );
}

function ExperienceSection({ roles }: { roles: Experience[] }) {
  if (roles.length === 0) return null;

  return (
    <Section title="Experience">
      <ol className="resume-entries">
        {roles.map((role) => (
          <li key={role.id} className="resume-entry">
            <div className="resume-entry-head">
              <h3 className="resume-entry-title">
                {role.role}
                <span className="resume-entry-org">, {role.company}</span>
              </h3>
              <span className="resume-dates">{range(role.startDate, role.endDate)}</span>
            </div>

            {role.summary && <p className="resume-entry-summary">{role.summary}</p>}

            {role.highlights.length > 0 && (
              /* Six at most. Past that a reader skips to the next role, and the choice of
                 which six is an editorial decision that belongs in the CMS. */
              <ul className="resume-bullets">
                {role.highlights.slice(0, 6).map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            )}

            {role.techStack.length > 0 && (
              <p className="resume-stack">
                <span className="resume-stack-label">Technologies: </span>
                {role.techStack.join(", ")}
              </p>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}

function EducationSection({ education }: { education: ResumeEducation[] }) {
  if (education.length === 0) return null;

  return (
    <Section title="Education">
      <ol className="resume-entries">
        {education.map((item) => (
          <li key={`${item.title}-${item.startDate}`} className="resume-entry">
            <div className="resume-entry-head">
              <h3 className="resume-entry-title">{item.title}</h3>
              <span className="resume-dates">{range(item.startDate, item.endDate)}</span>
            </div>
            {item.detail && <p className="resume-entry-summary">{item.detail}</p>}
          </li>
        ))}
      </ol>
    </Section>
  );
}

function ProjectsSection({ projects }: { projects: ProjectCard[] }) {
  if (projects.length === 0) return null;

  return (
    <Section title="Selected projects">
      <ol className="resume-entries">
        {projects.map((project) => (
          <li key={project.slug} className="resume-entry">
            <div className="resume-entry-head">
              <h3 className="resume-entry-title">
                {/* Links to the case study on screen; prints as the title alone. */}
                <Link href={`/projects/${project.slug}`}>{project.title}</Link>
              </h3>
              <span className="resume-dates">{range(project.startDate, project.endDate)}</span>
            </div>
            <p className="resume-entry-summary">{project.pitch}</p>
            {project.techStack.length > 0 && (
              <p className="resume-stack">
                <span className="resume-stack-label">Technologies: </span>
                {project.techStack.join(", ")}
              </p>
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}

function SkillsSection({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <Section title="Skills">
      {/*
        Names only, comma separated. The years and the proficiency meters are on the
        Skills page, where a reader can weigh them; here they would sit between a keyword
        and the matcher looking for it, and "React (4y)" does not match "React".
      */}
      <dl className="resume-skills">
        {groups.map((group) => (
          <div key={group.category} className="resume-skill-row">
            {/* Verbatim. Every category is already one word, and de-camel-casing turned
                DevOps into "Dev Ops" and AI into "Ai". */}
            <dt>{group.category}</dt>
            <dd>{group.skills.map((skill) => skill.name).join(", ")}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function CertificationsSection({ certifications }: { certifications: Certification[] }) {
  if (certifications.length === 0) return null;

  return (
    <Section title="Certifications">
      <ul className="resume-certs">
        {certifications.map((cert) => (
          <li key={`${cert.name}-${cert.issuer}`}>
            <span className="resume-cert-name">
              {cert.credentialUrl ? (
                <a href={cert.credentialUrl} target="_blank" rel="noreferrer">
                  {cert.name}
                </a>
              ) : (
                cert.name
              )}
            </span>
            <span className="resume-cert-issuer"> — {cert.issuer}</span>
            <span className="resume-dates">{month(cert.issueDate)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/**
 * One section, with the heading and rule the whole document repeats.
 *
 * `data-stagger` is the site's shared arrival gesture. It is CSS-only and driven by
 * `view()`, so it costs nothing on paper — the printed document has no scroll position
 * and every element is simply at its resting state.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="resume-section" data-stagger>
      <h2 className="resume-section-title rule-draw">{title}</h2>
      {children}
    </section>
  );
}

function Dot() {
  return (
    <span aria-hidden className="resume-dot">
      ·
    </span>
  );
}
