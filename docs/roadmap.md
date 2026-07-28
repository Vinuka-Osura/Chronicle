# Chronicle — build roadmap

Written 28 July 2026. Supersedes §20–§21 of `implementation-spec.md`, which was drafted
before any code existed. Software City is out of scope here — it ships from its own
repository, and this one owes it only the `career-graph` contract (see
`software-city-concept.md`).

---

## Where things stand

| Layer | State |
|---|---|
| Solution, Aspire orchestration, CI | **Done** |
| Domain, EF configurations, migration, seed | **Done** — 11 entities |
| Public API | **Projects only.** Pattern proven end to end; 8 slices remain |
| Admin CMS | **Sign-in only.** No CRUD screens |
| Public site | **Home, projects list, case study.** Nine routes are honest placeholders |
| Recruiter Mode | **Mechanism done.** Not yet applied per page |
| Deployment | **Nothing hosted** |

---

## What a "surface" actually costs

Every surface on the sitemap is three pieces of work, not one:

```
API slice  ──▶  (CMS screen)  ──▶  Frontend page
~45 min         ~1–2 h             ~2–3 h
```

Two ordering consequences worth knowing before planning around them:

- **Nothing on the frontend can start until its API slice exists.** That is why Day 1
  below batches all remaining read endpoints rather than interleaving them. Seven
  near-identical slices back to back is much faster than seven context switches.
- **Mission Control and Recruiter Mode are both finished twice.** The status strip needs
  GitHub data that only arrives with Analytics, and Recruiter Mode is a pass *over* the
  other pages, so it cannot be completed before they exist.

---

## The one-week plan · Wed 29 Jul – Mon 3 Aug

Ordered as requested, adjusted only where a dependency forces it.

**Be clear-eyed about the total: this is roughly a 50-hour week.** It is achievable with
Claude Code doing the mechanical slices, but it is a full-time week on top of a day job.
The realistic track further down says what lands if you have 25 hours instead.

### Day 1 · Wed 29 Jul — unblock everything (~7h)

The highest-leverage day. No page below can start until this is done.

- [ ] `GET /api/experience`
- [ ] `GET /api/skills` — grouped by category, "used in" derived from the join tables
- [ ] `GET /api/posts` + `/api/posts/{slug}` — published only, reading time on save
- [ ] `GET /api/learning`, `/api/roadmap`, `/api/certifications`
- [ ] `GET /api/status` — SiteStatus, with the last-commit slot left empty for now
- [ ] Integration tests against a `chronicle_test` database using Respawn

**Done when:** every endpoint appears in `/scalar/v1` and returns seeded data.

### Day 2 · Thu 30 Jul — Mission Control, About, Skills (~7h)

- [ ] **Mission Control** — status strip, editorial half only (current focus, mood)
- [ ] **About** — story section plus the certifications strip, credentials linking out
- [ ] **Skills** — grouped cards with years, proficiency meter, and "used in" chips that
      link through to the projects and roles that reference each skill

**Done when:** the "used in" links resolve to real case studies. That is what turns the
skills page into evidence rather than a word cloud.

### Day 3 · Fri 31 Jul — Timeline, Signature #1 (~8h)

The single most distinctive thing on the site. Give it a whole day.

- [ ] `GET /api/timeline` — merge Experience + Project + RoadmapItem, tag each with
      `type`, sort ascending by date
- [ ] Vertical axis, year markers, a node component per type
- [ ] Scroll-driven reveal (`whileInView`, ~300ms ease-out). **Native scroll only** — no
      hijacking; it wrecks mobile and accessibility
- [ ] "You are here" boundary; roadmap items below it, dotted and translucent
- [ ] Per-era background grade, kept inside contrast limits
- [ ] Static chronological list for reduced motion and Recruiter Mode

**Done when:** all six §16 criteria pass, including a clean static list under
`prefers-reduced-motion` and 60fps on a mid-range phone.

### Day 4 · Sat 1 Aug — Projects, Knowledge Core, Analytics (~10h)

- [ ] **Projects** — tag filter, client-side over the already-fetched list
- [ ] **Knowledge Core** — article list, tag filtering, article pages, learning board
      with status and progress
