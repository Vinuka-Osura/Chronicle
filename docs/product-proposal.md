# Engineering Portfolio — Product Proposal & Technical Brief

*A living, backend-driven portfolio built to read like the work of a senior engineer.*

> **Purpose of this document.** It has two jobs. (1) It fully explains the product — anyone can read it and understand exactly what the portfolio is, section by section. (2) It is written to be handed to **Claude Code** as the founding brief: the tech stack, architecture, data model, API, repository layout, and build order are all specified concretely enough to scaffold and start development from.
>
> **Note on the as-built architecture.** This document describes the product intent. The implementation deviates on structure — the solution is named `Chronicle`, backend and frontend live in one solution orchestrated by a .NET Aspire AppHost, the layering is Domain / Application / Infrastructure / Portfolio(Server + Client) with MediatR CQRS, and the admin panel is hosted inside `Chronicle.Portfolio.Server` rather than as a separate project. See `CLAUDE.md` for the as-built conventions. Product scope and intent below are unchanged.

---

## 1. Product vision

A personal engineering portfolio that is itself a **work sample**. Instead of a static page, it's a small full-stack product: a **.NET backend** with an admin panel where all content is managed without touching code, and an animated **Next.js frontend** that presents that content through a few carefully chosen signature experiences.

The audience is threefold, and the product serves each deliberately:

- **Recruiters / hiring screens** — need to skim and decide in under a minute. Served by **Recruiter Mode** (essential, first-class).
- **Engineers / hiring managers** — want depth and evidence of judgment. Served by case-study project pages and the career timeline.
- **The owner (you)** — needs to add projects and posts continuously without redeploying. Served by the .NET admin/CMS.

The backend is intentionally **.NET (ASP.NET Core)** because it showcases the owner's strongest skill set. For a backend-leaning engineer targeting a senior role, a real, self-built content backend is a stronger signal than any front-end effect.

---

## 2. Design principles

1. **The site is a work sample.** Clean code, fast loads, real architecture, and a working backend are the substance — not decoration.
2. **A few signatures, executed well.** Three signature experiences carry the personality; everything else stays clean and quick.
3. **Every section earns its place.** If it doesn't help a visitor decide "I want to hire / work with this person," it isn't here.
4. **Content is data, not code.** Adding a project or post is an admin-panel action, never a deploy.
5. **Ship in slices.** Each development phase ends at a live, shareable URL.

---

## 3. What the portfolio contains

Each surface below is a final part of the product.

### Mission Control (Home)
The landing surface. A strong headline and positioning statement, clear entry points to the rest of the site, and a **live status strip** driven by real data:
- **Last commit** (pulled from the GitHub API), e.g. *"38 minutes ago — feat: timeline scrubbing."*
- **Currently focused on** — a field set in the admin panel.
- **This week's activity / current streak** from GitHub.
- One optional personality metric (e.g. current mood).

The strip is always honest and live — it's proof of an active, working engineer, and it's the first thing that quietly signals "this is a real product, not a template."

### About / The Story
The narrative: who you are, how you got into engineering, what you care about building (banking / systems work, reliability, etc.), and where you're heading. Includes a compact **certifications & achievements** strip (issuer, date, credential link) inline — recognitions live alongside the story rather than on a separate page.

### Skills
Skills grouped by domain (Backend, Frontend, Database, DevOps/Cloud, AI, etc.). Each skill shows **years of experience**, a **proficiency level**, and **where it was used** (links through to the specific projects and roles that used it). This turns a skill list into evidence rather than a word cloud.

### Timeline (the "Time Travel" experience) — *Signature #1*
The flagship interaction. Experience, projects, and future goals rendered as **one continuous, scrollable stream through time**. Fully described in §5.

