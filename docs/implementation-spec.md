# Implementation Spec & Build Plan

*Companion to the Product Proposal. This document is the "how." Read the proposal for the "what/why"; read this to build.*

> **Note on the as-built architecture.** §2 (solution layout) and §6 (admin hosting) below describe the originally-proposed structure. The implementation supersedes them: the solution is `Chronicle`, layered Domain / Application / Infrastructure / Portfolio(Server + Client) with MediatR CQRS and a .NET Aspire AppHost, and the Blazor admin is hosted inside `Chronicle.Portfolio.Server` at `/admin`. **See `CLAUDE.md` for the authoritative as-built conventions.** Everything else here — the data model (§3), API shapes (§5), interaction specs (§16–§18), and acceptance criteria — applies as written.

---

## 0. Timeline reality check

Target: **core portfolio live in ~4 weeks**, **everything except the Software City within ~8 weeks**, solo, with a day job, using Claude Code.

That is aggressive but achievable **if the slices hold**:

- **Weeks 1–4 — LAUNCH.** Phase 0 + Phase 1: the full .NET backend + admin + API, the content pages, and Recruiter Mode. At the end of week 4 you have a **complete, real portfolio** on a live URL.
- **Weeks 5–8 — FULL FEATURE.** Phase 2 + Phase 3: the Timeline, Knowledge Core, Analytics, interactive résumé, and the (free-model) AI Copilot. End of week 8 = full release minus the city.
- **Software City** starts only after week 8, behind its "Coming Soon" teaser, as a separate repository.

If time slips, the launch milestone (week 4) is protected; Phase 2–3 features slip individually, never the launch.

---

## 1. Global conventions

Apply everywhere so Claude Code stays consistent.

- **IDs:** `Guid` primary keys, generated server-side.
- **Slugs:** lowercase, hyphenated, unique per content type; auto-generated from title with a manual override field.
- **Dates:** store `DateOnly` for calendar dates (start/end), `DateTimeOffset` (UTC) for timestamps. API returns ISO-8601.
- **Rich text:** authored and stored as **Markdown** strings; rendered to HTML on the frontend (sanitized).
- **Timestamps:** every content entity has `CreatedAt` and `UpdatedAt` set automatically. *(As built: via an `AuditableEntityInterceptor : SaveChangesInterceptor`, not a `SaveChanges` override.)*
- **API response envelope:** return resources directly (no wrapper) for GETs; use standard HTTP status codes. Errors use RFC-7807 `ProblemDetails`.
- **Sorting:** every list entity has an `int SortOrder` (manual ordering in admin) plus a natural date sort where relevant.
- **Enums:** stored as `int` in DB, serialized as string in JSON (`JsonStringEnumConverter`).
- **Naming:** PascalCase C#, camelCase JSON, kebab-case routes and slugs.

---

## 2. Backend — solution & project responsibilities

> **Superseded by `CLAUDE.md`.** Retained for the responsibility descriptions, which still hold.

The original proposal:

```
Portfolio.sln
  src/
    Portfolio.Core            // no external deps: entities, enums, interfaces
    Portfolio.Infrastructure  // EF Core DbContext, configurations, migrations, seed, repositories, services
    Portfolio.Api             // public read-only API + DTOs + caching + Swagger
    Portfolio.Admin           // Blazor Server, Identity-protected CRUD
  tests/Portfolio.Tests
```

**As built,** those responsibilities map as follows:

| Original | As built |
|---|---|
| `Portfolio.Core` entities + enums | `Chronicle.Domain` |
| `Portfolio.Core` service interfaces (ports) | `Chronicle.Application/Common/Interfaces` |
| — (no equivalent) | `Chronicle.Application` — MediatR CQRS handlers, DTOs, validators |
| `Portfolio.Infrastructure` | `Chronicle.Infrastructure` |
| `Portfolio.Api` | `Chronicle.Portfolio.Server` (`/api/*`) |
| `Portfolio.Admin` | `Chronicle.Portfolio.Server` (`/admin`) |
| `docker-compose.yml` | `Chronicle.AppHost` (.NET Aspire) |

