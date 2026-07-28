/**
 * Mirrors of the API's response DTOs.
 *
 * These are hand-written for now. Once the server is running, `npm run gen:types`
 * regenerates `api-schema.d.ts` from its OpenAPI document, and these can be derived
 * from that instead - the point being that the contract has one source of truth on the
 * server rather than two definitions drifting apart.
 */

export type IsoDate = string; // "2024-03-01"
export type IsoDateTime = string; // "2026-05-12T09:00:00+00:00"

export interface ProjectCard {
  slug: string;
  title: string;
  pitch: string;
  featured: boolean;
  startDate: IsoDate;
  endDate: IsoDate | null;
  tags: string[];
  techStack: string[];
  thumbnailUrl: string | null;
}

export interface Screenshot {
  url: string;
  caption: string | null;
}

export interface ProjectDetail {
  slug: string;
  title: string;
  pitch: string;
  problem: string;
  solution: string;
  keyDecisions: string | null;
  architectureNotes: string | null;
  architectureDiagramUrl: string | null;
  results: string | null;
  lessonsLearned: string | null;
  videoUrl: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
  docsUrl: string | null;
  startDate: IsoDate;
  endDate: IsoDate | null;
  featured: boolean;
  tags: string[];
  techStack: string[];
  screenshots: Screenshot[];
}

export type TimelineItemType = "experience" | "project" | "roadmap";

export interface TimelineItem {
  type: TimelineItemType;
  date: IsoDate;
  endDate?: IsoDate | null;
  title: string;
  subtitle?: string;
  summary?: string;
  pitch?: string;
  description?: string;
  slug?: string;
  status?: "Planned" | "InProgress" | "Done";
  highlights?: string[];
  techStack?: string[];
  tags?: string[];
}

export interface SiteStatus {
  currentFocus: string;
  mood: string | null;
  updatedAt: IsoDateTime;
}

export interface LastCommit {
  message: string;
  repo: string;
  when: IsoDateTime;
}

export interface GitHubStats {
  totalCommits: number;
  publicRepos: number;
  currentStreakDays: number;
  contributionCalendar: { date: IsoDate; count: number }[];
  topLanguages: { name: string; percent: number }[];
  lastCommit: LastCommit | null;
  fetchedAt: IsoDateTime;
}