### Projects
The catalogue of work. Each project is a **case study page** built from a consistent template (§6): problem → decisions → architecture → results → lessons, plus artifacts (screenshots, video, GitHub, live demo, docs). Projects are filterable by tag (Backend, Frontend, Database, Docker, etc.). Flagship projects get the full deep-dive treatment; smaller ones render as concise cards. Every project is populated from the backend — adding one in the admin panel automatically publishes it here **and** places it on the Timeline.

### Knowledge Core
A single hub combining two related things:
- **Articles / blog** — technical write-ups, tagged and searchable.
- **What I'm learning now** — a live view of current topics of study, each with a short note and progress state.

Together they show an engineer who both produces and keeps growing — directly reinforcing the upward trajectory story.

### Engineering Analytics
A dashboard of real coding activity pulled from the GitHub API and cached by the backend: total commits, repositories, contribution calendar, most-used languages/tech, and current streak. Server-side caching keeps it fast and avoids rate limits and exposed tokens.

### Résumé + Recruiter Mode — *Signature #2 (essential)*
An interactive résumé plus a downloadable/printable PDF, and the site-wide **Recruiter Mode** toggle. Fully described in §5. This is a first-class, essential feature — prioritized above the AI Copilot.

### AI Copilot — *Signature #3 (later, low priority)*
An assistant that answers questions about your work, grounded in your own content. Deliberately deferred and built on a free / low-cost model. Fully described in §5.

### Contact
A fast, spam-protected contact form that posts to the backend and sends an email, plus direct links (email, GitHub, LinkedIn profile link-out).

### Build a Software City — *Coming Soon*
The future showpiece. Shipped later as a teaser now. Fully described in §7.

### Easter eggs
A small number of progressive rewards for curious visitors — including a hidden **terminal** where typing commands reveals deeper technical content. Kept subtle and tied to real content, never random gags.

---

## 4. Information architecture (sitemap)

```
Mission Control (/)            Home: hero + live status strip + entry points
About (/about)                 Story + certifications strip
Skills (/skills)               Grouped, with years + "used in" links
Timeline (/timeline)           Experience + Projects + Future Roadmap — one stream   <- Signature 1
Projects (/projects)           Tag-filtered list
   -> (/projects/{slug})       Full case-study page
Knowledge Core (/knowledge)    Articles + "currently learning"
   -> (/knowledge/{slug})      Article page
Analytics (/analytics)         GitHub-driven engineering metrics
Résumé (/resume)               Interactive résumé + PDF                              <- Signature 2
AI Copilot (/ask)              Ask-me-anything (later phase)                         <- Signature 3
Contact (/contact)             Form + links
Software City (/city)          "Coming Soon" teaser (built post-launch)

Global:  Recruiter Mode toggle (persisted) — restyles the entire site into a dense,
         animation-free, skim-optimized view.
```

---

## 5. The signature experiences (in priority order)

### Signature #1 — The Timeline ("Time Travel")

The centerpiece. Experience, projects, and future goals live on **one vertical, scrollable time axis**.

**How it behaves:**
1. **Entry** — the visitor lands positioned at **"You are here" (today)**.
2. **Scrubbing** — scrolling moves through the years; cards for each period animate in, and the background applies a quiet per-era colour grade (subtle atmosphere, not a light show). Vertical scroll is chosen for mobile-friendliness.
3. **Node types:**
   - **Experience nodes** — roles and promotions, anchored on the axis.
   - **Project nodes** — clickable; open the full case study.
   - **Ambient context markers** (optional, faint) — a few notable tech-industry moments for narrative texture.
4. **Past / present / future:**
   - **Past** — fully documented and solid.
   - **Present** — highlighted "you are here."
   - **Future** — the **Future Roadmap**: faint, dotted nodes for stated goals (e.g. *"Senior Engineer — target 2028," "Lead a system design," "First OSS contribution"*). This narrates the growth trajectory explicitly and honestly.

**Data source:** a single `/api/timeline` endpoint returns experience, projects, and roadmap items merged and sorted by date, so the whole stream is CMS-driven.