**Package choices:** `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.AspNetCore.Identity.EntityFrameworkCore`, `Serilog.AspNetCore`, `FluentValidation`, `Riok.Mapperly`, `MediatR`. *(As built: OpenAPI is the built-in .NET 10 `AddOpenApi()` + Scalar UI, not Swashbuckle.)*

---

## 3. Backend — data model (EF Core, detailed)

**This section is authoritative.** Types, keys, relationships, constraints, indexes. `[req]` = required/non-null.

> As built, constraints live in `IEntityTypeConfiguration<T>` classes, **not** DataAnnotations, so `Chronicle.Domain` stays free of persistence concerns.

### Project
| Field | Type | Notes |
|---|---|---|
| Id | Guid | PK |
| Title | string(200) | req |
| Slug | string(200) | req, **unique index** |
| Pitch | string(300) | req, one-liner |
| Problem | string (md) | req |
| Solution | string (md) | req |
| KeyDecisions | string (md) | nullable |
| ArchitectureNotes | string (md) | nullable |
| ArchitectureDiagramUrl | string(500) | nullable |
| Results | string (md) | nullable |
| LessonsLearned | string (md) | nullable |
| VideoUrl / GithubUrl / DemoUrl / DocsUrl | string(500) | all nullable |
| StartDate | DateOnly | req |
| EndDate | DateOnly? | null = ongoing |
| Featured | bool | default false |
| SortOrder | int | default 0 |
| CreatedAt / UpdatedAt | DateTimeOffset | auto |

Relationships: `Screenshots` 1–* `Media` (cascade delete); `Tags` *–* `Tag` (join table); `TechStack` *–* `Skill` (join table). Index on `(Featured, StartDate desc)`.

### Experience
`Id`, `Role`[req 150], `Company`[req 150], `StartDate`[req], `EndDate?`, `Summary`[req md], `Highlights` (owned collection of strings — stored as `jsonb`), `TechStack` (*–* `Skill`), `SortOrder`, timestamps.

### Post
`Id`, `Title`[req 200], `Slug`[req unique], `Excerpt`[req 300], `BodyMarkdown`[req], `Tags`(*–* `Tag`), `ReadingTimeMinutes`(int, computed on save from body word count), `IsPublished`(bool default false), `PublishedAt?`, timestamps. Index on `(IsPublished, PublishedAt desc)`.

### LearningItem
`Id`, `Topic`[req 150], `Note`[req 500], `Status`(enum: Exploring|Learning|Comfortable), `ProgressPercent`(int? 0–100), `Link?`, `SortOrder`, `UpdatedAt`.

### Skill
`Id`, `Name`[req 100 unique], `Category`(enum: Backend|Frontend|Database|DevOps|Cloud|AI|Other), `YearsExperience`(decimal(3,1)), `Proficiency`(enum 1–5), `SortOrder`. "Used in" is derived from the `Project.TechStack` and `Experience.TechStack` joins — no stored field.

### RoadmapItem
`Id`, `Title`[req 150], `Description`[req 500], `TargetDate`(DateOnly), `Status`(enum: Planned|InProgress|Done), `SortOrder`.

### Certification
`Id`, `Name`[req 200], `Issuer`[req 150], `IssueDate`(DateOnly), `CredentialUrl?`, `LogoUrl?`, `SortOrder`.

### Tag
`Id`, `Name`[req 60], `Slug`[req unique], `Category?`(string 60).

### Media
`Id`, `ProjectId`(FK req), `Url`[req 500], `Caption?`(200), `SortOrder`.

### SiteStatus (single-row)
`Id`, `CurrentFocus`[req 200], `Mood?`(60), `UpdatedAt`. Enforce single row via a seeded fixed Guid; admin edits, never creates.

### GitHubStatsCache
`Id`, `PayloadJson`(jsonb), `FetchedAt`(DateTimeOffset). Single row; overwritten on refresh.

### Identity
Use ASP.NET Core Identity default tables. Seed **one** admin user from config/secrets on first run.

