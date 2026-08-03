import { cacheLife, cacheTag } from "next/cache";
import { requestOr } from "@/lib/http";
import type { Resume } from "@/lib/types";

/** Where the Word copy comes from. Same projection, different renderer. */
export const RESUME_DOCX_PATH = "/api/resume.docx";

/**
 * The CV, as one call.
 *
 * Deliberately no stored résumé document. A CV that is typed out separately is a CV that
 * disagrees with the site within a month; this one cannot, because it is the same rows
 * the rest of the pages render.
 *
 * It used to be five parallel fetches assembled here. It is one now because the Word
 * export needs the same document, and a second assembler on the server would have been a
 * second definition of what the CV says. The server owns the projection; this page and
 * the .docx are two renderings of it.
 */
export async function getResume(): Promise<Resume> {
  "use cache";
  cacheTag("profile", "experience", "skills", "projects", "certifications", "timeline");
  cacheLife("hours");

  return requestOr<Resume>("/api/resume", {
    profile: null,
    roles: [],
    education: [],
    projects: [],
    skills: [],
    certifications: [],
  });
}