### Signature #2 — Recruiter Mode *(essential)*

A **site-wide toggle** (persisted in a cookie / localStorage) that instantly re-renders the entire portfolio into the "boring but perfect" version for hiring screens:
- No animations, dense single-column layout, everything above the fold.
- Summary, core skills with years, experience with dates, top 3 projects with **outcomes**, and a one-click résumé PDF.

It requires no special data — it's a rendering mode over the same content. Because it's built *for a specific audience*, it's a product-thinking / empathy signal that itself reads as senior. It is a first-class, essential feature and ships in the core phase, ahead of the AI Copilot.

### Signature #3 — AI Copilot *(later, low priority)*

An assistant that answers visitor questions ("What's their strongest project?", "How would they design a banking system?") grounded in your blog posts, project write-ups, and notes via retrieval (RAG over your own content).

**Deliberately deferred and cost-conscious:**
- Built on a **free or low-cost model** — e.g. a locally hosted open model (Ollama) or a free-tier API — rather than a paid per-token production API. This is a "study and implement carefully" feature, not a launch blocker.
- A `.NET` endpoint (`POST /api/copilot`) performs retrieval over embedded content and returns grounded answers, with per-visitor rate limiting, a strict scope (only answers about you and your work), and a graceful fallback ("I can point you to the relevant project") if unavailable.

---

## 6. Project case study template

Every project page follows the same structure so each reads like an engineering case study (structured thinking is what senior interviewers reward):

1. **Hero** — name, one-line pitch, landing animation, tech-stack chips.
2. **Problem** — what needed solving and for whom.
3. **Solution & key decisions** — the interesting part: the tradeoffs made and why.
4. **Architecture** — an animated architecture diagram showing the system working (data flow, services, database). This is where architecture visualization lives.
5. **Deep dive** — data model, notable performance work, and one genuinely hard problem solved.
6. **Results** — measurable outcomes (latency, scale, users, cost saved).
7. **Lessons learned** — honest reflection.
8. **Artifacts** — screenshots, video/demo, GitHub, live demo, documentation links.

Flagship projects use all eight sections; smaller projects render as short cards.

---

## 7. Build a Software City — *Coming Soon*

**The concept.** Your engineering life rendered as a living city. Skills become **buildings**; projects become **districts** connected by **roads**; new technologies you learn **construct new structures**; and as your career grows, the city visibly grows with it. It's an ambitious, memorable, explorable 3D showpiece — the kind of thing a visitor remembers and shares.

**Why it's deliberately last.** It's essentially a small game (WebGL / 3D, ongoing tuning and content), so it is treated as the **finale**, not a dependency. In the launched product it appears as a polished **"Coming Soon"** teaser: a `/city` route with a short pitch, a preview still or looping clip, and a "notify me / follow the build" hook. **Development of the city begins only after the rest of the portfolio is live and stable.** When ready, it graduates from teaser to full experience without changing the rest of the site.

**Likely approach when built:** React Three Fiber / Three.js on the frontend, driven by the same backend data (skills → buildings, projects → districts) so the city stays automatically in sync with content already in the CMS.

> **As-built decision:** Software City is a **fully separate repository**, coupled to this one only through the versioned `contracts/career-graph.v1.schema.json` contract and the `GET /api/career-graph` endpoint. See `docs/software-city-concept.md`.

---

## 8. System architecture

A clean **headless split**: a .NET backend owns data and business logic; a Next.js frontend owns presentation and the signature experiences.