---

## 4. Migrations & seeding

- Initial migration `InitialCreate` creates all tables + Identity.
- A `SeedData` routine (runs in dev only) inserts: 1 admin user, ~3 skills per category, 2–3 sample projects (1 flagship with full fields + screenshots), 2 experience rows, 2 posts, 3 roadmap items, 2 certifications, the single `SiteStatus` row, and a handful of tags.
- Seed lets the frontend be built against real-shaped data from day one.

---

## 5. Backend — public API (request/response)

All GET, anonymous, output-cached (§11). Representative shapes:

**`GET /api/projects?tag={slug}&featured={bool}`** — list of card DTOs:
```json
[{
  "slug": "core-banking-ledger",
  "title": "Core Banking Ledger",
  "pitch": "Double-entry ledger handling 4k tx/s",
  "featured": true,
  "startDate": "2024-03-01",
  "endDate": null,
  "tags": ["backend","database"],
  "techStack": ["C#",".NET","PostgreSQL"],
  "thumbnailUrl": "https://.../thumb.png"
}]
```

**`GET /api/projects/{slug}`** — full case study (adds `problem`, `solution`, `keyDecisions`, `architectureNotes`, `architectureDiagramUrl`, `results`, `lessonsLearned`, all link URLs, `screenshots[]{url,caption}`). Markdown fields returned raw; frontend renders + sanitizes.

**`GET /api/timeline`** — merged, date-sorted stream powering Signature #1:
```json
[
  { "type": "experience", "date": "2023-01-01", "endDate": null,
    "title": "Associate Software Engineer", "subtitle": "Company X",
    "summary": "...", "highlights": ["..."], "techStack": ["..."] },
  { "type": "project", "date": "2024-03-01", "endDate": null,
    "title": "Core Banking Ledger", "slug": "core-banking-ledger",
    "pitch": "...", "tags": ["backend"] },
  { "type": "roadmap", "date": "2028-01-01", "status": "Planned",
    "title": "Senior Software Engineer", "description": "..." }
]
```
Server merges Experience + Project + RoadmapItem, tags each with `type`, sorts ascending by `date`. Frontend groups by year and marks the "today" boundary.

**Other endpoints** (shapes analogous): `GET /api/experience`, `GET /api/skills` (grouped by category), `GET /api/posts?tag=`, `GET /api/posts/{slug}`, `GET /api/learning`, `GET /api/roadmap`, `GET /api/certifications`, `GET /api/status`, `GET /api/github/stats`.

**`GET /api/career-graph`** *(as-built addition, Phase 2)* — lifecycle JSON conforming to `contracts/career-graph.v1.schema.json`, consumed by the separate Software City repository. Projects Skills → buildings, Projects → roads/districts, Experience → skyline height, RoadmapItems → Future Blueprint entities, each stamped with `built` / `upgraded` dates.

**`POST /api/contact`** (rate-limited, honeypot + optional captcha):
```json
// request
{ "name": "...", "email": "...", "message": "...", "website": "" }  // website = honeypot, must be empty
// 202 Accepted on success; 429 if rate-limited; 400 ProblemDetails on validation error
```

**`POST /api/copilot`** (Phase 3): `{ "question": "..." }` → `{ "answer": "...", "sources": [{ "title":"...","url":"..." }] }`. Rate-limited per IP; scoped to portfolio content; returns a graceful fallback message if the model is unavailable.

---

## 6. Backend — admin panel (screen by screen)

> As built: hosted at `/admin` inside `Chronicle.Portfolio.Server`, Blazor Web App with `InteractiveServer` render mode, Identity login required.

One list + edit screen per content type. Each list: table with sort/reorder, search, publish toggle where relevant, edit/delete. Each editor: form bound to the entity with FluentValidation, a **Markdown field with live preview** for rich fields, and image upload for media.

Screens: Dashboard (counts + quick links + "edit site status"), Projects, Experience, Posts, Skills, Learning, Roadmap, Certifications, Tags, Media (per project, inline on the project editor), Site Status (single-row editor). Media upload writes to object storage and stores the returned URL.