- [ ] **Analytics** — `IGitHubService` over GraphQL contributions + REST repos and
      languages, cached into `GitHubStatsCache`, never blocking on GitHub
- [ ] Contribution calendar, language breakdown, stat cards
- [ ] **Back to Mission Control** — wire the live last-commit into the status strip

### Day 5 · Sun 2 Aug — Résumé, Recruiter Mode, Contact (~10h)

- [ ] **Résumé** — assembled from Experience + Skills + Projects; print stylesheet that
      produces clean, ATS-friendly output
- [ ] **Recruiter Mode pass** across every page: dense single column, no motion,
      outcomes surfaced on project cards, résumé promoted to primary CTA
- [ ] Verify all four §17 criteria, including a first-time visitor arriving with the
      cookie already set
- [ ] **Contact** — form, honeypot, per-IP rate limit, SMTP send, and the success,
      failure and rate-limited states
- [ ] **City teaser** — tighten the copy; it links out once that repo has something

### Day 6 · Mon 3 Aug — CMS, polish, deploy → **LAUNCH** (~10h)

- [ ] Minimal CMS: Projects, Posts and Site Status only, with a Markdown editor and
      live preview. **Not all nine entities** — see the scope note below
- [ ] Cache-tag eviction wired into every command
- [ ] SEO: OG images, JSON-LD `Person` + `CreativeWork`, canonical URLs
- [ ] Accessibility: landmarks, focus order, contrast, keyboard navigation
- [ ] Performance: LCP < 2.5s, CLS < 0.1
- [ ] Production PostgreSQL (Neon, Supabase or Azure Flexible Server)
- [ ] Deploy server to Azure App Service, client to Vercel
- [ ] Domain, DNS, HTTPS, production secrets, CORS locked to the real origin

> **Launch.** A complete portfolio with a working CMS on a real URL.

---

## The realistic track (~25h)

If the week turns out to be evenings only, this is what to protect and in what order.
It still ends at a launched, coherent site — just with fewer surfaces.

| Priority | Item | Why |
|---|---|---|
| 1 | Day 1 APIs | Nothing else can start |
| 2 | Skills + About | Cheapest surfaces, high credibility per hour |
| 3 | Timeline | The single most memorable thing on the site |
| 4 | Recruiter Mode pass | Spec calls it essential, and it is the audience most likely to decide fast |
| 5 | Contact | A portfolio nobody can reply to has failed at its one job |
| 6 | Deploy | Unshipped work counts for nothing |

Everything else — Knowledge Core, Analytics, Résumé, the CMS — moves to the following
week and the routes keep saying so honestly.

## Cut order, decided in advance

When the week runs short, cut from the top of this list. Deciding now stops it being
decided at 1am on Sunday.

1. **AI Copilot** — already Phase 3, nothing depends on it, and a bad one is worse than none
2. **Easter-egg terminal** — pure delight, zero signal to a hiring screen
3. **Full CMS coverage** → Projects, Posts and Site Status only; manage the rest through seed data
4. **Analytics** → ship the page reading an empty cache; it degrades by design
5. **Timeline colour grading** → keep the reveal, drop the atmosphere

**Never cut:** Recruiter Mode, the contact form, accessibility, or the deploy.

---

## Risks

| Risk | Mitigation |
|---|---|
| Deployment is discovered to be hard on Day 6 | Do a throwaway deploy of the current build on Day 1 or 2, while it costs nothing |
| No production database chosen | Decide by Day 3. Neon and Supabase both have usable free tiers |
| GitHub rate limits during Analytics work | The cache already exists — develop against a stored payload, not the live API |
| Timeline expands to fill the week | Timebox to Day 3. If the grading is not working by evening, ship the reveal and move on |
| Fifty hours does not materialise | Switch to the realistic track early and deliberately, not by drifting |

---

## After launch

Week of 4 Aug — finish CMS coverage for the remaining six entities, add the Copilot
groundwork (pgvector, embedding pipeline), and write the first real case study to
replace the seeded placeholder.

Week of 11 Aug — `contracts/career-graph.v1.schema.json` and `GET /api/career-graph`,
with a contract test. That is the last thing this repository owes Software City, and it
is what lets that project begin.