```
+---------------------------+      HTTPS / JSON      +---------------------------------+
|      Next.js frontend     |  -------------------→  |      ASP.NET Core Web API       |
|  (public site, animations)|  ←-------------------  |   (public, read-only, cached)   |
|   Vercel / static+SSR     |                        |                                 |
+---------------------------+                        |   - Content endpoints           |
                                                     |   - /api/timeline (merged)      |
+---------------------------+                        |   - /api/github/stats (cached)  |
|   Blazor/Razor Admin app  |  -- EF Core CRUD -→    |   - /api/copilot (later)        |
|  (private, Identity auth) |                        |   - /api/contact                |
+---------------------------+                        +----------------+----------------+
                                                                      | EF Core
                                                            +---------v----------+
                                                            |     PostgreSQL     |
                                                            |  (content + cache) |
                                                            +--------------------+

  External services (server-side, tokens hidden): GitHub API, email/SMTP, (later) AI model
```

- The **public API** is anonymous and **read-only**, aggressively cached (output caching + short-TTL memory cache) so the site is fast and the GitHub token is never exposed to the browser.
- The **admin app** is private, protected by ASP.NET Core Identity, and does full CRUD on content via EF Core. This is the "add data without code" surface.
- Frontend fetches content at build/request time (Next.js SSG/ISR) for speed and SEO.

---

## 9. Backend detail (.NET)

**Runtime & framework**
- **.NET** — use the current LTS. *(As built: `net10.0`.)*
- **ASP.NET Core Web API** — the public content API.
- **ASP.NET Core (Blazor Server or Razor Pages)** — the admin panel. Blazor Server is recommended for a rich CRUD admin with minimal JS.
- **Entity Framework Core** with **Npgsql** — ORM over PostgreSQL. (SQL Server is a drop-in alternative if preferred for hosting.)
- **ASP.NET Core Identity** — authentication for the admin panel (single admin user is sufficient).
- **Output caching + `IMemoryCache`** — for public endpoints and GitHub stats.
- **Serilog** — structured logging.
- **FluentValidation** — request/content validation.

**Solution layout (Clean Architecture)** — *as built, see `CLAUDE.md`:*
```
Chronicle.sln
  src/
    Chronicle.AppHost/          .NET Aspire orchestration (dev-time)
    Chronicle.ServiceDefaults/  OpenTelemetry, health, resilience
    Chronicle.Domain/           Entities, enums (no dependencies)
    Chronicle.Application/      MediatR CQRS, DTOs, validators, ports
    Chronicle.Infrastructure/   EF Core, migrations, external services
    Chronicle.Portfolio/
      Chronicle.Portfolio.Server/   Public API + Blazor admin
      Chronicle.Portfolio.Client/   Next.js frontend
  tests/
```

**Media / images.** Stored in object storage (Azure Blob or any S3-compatible bucket; local `wwwroot` for the simplest start), with only the URL persisted in the database.

**External integrations (server-side only).**
- **GitHub** — a typed `HttpClient` service calls the GitHub REST/GraphQL API, caches results in the DB/memory, and exposes `/api/github/stats`.
- **Email** — SMTP (or a transactional email provider) for the contact form.
- **AI (later)** — an abstraction (`ICopilotService`) so the model provider (local Ollama / free tier / paid) can be swapped without touching the API surface.

**Hosting.** Azure App Service is the natural fit for .NET (or Docker containers on any VPS). Frontend on Vercel. Local development is orchestrated by the Aspire AppHost.

---

## 10. Data model (EF Core entities)

Concrete enough to scaffold directly. `Id` is `Guid`; timestamps on all content. **The authoritative, typed version of this model is §3 of `implementation-spec.md`.**