**Acceptance:** a non-developer can create a full project (with screenshots and tags) and see it live on the public site **immediately**, with zero code changes. *(As built this is immediate rather than "within a cache TTL", because admin commands evict tagged output-cache entries via `IOutputCacheStore.EvictByTagAsync`.)*

---

## 7. Backend — auth

- ASP.NET Core Identity, cookie auth for the Blazor admin.
- Single admin seeded from user-secrets (`Admin:Email`, `Admin:Password`) on first run; password change flow available.
- Public API requires no auth (read-only); `/admin` requires login. Both surfaces share one host, separated by route and auth policy.
- Enforce HTTPS, secure/SameSite cookies, anti-forgery on admin forms.

---

## 8. Backend — GitHub service

- `IGitHubService.GetStatsAsync()` calls GitHub GraphQL (contributions calendar, streak) + REST (repos, languages) using a **server-side PAT** from secrets.
- Result shaped into: `totalCommits`, `publicRepos`, `contributionCalendar[]{date,count}`, `topLanguages[]{name,percent}`, `currentStreakDays`, `lastCommit{message,repo,when}`.
- **Caching:** persist to `GitHubStatsCache` with `FetchedAt`; serve cached if fresh (e.g. < 1 hour), refresh on a background timer / on-demand if stale. `GET /api/github/stats` and `GET /api/status` (last-commit portion) both read this cache. Token never reaches the browser.

---

## 9. Backend — contact / email

- `IEmailService.SendAsync(contactMessage)` via SMTP or a transactional provider (config-driven).
- Endpoint validates, checks honeypot, rate-limits per IP, then sends. Never expose SMTP creds client-side. Log failures via Serilog.

---

## 10. Backend — AI Copilot (deferred, free-model)

- Behind `ICopilotService` so the provider swaps freely.
- **Approach:** at content-publish time, chunk + embed posts/projects into a lightweight vector store (pgvector on the same PostgreSQL is the simplest — no new infra). On query: embed the question, retrieve top-k chunks, prompt a **free/local model** (local Ollama, or a free-tier API) with retrieved context + a strict system prompt ("answer only about this engineer's work; if unknown, point to the relevant page").
- Guardrails: per-IP rate limit, max question length, scope enforcement, fallback message on unavailability. No paid per-token dependency at launch.
- Ships Phase 3 only; nothing else depends on it.

---

## 11. Backend — caching, logging, validation, config

- **Caching:** ASP.NET Core **output caching** on all public GETs (short TTL, e.g. 60s) **with cache tags per resource**, evicted by admin commands. Plus `IMemoryCache` for GitHub stats.
- **Logging:** Serilog, structured, request logging + errors.
- **Validation:** FluentValidation validators per command/query, run in a MediatR `ValidationBehaviour`; failures return `ProblemDetails`.
- **Config/secrets:** `appsettings.json` + environment variables + user-secrets in dev. **Never commit secrets** — the repository is public. Keys: DB connection, `GitHub:Pat`, `GitHub:Username`, `Admin:*`, `Smtp:*`, `Cors:AllowedOrigins`, `Copilot:*`.
- **CORS:** allow only the frontend origin(s).

---

## 12. Frontend — setup & structure

Next.js (App Router) + TypeScript + Tailwind + Motion.

```
Chronicle.Portfolio.Client/
  app/
    layout.tsx              // root: theme + RecruiterModeProvider + nav/footer
    page.tsx                // Mission Control (home)
    about/page.tsx
    skills/page.tsx
    timeline/page.tsx
    projects/page.tsx
    projects/[slug]/page.tsx
    knowledge/page.tsx
    knowledge/[slug]/page.tsx
    analytics/page.tsx
    resume/page.tsx
    ask/page.tsx            // Copilot (Phase 3)
    contact/page.tsx
    city/page.tsx           // Coming Soon teaser
    sitemap.ts / robots.ts
  components/               // NavBar, Footer, ProjectCard, TimelineNode, StatusStrip,
                            // MarkdownRenderer, TagFilter, RecruiterToggle, ...
  lib/
    api.ts                  // typed fetchers
    types.ts                // GENERATED from the server's OpenAPI document
    recruiterMode.tsx       // context + persistence
  styles/
```

