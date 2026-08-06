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
  /** The organisation that owns the work, or null for a personal project. */
  owner: string | null;
}

/** One headline number from a project's results. */
export interface ProjectMetric {
  label: string;
  value: string;
  note: string | null;
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
  /** The architecture as text, one edge per line. Rendered as an animated SVG. */
  architectureDiagram: string | null;
  metrics: ProjectMetric[];
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
  /** Null for a personal project. */
  owner: string | null;
  ownerUrl: string | null;
  /**
   * How permission to publish was given. Always present when `owner` is — the database
   * enforces the pair, because naming a company is a claim and this is what backs it.
   */
  permissionNote: string | null;
  evidenceUrl: string | null;
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

export type CredentialKind = "Certification" | "AppliedSkill" | "Badge" | "Training";

export interface Certification {
  name: string;
  issuer: string;
  /** Only Certification and AppliedSkill reach the résumé. */
  kind: CredentialKind;
  issueDate: IsoDate;
  /** Null for credentials that do not lapse. */
  expiryDate: IsoDate | null;
  /** Decided by the server, which owns a clock a Server Component is not allowed to read. */
  isExpired: boolean;
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
  /**
   * Set when the article lives somewhere else — the card links out, there is nothing to
   * read at `/knowledge/{slug}`, and `readingTimeMinutes` is meaningless because there is
   * no body here to have measured. Entered by hand for publishers with no feed.
   */
  externalUrl: string | null;
  coverImageUrl: string | null;
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
  /** A picture for the card. Projects use their first screenshot; others are null. */
  imageUrl: string | null;
  videoUrl: string | null;
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

/**
 * The CV header. Null on a site whose profile has not been filled in — every field on it
 * is a claim about a real person, so an unset profile is absent rather than a placeholder.
 */
export interface Profile {
  fullName: string;
  /** Read by a parser as the job title, so it is a role and not a slogan. */
  headline: string;
  summary: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedInUrl: string | null;
  gitHubUrl: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  /** Formerly Twitter. */
  xUrl: string | null;
  availability: string | null;
  /** Handles, not links — what the Analytics page fetches with. Blank means never called. */
  gitHubUsername: string | null;
  stackOverflowUserId: string | null;
  credlyUsername: string | null;
  dockerHubUsername: string | null;
  mediumUsername: string | null;
}

/** A qualification, lifted from the timeline's education milestones. */
export interface ResumeEducation {
  title: string;
  detail: string | null;
  startDate: IsoDate;
  endDate: IsoDate | null;
}

/**
 * The whole CV in one payload.
 *
 * Assembled server-side rather than from five calls here, because there are two renderers
 * — this page and the Word export — and two renderers assembling the same document
 * separately is how the download starts disagreeing with the page.
 */
export interface Resume {
  profile: Profile | null;
  roles: Experience[];
  education: ResumeEducation[];
  projects: ProjectCard[];
  skills: SkillGroup[];
  certifications: Certification[];
}

/**
 * The non-GitHub half of Analytics.
 *
 * Every member means the same thing when null or empty: **that service is not set up, or
 * has nothing to show, so its section does not render.** A section that appears with a
 * zero in it reads as "this person has none", which is a different and usually false claim.
 */
export interface ExternalStats {
  stackOverflow: StackOverflowStats | null;
  badges: CredentialBadge[];
  dockerHub: DockerHubStats | null;
  articles: ArticleLink[];
  /**
   * The server's date, for comparing a credential's expiry against. Carried on the payload
   * because a Server Component may not read the clock under Cache Components — it throws.
   */
  today: IsoDate;
}

export interface StackOverflowStats {
  displayName: string;
  profileUrl: string;
  reputation: number;
  answers: number;
  questions: number;
  /** Accepted over answered, or null when it could not be counted. One of three figures on
   *  the page with a real denominator, and so one of three allowed a ring. */
  acceptedRate: number | null;
  goldBadges: number;
  silverBadges: number;
  bronzeBadges: number;
  memberSince: IsoDate;
  topTags: TagScore[];
}

export interface TagScore {
  name: string;
  score: number;
  posts: number;
}

/** A credential badge, from Credly or from the CMS. `source` is "cms" or "credly". */
export interface CredentialBadge {
  name: string;
  issuer: string;
  url: string | null;
  imageUrl: string | null;
  issuedAt: IsoDate | null;
  expiresAt: IsoDate | null;
  source: string;
}

export interface DockerHubStats {
  username: string;
  repositories: number;
  totalPulls: number;
  images: DockerImage[];
}

export interface DockerImage {
  name: string;
  description: string | null;
  pulls: number;
  stars: number;
  lastUpdated: IsoDate;
  url: string;
}

/** An article published somewhere that is not this site. */
export interface ArticleLink {
  title: string;
  url: string;
  publishedAt: IsoDate;
  summary: string | null;
  tags: string[];
  /** The article's own picture, lifted from the first image in the feed's body HTML. */
  imageUrl: string | null;
}

export interface SiteStatus {
  currentFocus: string;
  mood: string | null;
  updatedAt: IsoDateTime;
  /** Null when GitHub is unreachable or no token is configured. */
  lastCommit: LastCommit | null;
}

export interface LastCommit {
  message: string;
  repo: string;
  when: IsoDateTime;
}

export interface ContributionDay {
  date: IsoDate;
  count: number;
}

/**
 * What the headline contribution number is made of.
 *
 * The four activity counts sum to the year's total, which is the rare case on this page
 * where a proportional reading is honest — there is a real denominator.
 *
 * `privateContributions` is GitHub's `restrictedContributionsCount`: work in repositories
 * a reader cannot open. It is zero unless the account owner has turned on "Include private
 * contributions on my profile", which is what makes it publishable — the count is
 * disclosed deliberately, and carries no repository name, message or employer with it.
 */
export interface ContributionBreakdown {
  commits: number;
  pullRequests: number;
  reviews: number;
  issues: number;
  privateContributions: number;
  hasPrivateContributions: boolean;
  repositoriesCommittedTo: number;
  /** Counted, never named. A private repository name is often a client's name. */
  privateRepositoriesCommittedTo: number;
}

export interface Week {
  /** The Monday the week begins on. */
  weekStart: IsoDate;
  total: number;
  /** Four-week trailing mean; null for the first three weeks, where there is no window. */
  mean: number | null;
}

export interface YearTotal {
  year: number;
  contributions: number;
}

export interface DayOfWeekTotal {
  day: string;
  total: number;
  /** Per occurrence of this weekday, so a year with 53 Mondays does not read high. */
  mean: number;
}

/** A repository owned by someone else that this account has contributed to. */
export interface ContributedRepo {
  nameWithOwner: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
}

export interface RepoSummary {
  name: string;
  language: string | null;
  pushedAt: IsoDateTime;
  url: string;
}

export interface LanguageShare {
  name: string;
  percent: number;
}

/** `GET /api/github/stats`. */
export interface GitHubStats {
  /**
   * False when GitHub has never been reached — no token, no username, or a first
   * request that failed. The page says "not connected" rather than presenting
   * zeroes as if they were measurements.
   */
  isLive: boolean;
  fetchedAt: IsoDateTime;
  contributionsLastYear: number;
  publicRepos: number;
  currentStreakDays: number;
  longestStreakDays: number;
  busiestDayCount: number;
  busiestDay: IsoDate | null;
  calendarFrom: IsoDate | null;
  calendarTo: IsoDate | null;
  calendar: ContributionDay[];
  languages: LanguageShare[];
  lastCommit: LastCommit | null;
  /** Most recently pushed public repositories. Empty until GitHub has been reached. */
  repos: RepoSummary[];
  /** Null on a payload cached before the breakdown existed, or with no GraphQL token. */
  breakdown: ContributionBreakdown | null;
  /** The year as a series, one bucket per week, with a trailing mean. */
  weekly: Week[];
  /** One total per year, oldest first, for the life of the account. */
  years: YearTotal[];
  byDayOfWeek: DayOfWeekTotal[];
  contributedTo: ContributedRepo[];
  /** Days with at least one contribution, over `calendarDays` — a real denominator. */
  activeDays: number;
  calendarDays: number;
  /** The longest run of days with nothing at all. The counterweight to the streak. */
  longestGapDays: number;
}