```
Project
  Id, Title, Slug (unique), Pitch, Problem, Solution, KeyDecisions (markdown),
  ArchitectureNotes (markdown), ArchitectureDiagramUrl,
  Results (markdown), LessonsLearned (markdown),
  VideoUrl?, GithubUrl?, DemoUrl?, DocsUrl?,
  StartDate, EndDate?, Featured (bool), SortOrder (int),
  Tags (M2M -> Tag), Screenshots (1..* -> Media), TechStack (M2M -> Skill),
  CreatedAt, UpdatedAt

Experience
  Id, Role, Company, StartDate, EndDate?, Summary,
  Highlights (list<string>), TechStack (M2M -> Skill), SortOrder,
  CreatedAt, UpdatedAt

Post                       // Knowledge Core: articles
  Id, Title, Slug (unique), Excerpt, BodyMarkdown, Tags (M2M -> Tag),
  ReadingTimeMinutes, IsPublished (bool), PublishedAt?, CreatedAt, UpdatedAt

LearningItem               // Knowledge Core: "currently learning"
  Id, Topic, Note, Status (enum: Exploring|Learning|Comfortable),
  ProgressPercent (int?), Link?, SortOrder, UpdatedAt

Skill
  Id, Name, Category (enum: Backend|Frontend|Database|DevOps|Cloud|AI|Other),
  YearsExperience (decimal), Proficiency (enum: 1..5), SortOrder

RoadmapItem                // Future nodes on the Timeline
  Id, Title, Description, TargetDate, Status (enum: Planned|InProgress|Done), SortOrder

Certification
  Id, Name, Issuer, IssueDate, CredentialUrl?, LogoUrl?, SortOrder

Tag
  Id, Name, Slug (unique), Category?

Media
  Id, ProjectId (FK), Url, Caption?, SortOrder

SiteStatus                 // Single row — powers Mission Control strip
  Id, CurrentFocus, Mood?, UpdatedAt

GitHubStatsCache           // Cached GitHub API payload
  Id, PayloadJson, FetchedAt
```

---

## 11. Public API surface (read-only unless noted)

```
GET  /api/projects                 List (supports ?tag=&featured=)
GET  /api/projects/{slug}          Full case study
GET  /api/experience               Roles
GET  /api/timeline                 Merged experience + projects + roadmap, date-sorted
GET  /api/skills                   Grouped skills with "used in" links
GET  /api/posts                    List (supports ?tag=)
GET  /api/posts/{slug}             Article
GET  /api/learning                 Currently-learning items
GET  /api/roadmap                  Future goals
GET  /api/certifications           Certs
GET  /api/status                   Mission Control fields
GET  /api/github/stats             Cached GitHub metrics
GET  /api/career-graph             Lifecycle JSON for the Software City repo   <- as-built addition
POST /api/contact                  Contact form -> email  (rate-limited, spam-protected)
POST /api/copilot                  AI Copilot query (later phase; rate-limited, scoped)
```

Admin CRUD is handled inside the Blazor admin (Identity-protected), kept separate from the public API surface.

---

## 12. Frontend detail

- **Next.js (App Router) + TypeScript** — SSG/ISR for content pages (fast + SEO).
- **Tailwind CSS** — styling and the design system.
- **Motion** (formerly Framer Motion) — scroll and transition animation (the Timeline, page transitions, the Mission Control strip).
- **Three.js / React Three Fiber** — reserved **only** for the Software City (separate repo).
- **API client** — a thin typed `lib/api.ts` wrapping the .NET endpoints, over types generated from the server's OpenAPI document.
- **Recruiter Mode** — a global context/provider that swaps layout and disables animation; the choice is persisted.
- **Accessibility & performance** — semantic HTML, keyboard-navigable, respects `prefers-reduced-motion`, targets strong Core Web Vitals.

---

## 13. Repository structure

See `CLAUDE.md` for the as-built layout. The original brief proposed a `backend/` + `frontend/` split; the implementation instead uses a single solution with an Aspire AppHost so the whole stack starts with one command.

---

## 14. Development phases

Every phase ends at a **live, shareable URL.**

### Phase 0 — Foundations
Design system + branding, information architecture, the solution scaffolded, PostgreSQL provisioned, EF Core `DbContext` + initial migration, Aspire AppHost for local dev, CI/CD pipeline, and a live **"coming soon" holding page**. The Software City route already shows its "Coming Soon" teaser shell.