- **Data fetching:** server components fetch from the .NET API; use `revalidate` (ISR) on content pages for speed + freshness. The Analytics and Status data revalidate more frequently.
- **Markdown:** `MarkdownRenderer` using `react-markdown` + `rehype-sanitize` (+ syntax highlighting for code).
- **Types:** `lib/types.ts` is generated by `openapi-typescript` from the server's OpenAPI document — never hand-mirrored, so it cannot drift.

---

## 13. Frontend — design tokens & Recruiter Mode

**Design direction: mission-control / engineering telemetry.**

| Token | Value |
|---|---|
| Base (paper) | `#F2F4F6` |
| Ink (deep navy) | `#0E1420` |
| Accent (single amber signal) | `#B26B00` |
| Display font | Space Grotesk |
| Body / mono | IBM Plex Sans / IBM Plex Mono |

Under Tailwind v4 these are `@theme` custom properties in `app/globals.css` (v4 is CSS-first — there is no `tailwind.config.ts`). Define once; use everywhere. Intentional type, not template defaults.

- **Recruiter Mode** (`lib/recruiterMode.tsx`): React context holding `isRecruiterMode`, persisted to a cookie so SSR reads it and there's no flash. A `<RecruiterToggle>` in the nav flips it. Every page reads the flag:
  - **On:** disable animation (wrap so animations no-op), single dense column, hide the Timeline's atmospheric effects (show a plain chronological list instead), surface summary + skills + experience + top-3 projects + résumé download above the fold.
  - **Off:** full animated experience.
- Also honor `prefers-reduced-motion` independently (reduced motion → recruiter-mode animation behavior without the layout change).

---

## 14. Frontend — API client & types

- `lib/types.ts` is generated from the API's OpenAPI document.
- `lib/api.ts` exposes typed functions: `getProjects(filter)`, `getProject(slug)`, `getTimeline()`, `getSkills()`, `getPosts(tag?)`, `getPost(slug)`, `getLearning()`, `getRoadmap()`, `getCerts()`, `getStatus()`, `getGithubStats()`, `postContact(payload)`, `askCopilot(q)`. Base URL from env (injected by the Aspire AppHost in dev). Central error handling.

---

## 15. Frontend — per-page component specs

Each page: component tree + data + acceptance criteria.

**Mission Control (`/`)** — `Hero` (headline, positioning, primary CTAs) + `StatusStrip` (last commit, current focus, week activity, optional mood — from `/api/status` + `/api/github/stats`) + entry cards to Timeline/Projects/Résumé. *Accept:* status is live, loads < 2s, degrades gracefully if GitHub is down.

**About (`/about`)** — `StorySection` (markdown) + `CertificationsStrip` (from `/api/certifications`). *Accept:* certs link out to credentials.

**Skills (`/skills`)** — `SkillGroup` per category; each `SkillCard` shows name, years, proficiency meter, and "used in" chips linking to the projects/roles that reference it. *Accept:* "used in" links resolve correctly.

**Projects (`/projects`)** — `TagFilter` + responsive `ProjectCard` grid from `/api/projects`. *Accept:* filtering by tag is instant (client-side over fetched list); featured projects surfaced first.

**Case study (`/projects/[slug]`)** — sections per the 8-part template: `Hero`, `Problem`, `SolutionDecisions`, `Architecture` (animated diagram / image), `DeepDive`, `Results`, `Lessons`, `Artifacts` (screenshots gallery, video, links). Markdown-rendered. *Accept:* SSG/ISR, OG image, all optional sections hidden cleanly when empty.

**Knowledge Core (`/knowledge`)** — tabbed or split: `ArticleList` (from `/api/posts`, tag-filterable) + `LearningBoard` (from `/api/learning`, cards with status + progress). Article pages at `/knowledge/[slug]`. *Accept:* only published posts show; reading time displays.

