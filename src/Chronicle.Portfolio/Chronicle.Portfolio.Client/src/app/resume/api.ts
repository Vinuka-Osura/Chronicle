import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { Certification, Experience, ProjectCard, SkillGroup, Timeline } from "@/lib/types";

/**
 * Everything the résumé is assembled from.
 *
 * Deliberately no separate résumé endpoint or stored document. A CV that is typed out
 * separately is a CV that disagrees with the site within a month; this one cannot,
 * because it is the same rows the rest of the pages render.
 *
 * Education comes from the timeline's milestones rather than a dedicated call — it is
 * the only place education lives, and the timeline already merges it.
 */
export async function getResumeData(): Promise<{
  experience: Experience[];
  skills: SkillGroup[];
  projects: ProjectCard[];
  certifications: Certification[];
  timeline: Timeline;
}> {
  "use cache";
  cacheTag("experience", "skills", "projects", "certifications", "timeline", "milestones");
  cacheLife("hours");

  const [experience, skills, projects, certifications, timeline] = await Promise.all([
    requestOr<Experience[]>("/api/experience", []),
    requestOr<SkillGroup[]>("/api/skills", []),
    requestOr<ProjectCard[]>("/api/projects", []),
    requestOr<Certification[]>("/api/certifications", []),
    requestOr<Timeline>("/api/timeline", {
      today: new Date().toISOString().slice(0, 10),
      eras: [],
      items: [],
    }),
  ]);

  return { experience, skills, projects, certifications, timeline };
}