### Phase 1 — Backend + Content Core *(the real launch)*
- **Backend:** all entities (§10), EF Core migrations, the **admin panel** (Identity-protected CRUD) so content is fully editable, and the public read-only API for content.
- **Frontend:** Mission Control (home), About + certifications, Skills, Projects list + **case-study pages** for the 2–3 flagship projects, Contact, and full SEO (metadata, sitemap, OpenGraph).
- **Recruiter Mode** (Signature #2, essential) — shipped here, rendering the core content in skim mode.

At the end of Phase 1 you have a **complete, launchable portfolio** with a working CMS. Everything after is enhancement.

### Phase 2 — Signature experience + engagement
- The **Timeline** (Signature #1): `/api/timeline` + the scroll-driven Experience/Projects/Future-Roadmap stream.
- **Knowledge Core** (articles + currently-learning) with tag filtering.
- **Engineering Analytics** + the live **Mission Control status strip** (GitHub integration, server-side cached).
- **`/api/career-graph`** + `contracts/career-graph.v1.schema.json` for the Software City repo.

### Phase 3 — Résumé polish + AI Copilot + eggs
- Interactive **résumé** builder + PDF/print.
- **AI Copilot** (Signature #3) on a **free/low-cost model**, scoped and rate-limited, with fallback.
- First **Easter egg** (the hidden terminal).

### Phase 4 — Build a Software City *(separate repo)*
Development of the 3D city begins **after** the above is live and stable. It graduates the `/city` teaser into a link to the full explorable experience, driven by the career-graph contract. Treated as the finale, never a blocker.

**Ongoing:** new articles and projects via the admin panel, roadmap nodes updated as goals are actually hit, and continuous performance/SEO tuning.

---

## 15. Getting started (build order)

1. **Scaffold the solution** per `CLAUDE.md`.
2. **Model the domain** in `Chronicle.Domain` from §3 of `implementation-spec.md`; add the `DbContext` + Npgsql in `Chronicle.Infrastructure`; create the initial EF Core migration.
3. **Build the public API** (`Chronicle.Portfolio.Server`) with the endpoints in §11, DTOs, output caching, and OpenAPI.
4. **Build the admin panel** (Blazor Server + Identity at `/admin`) with CRUD for every entity — this unlocks content entry immediately.
5. **Build the frontend core** (Phase 1 pages) against the API via `lib/api.ts`, with SEO and **Recruiter Mode**.
6. **Layer in Phase 2+** features in order (Timeline → Knowledge Core → Analytics → career-graph → Résumé → Copilot).
7. Wire **CI/CD** and deploy (server to Azure App Service or a Docker host; frontend to Vercel).

---

## 16. Non-functional requirements

- **Performance:** strong Core Web Vitals; content pages statically generated / ISR; API cached.
- **SEO:** server-rendered metadata, sitemap.xml, robots.txt, OpenGraph/Twitter cards, structured data.
- **Accessibility:** semantic markup, keyboard navigation, `prefers-reduced-motion` honored (and Recruiter Mode as a fully static alternative).
- **Security:** admin behind Identity; secrets/tokens server-side only; rate limiting on `contact` and `copilot`; input validation via FluentValidation.
- **Maintainability:** all content editable via admin (no deploys for content); clean layered backend; typed frontend API client.

---

## 17. Why this reads as senior

- A real, self-built **.NET backend + admin** demonstrates full-stack ownership — and plays to the owner's strongest skill.
- **Case-study project pages** show systems thinking and tradeoff reasoning, not feature lists.
- **Recruiter Mode** shows empathy for a specific user — product thinking.
- **Scope discipline** (three signatures, the city deferred cleanly) demonstrates judgment.
- A **Future Roadmap** on the Timeline narrates the Associate → Senior trajectory explicitly.
- A fast, accessible, well-architected site is craft — the unglamorous part senior engineers actually sweat.

---

*This is the plan for the final product. It ships in slices, keeps content in the backend so it stays alive without code changes, and closes with the Software City as its signature finale.*