**Analytics (`/analytics`)** — `ContributionCalendar`, `LanguageBreakdown`, `StatCards` (commits, repos, streak) from `/api/github/stats`. *Accept:* renders from cache; never blocks on live GitHub.

**Résumé (`/resume`)** — interactive résumé assembled from Experience/Skills/Projects + a **Download PDF / Print** action (print-optimized CSS via `@media print`, or server-side PDF generation later). *Accept:* printed/PDF output is clean, single-purpose, ATS-friendly. Recruiter Mode surfaces this prominently.

**Contact (`/contact`)** — `ContactForm` posting to `/api/contact` (honeypot field, client validation) + direct links. *Accept:* success/failure states; honeypot blocks bots; rate-limit message handled.

**City teaser (`/city`)** — `ComingSoon` (concept pitch, preview still/loop, follow hook). *Accept:* clearly "coming soon," no broken 3D. Later links out to the separate Software City deployment.

**Easter eggs** — a hidden `Terminal` component (keyboard shortcut or Konami-style trigger) exposing extra technical content. *Accept:* discoverable but unobtrusive; keyboard-accessible.

---

## 16. Signature #1 — Timeline interaction spec (deep)

**Data:** single fetch of `/api/timeline` (§5), grouped by year on the client; the "today" boundary computed from `new Date()`.

**Layout:** vertical central axis; nodes alternate/attach along it; year markers as the visitor scrolls. Mobile = single column, nodes stacked, axis on the left.

**Scroll mechanics:**
- Native scroll drives progress (no scroll-hijacking — better accessibility and mobile behavior).
- As a node enters the viewport it animates in (fade + slight translate/scale, ~250–350ms, ease-out) via `whileInView` / `IntersectionObserver`.
- The current era applies a **subtle background color grade** that transitions as year markers cross a threshold. Keep contrast within accessibility limits; grade is atmosphere, not spectacle.

**Node types & rendering:**
- **Experience** — anchored card: role, company, date range, summary, highlights on expand.
- **Project** — card with pitch + tags; entire card links to `/projects/{slug}`.
- **Roadmap (future)** — rendered **below the "today" marker**, dotted/translucent styling, `TargetDate` + status; visually distinct as "not yet."
- **Ambient markers** (optional) — faint inline labels for a few tech-industry moments; purely contextual, non-interactive.

**"You are here":** a persistent marker at the present-day boundary; on load, scroll position starts here (or a "jump to now" control).

**States:** loading skeleton; empty (no items) fallback; error fallback; **Recruiter Mode / reduced-motion** — render a plain, static chronological list (no grading, no motion) with the same data.

**Accessibility:** each node is a semantic article; keyboard-focusable; project nodes are real links; `prefers-reduced-motion` disables all transitions; color grade never the sole carrier of meaning.

**Acceptance criteria:**
1. All experience, projects, and roadmap items appear in correct chronological order with the today boundary correctly placed.
2. Scrolling reveals nodes smoothly at 60fps on a mid-range phone.
3. Future items are visually distinct and clearly labeled as goals.
4. Clicking a project node opens its case study.
5. Reduced-motion / Recruiter Mode yields a clean static list with no animation and no layout breakage.
6. Adding a project or roadmap item in the admin makes it appear here immediately, with no code change.

---

## 17. Signature #2 — Recruiter Mode spec (deep)

**Goal:** a hiring screener gets everything they need in < 60s, zero animation.

**Mechanism:** cookie-persisted flag read at SSR (no flash), toggled from the nav, applied globally (§13).

**Recruiter-mode rendering rules:**
- Global: no animation; single dense column; reduced imagery; higher information density.
- Home: collapse hero to a concise summary + immediate résumé download + "top 3 projects" links.
- Timeline: replaced by a static chronological experience list.
- Projects: show outcomes/results prominently on cards.
- Résumé: promoted to primary CTA everywhere.

