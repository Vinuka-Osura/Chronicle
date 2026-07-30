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

export interface Experience {
  id: string;
  role: string;
  company: string;
  startDate: IsoDate;
  /** Null means current. */
  endDate: IsoDate | null;
  summary: string;
  highlights: string[];
  techStack: string[];
}

export type SkillCategory =
  | "Backend"
  | "Frontend"
  | "Database"
  | "DevOps"
  | "Cloud"
  | "AI"
  | "Other";

export type ProficiencyLevel =
  | "Novice"
  | "Working"
  | "Proficient"
  | "Advanced"
  | "Expert";

/** Where a skill was actually used. Derived server-side from the join tables. */
export interface SkillUsage {
  kind: "project" | "experience";
  title: string;
  /** Set for projects so the chip can link to the case study; null for roles. */
  slug: string | null;
}

export interface Skill {
  name: string;
  category: SkillCategory;
  yearsExperience: number;
  proficiency: ProficiencyLevel;
  /** 1-5, for the meter. */
  proficiencyRank: number;
  usedIn: SkillUsage[];
}

export interface SkillGroup {
  category: SkillCategory;
  skills: Skill[];
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: IsoDate;
  credentialUrl: string | null;
  logoUrl: string | null;
}

export type LearningStatus = "Exploring" | "Learning" | "Comfortable";

export interface LearningItem {
  topic: string;
  note: string;
  status: LearningStatus;
  progressPercent: number | null;
  link: string | null;
}

export type RoadmapStatus = "Planned" | "InProgress" | "Done";

export interface RoadmapItem {
  title: string;
  description: string;
  targetDate: IsoDate;
  status: RoadmapStatus;
}

export interface PostCard {
  slug: string;
  title: string;
  excerpt: string;
  readingTimeMinutes: number;
  publishedAt: IsoDateTime | null;
  tags: string[];
}

export interface PostDetail extends PostCard {
  bodyMarkdown: string;
}

/** The five node types. Also the lens keys, so no mapping layer is needed. */
export type TimelineItemType =
  | "experience"
  | "project"
  | "certification"
  | "milestone"
  | "roadmap";

export type TimelineTrack = "career" | "life";

export interface TimelineEra {
  id: string;
  name: string;
  tagline: string | null;
  startDate: IsoDate;
  /** Null means still running, or the open-ended future era. */
  endDate: IsoDate | null;
}

export interface TimelineConnection {
  kind: "project" | "article" | "skill" | "experience";
  title: string;
  slug: string | null;
  /** Why these are connected, so the reader is never left guessing. */
  via: string;
}

export interface TimelineItem {
  type: TimelineItemType;
  track: TimelineTrack;
  /** Null when no era covers this date; renders under its year alone. */
  eraId: string | null;
  date: IsoDate;
  endDate: IsoDate | null;
  title: string;
  subtitle: string | null;
  summary: string | null;
  slug: string | null;
  status: string | null;
  category: string | null;
  link: string | null;
  highlights: string[];
  techStack: string[];
  tags: string[];
  connections: TimelineConnection[];
}

export interface Timeline {
  /** The server's date, so the today boundary cannot be misplaced by a wrong client clock. */
  today: IsoDate;
  eras: TimelineEra[];
  items: TimelineItem[];
}

export interface SiteStatus {
  currentFocus: string;
  mood: string | null;
  updatedAt: IsoDateTime;
  /** Null until the GitHub integration lands, or when GitHub is unreachable. */
  lastCommit: LastCommit | null;
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