**Persistence & SSR:** store `recruiterMode=1|0` cookie; root layout reads it server-side to choose the initial render; toggle updates cookie + state without full reload.

**Acceptance criteria:**
1. Toggling flips the entire site instantly and the choice survives navigation and reload with no flash.
2. In recruiter mode, summary + skills + experience + top-3 projects + résumé download are reachable without horizontal scroll and mostly above the fold on desktop.
3. No animations run in recruiter mode.
4. Works identically for a first-time visitor who lands with the cookie already set.

---

## 18. Signature #3 — AI Copilot spec (deferred)

Implements §10 on the backend + a simple `/ask` chat UI: input, streamed/plain answer, and a **sources** list linking to the cited posts/projects. Per-IP rate limit surfaced in UI; fallback message when the model is unavailable. Ships Phase 3; free/local model only; nothing else depends on it.

---

## 19. Cross-cutting checklists

**SEO:** per-page `<title>`/meta, canonical URLs, `sitemap.ts`, `robots.ts`, OpenGraph + Twitter cards, JSON-LD `Person` + `CreativeWork` for projects, semantic headings.

**Performance:** SSG/ISR for content; images optimized (`next/image`) with width/height; lazy-load below-fold; API output-cached; target good Core Web Vitals (LCP < 2.5s, CLS < 0.1).

**Accessibility:** semantic landmarks, keyboard nav, focus states, alt text, `prefers-reduced-motion`, color-contrast AA, Recruiter Mode as a fully static alternative.

**Security:** admin behind Identity + HTTPS + anti-forgery; secrets server-side only; rate limits on `contact` + `copilot`; input validation; CORS locked to the frontend origin; no tokens in the browser. **The repository is public — secrets live only in user-secrets and CI secrets.**

---

## 20. Phase 1 task breakdown (epics -> tickets)

Each ticket has an acceptance bar. Estimates are ideal focused hours (compress heavily with Claude Code).

### Epic A — Repo & infra (Phase 0)
- A1 Scaffold the solution + Aspire AppHost + `docs/`. *Accept: `dotnet run --project src/Chronicle.AppHost` starts the stack.* (2h)
- A2 Solution skeleton: `global.json`, `Directory.Build.props`, Central Package Management, all projects, reference graph. *Accept: solution builds.* (2h)
- A3 Scaffold Next.js + TS + Tailwind v4 + Motion; base layout, nav, footer, design tokens. *Accept: dev server renders a styled shell.* (3h)
- A4 CI/CD: GitHub Actions build+test both apps; deploy targets (Azure App Service / Vercel). *Accept: green pipeline; "coming soon" page live.* (3h)

### Epic B — Data & backend core (Phase 1)
- B1 Implement all entities + enums in `Chronicle.Domain` (§3). *Accept: compiles, zero package references.* (2h)
- B2 `ChronicleDbContext` + `IEntityTypeConfiguration` per entity + relationships/indexes. (3h)
- B3 `InitialCreate` migration + apply. *Accept: schema created in Postgres.* (1h)
- B4 Seed data (§4). *Accept: DB has sample content incl. one full flagship project.* (2h)
- B5 `Chronicle.Application` scaffolding: MediatR, pipeline behaviours, `IChronicleDbContext`, ports. (2h)

### Epic C — Public API (Phase 1)
- C1 DTOs + Mapperly mapping (§5). (2h)
- C2 Feature slices + endpoints: projects (list+detail), experience, skills, posts (list+detail), learning, roadmap, certifications, status. *Accept: all return seeded data; OpenAPI/Scalar works.* (4h)
- C3 `/api/timeline` merged endpoint (§5/§16). *Accept: correct chronological merged output.* (2h)
- C4 Output caching with tags + CORS + ProblemDetails + Serilog. (2h)
- C5 `POST /api/contact` + email service + honeypot + rate limit. *Accept: sends email; blocks bots; 429 on abuse.* (3h)

### Epic D — Admin panel (Phase 1)
- D1 Blazor admin at `/admin` + Identity + seeded admin login. *Accept: login works; unauthorized redirected.* (3h)
- D2 CRUD pages for every entity + reorder + publish toggles + Markdown-with-preview field + cache-tag eviction on save. (6h)
- D3 Media upload to object storage, wired into project editor. *Accept: upload -> URL stored -> renders on site.* (3h)
- D4 Site Status single-row editor. (1h)

### Epic E — Frontend content pages (Phase 1)
- E1 `lib/types.ts` generation from OpenAPI + `lib/api.ts` typed client. (2h)
- E2 `MarkdownRenderer` (sanitized + code highlight). (1h)
- E3 Mission Control home + StatusStrip. (3h)
- E4 About + certifications. (2h)
- E5 Skills page with "used in" links. (3h)
- E6 Projects list + TagFilter + ProjectCard. (3h)
- E7 Case-study page (8-part template, empty-section handling). (5h)
- E8 Contact page + form states. (2h)
- E9 City "Coming Soon" teaser. (1h)
- E10 SEO wiring (metadata, sitemap, robots, OG). (3h)

### Epic F — Recruiter Mode (Phase 1, essential)
- F1 `recruiterMode` context + cookie persistence + SSR read (no flash). (3h)
- F2 Apply recruiter rendering rules across all Phase-1 pages (§17). *Accept: all §17 criteria pass.* (4h)
- F3 Résumé download stub (print CSS) surfaced in recruiter mode. (2h)

**End of Phase 1 = launchable portfolio** (backend + admin + content pages + Recruiter Mode live).

---

## 21. Compressed schedule (week by week)

Assumes evenings + weekends, Claude Code assisting. Milestones in **bold**.

**Week 1 — Foundations + backend spine.** Epic A (all), Epic B (all). *Milestone: "coming soon" live; schema + seed done.*

**Week 2 — API + admin.** Epic C (all), Epic D1–D2. *Milestone: content editable in admin; API serving seeded data.*

**Week 3 — Frontend core.** Epic D3–D4, Epic E1–E8. *Milestone: all core pages rendering real content.*

**Week 4 — Recruiter Mode + polish + LAUNCH.** Epic E9–E10, Epic F (all), a11y/perf/SEO pass, deploy. **Milestone: complete portfolio LIVE.**

**Week 5 — Timeline (Signature #1).** `/api/timeline` consumption + full interaction spec (§16) + reduced-motion/recruiter fallback.

**Week 6 — Knowledge Core + Analytics.** Articles + learning board; GitHub service + Analytics page + live Mission Control strip (§8).

**Week 7 — Résumé + career-graph + Copilot groundwork.** Interactive résumé + PDF; `contracts/career-graph.v1.schema.json` + `/api/career-graph`; pgvector + embedding pipeline; free/local model wired behind `ICopilotService`.

**Week 8 — Copilot UI + eggs + hardening. FULL RELEASE (minus city).** `/ask` UI, terminal easter egg, full a11y/perf/security pass, final QA. **Milestone: everything except Software City shipped.**

**Week 9+ — Software City.** Begin the deferred 3D build in its own repository, against the career-graph contract.

**Buffer rule:** if a week slips, protect the **Week 4 launch**; push individual Week 5–8 features later rather than delaying launch or compromising quality.

---

## 22. Definition of Done (per phase)

- **Phase 0:** solution builds in CI; Postgres runs; "coming soon" deployed on the real domain.
- **Phase 1 (LAUNCH):** admin can create/edit/delete all content types; public site renders that content on all core pages; Recruiter Mode passes §17; SEO + a11y + perf baselines met; deployed and shareable.
- **Phase 2:** Timeline passes §16; Knowledge Core + Analytics live and cache-backed; `/api/career-graph` validates against the committed schema.
- **Phase 3 (FULL):** interactive résumé + PDF; Copilot answers grounded questions on a free/local model with fallback + rate limiting; easter egg present.
- **Phase 4:** Software City ships from its own repository, driven by the career-graph contract.

---

*Build in the order of §20–§21. Protect the Week-4 launch. Keep content in the backend so the site stays alive without deploys.*
