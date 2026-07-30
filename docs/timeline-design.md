# Timeline — design proposal

**Status: awaiting approval. Nothing here is built yet.**

Signature #1, and the thing meant to separate this from a portfolio that is a list of
jobs. It gets a whole day and a design review first.

Constraint held throughout: this extends the existing domain, it does not invent a
parallel one.

---

## The idea

Most portfolio timelines are a single column of job cards. That reads as a CV with extra
scrolling — and the CV already exists on `/resume`.

The proposal is a **dual-track chronicle**: one spine of time, with what you *did* on one
side and what *shaped you* on the other, and a **lens** control so the viewer decides
which of those they care about. A recruiter filters to roles in one click. An engineer
leaves everything on and reads the whole arc.

Three things carry the personality:

1. **Two tracks, one spine** — career and life run in parallel, visibly. A certification
   sitting beside the role it was earned during says something a list cannot.
2. **A hard "today" boundary** — everything above it happened; everything below is
   drawn as blueprint. Ambition without pretending.
3. **The viewer is in control** — lenses, not a fixed narrative.

---

## Domain: one new entity

Career already exists — `Experience`, `Project`, `RoadmapItem`. **Life does not**, and
that is the gap for the "life and career both" requirement.

### Proposed: `Milestone`

```
Milestone : AuditableEntity
  Title        string(150)   required
  Description  string(500)   required
  Date         DateOnly      required
  EndDate      DateOnly?     null for a point in time rather than a span
  Category     enum          Education | Recognition | Community | Personal | Career
  Link         string(500)?  optional link out
  SortOrder    int
```

Table `profile_milestones` — the `profile_` domain, alongside skills and certifications,
because it describes the person rather than the work.

**Why a new entity rather than reusing something.** Nothing existing carries a life
event. Bending `Experience` to hold "graduated" would corrupt the résumé and the skills
join. One small entity keeps both honest.

**It also pays for itself later.** The Software City concept has a "bedrock" layer of
education and fundamentals; this is the data that feeds it, so the career-graph contract
does not need inventing from nothing.

### Alternative, if you would rather not touch the schema this week

`Certification` already has `IssueDate` and can populate a life track on its own. The
timeline works, just thinner — no education, no personal milestones. Say the word and
I will build the certifications-only version and add `Milestone` after launch.

**My recommendation: build `Milestone`.** It is one entity, one configuration, one
seeder and one slice — roughly an hour — and without it the "life" half of the page is
one node type.

---

## API: `GET /api/timeline`

One request. Server merges, tags each item with `type` and `track`, sorts ascending.
The client groups by year and computes the today boundary from the current date.

```jsonc
[
  { "type": "milestone", "track": "life", "date": "2022-06-01",
    "title": "BSc Computer Science", "subtitle": "University",
    "category": "Education", "description": "…" },

  { "type": "experience", "track": "career", "date": "2023-01-01", "endDate": "2024-12-31",
    "title": "Associate Software Engineer", "subtitle": "Banking Systems",
    "summary": "…", "highlights": ["…"], "techStack": ["C#", ".NET"] },

  { "type": "project", "track": "career", "date": "2024-03-01", "endDate": null,
    "title": "Core Banking Ledger", "slug": "core-banking-ledger",
    "pitch": "…", "tags": ["backend"] },

  { "type": "certification", "track": "life", "date": "2025-11-03",
    "title": "Azure Developer Associate", "subtitle": "Microsoft",
    "link": "https://…" },

  { "type": "roadmap", "track": "career", "date": "2028-01-01",
    "status": "Planned", "title": "Senior Software Engineer", "description": "…" }
]
```

Cached and tagged `timeline`; evicted by any command touching experience, projects,
milestones, certifications or roadmap — because all five feed it.

---

## Skeleton — desktop

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Timeline                                                                 │
│  Career and life on one axis. Choose what you want to see.                │
│                                                                           │
│  ● Roles   ● Projects   ● Life   ● Certifications   ● Goals    ↺ Reset    │
│  └── lens chips: click to toggle, choice persists and is in the URL ──┘   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                     ▕ ▏   │
│   2028  ◂ sticky year, updates as you scroll                        ▕ ▏   │
│   "Where this is going"  ◂ era label                                ▕ ▏   │
│                                                                     ▕ ▏   │
│      CAREER                    │                    LIFE           ▕ ▏   │
│                                │                                    ▕ ▏   │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐          ╎                                    ▕ ▏   │
│   ╎ Senior Engineer  ╎──────────○                                   ▕ ▏   │
│   ╎ target 2028      ╎          ╎     blueprint: dotted border,     ▕ ▏   │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ┘          ╎     hollow node, muted            ▕ ▏   │
│                                 ╎                                    ▕ ▏   │
│  ═══════════════════ ▼ YOU ARE HERE ═══════════════════             ▕█▏   │
│                                 │                          viewport ▕ ▏   │
│   2026                          │                                    ▕ ▏   │
│   "Building in the open"        │                                    ▕ ▏   │
│                                 │                                    ▕ ▏   │
│   ┌──────────────────┐          ●                                    ▕ ▏   │
│   │ ▸ Chronicle      │──────────│                                    ▕ ▏   │
│   │   Portfolio…     │          │                                    ▕ ▏   │
│   └──────────────────┘          │                                    ▕ ▏   │
│                                 ●──────────┌──────────────────┐      ▕ ▏   │
│                                 │          │ ◆ AZ-204         │      ▕ ▏   │
│   2025                          │          │   Microsoft      │      ▕ ▏   │
│                                 │          └──────────────────┘      ▕ ▏   │
│   ┌──────────────────┐          ●                                    ▕ ▏   │
│   │ Software Engineer│──────────│                                    ▕ ▏   │
│   │ Banking Systems  │          │                              scrub ▕ ▏   │
│   │ 2025 – now       │          │                               rail ▕ ▏   │
│   │ ▾ 3 highlights   │◂ expands │                                    ▕ ▏   │
│   └──────────────────┘  in place│                                    ▕ ▏   │
└──────────────────────────────────────────────────────────────────────────┘
```

Node shapes carry meaning without relying on colour: **●** happened, **○** planned,
**◆** a credential, dotted border = future.

## Skeleton — mobile

Single column, spine on the left, track shown by icon rather than side.

```
┌────────────────────────┐
│ Timeline               │
│ ●Roles ●Projects ●Li…▸ │ ◂ chips scroll sideways
├────────────────────────┤
│ 2026                   │ ◂ sticky
│ │                      │
│ ●─┌──────────────────┐ │
│ │ │ ▸ Chronicle      │ │
│ │ │   Portfolio…     │ │
│ │ └──────────────────┘ │
│ │                      │
│ ●─┌──────────────────┐ │
│ │ │ ◆ AZ-204         │ │ ◂ ◆ = life track
│ │ │   Microsoft      │ │
│ │ └──────────────────┘ │
│ │                      │
│ ═══ ▼ YOU ARE HERE ═══ │
│ ╎                      │
│ ○─┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│ ╎ ╎ Senior Engineer  ╎ │
│ ╎ ╎ target 2028      ╎ │
│ ╎ └ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
└────────────────────────┘
```

## Skeleton — Recruiter Mode and reduced motion

Same data, no motion, no grading, no rail. A dense reverse-chronological list, because
someone in a hurry reads newest-first.

```
Timeline                          ● Roles  ● Projects  ● Life  ● Goals

── planned ──────────────────────────────────────────────────────────
2028   Senior Software Engineer                              goal
2027   Lead a system design end to end                in progress
── today ────────────────────────────────────────────────────────────
2026   Chronicle — portfolio platform                     project
2025   Azure Developer Associate (AZ-204)                     cert
2025   Software Engineer · Banking Systems                    role
2024   Core Banking Ledger                                 project
2023   Associate Software Engineer · Banking Systems          role
2022   BSc Computer Science                                education
```

---

## Interaction

**Scroll.** Native, never hijacked — hijacking breaks mobile and accessibility, and the
spec rules it out. Nodes reveal on entry, ~300ms, fade plus a small translate.

**Entry point.** The page loads positioned at the today boundary, so the first thing
seen is the present, not 2022. A "jump to now" control returns there.

**Lenses.** Toggle chips filter node types. The choice persists in a cookie *and* is
reflected in the URL (`?lens=roles,projects`), so a filtered view can be shared or
linked — a recruiter can be sent straight to the roles-only view.

**Era grading.** Background washes very slightly per chapter. Atmosphere, not spectacle,
and never the only thing distinguishing two states.

**Scrub rail.** A thin rail showing the whole span with the viewport marked. Click a year
to jump. This is what makes a long timeline navigable rather than a scroll marathon.

**Expansion.** Role nodes expand in place to show highlights. Nothing navigates away.

---

## Accessibility, which the spec makes non-negotiable

- Each node is a semantic `<article>` with a heading; the timeline is an ordered list.
- Project nodes are real `<a>` links — keyboard reachable, openable in a new tab.
- Lens chips are real toggle buttons with `aria-pressed`.
- Shape and label carry meaning, never colour alone.
- `prefers-reduced-motion` drops every transition and the grading, independently of
  Recruiter Mode.
- The scrub rail is decorative and `aria-hidden`; year headings already provide the
  same navigation to a screen reader.

---

## Scope for one day

**Core — the page is not shippable without these**

- [ ] `Milestone` entity, configuration, seeder, migration
- [ ] `GET /api/timeline` merging five sources, tagged and cached
- [ ] Spine, year markers, the four node types
- [ ] Today boundary; future rendered as blueprint
- [ ] Lens chips with persistence and URL state
- [ ] Scroll reveal
- [ ] Recruiter Mode / reduced-motion static list
- [ ] Mobile single column
- [ ] `docs/user-guide.md` section

**Stretch — in this order, only if core lands early**

- [ ] Scrub rail
- [ ] Era colour grading
- [ ] In-place expansion of role highlights
- [ ] Ambient industry markers (spec calls these optional)

**Explicitly not now.** No 3D, no canvas, no scroll-scrubbed image sequence. Those
belong to the final UI phase, and to Software City.

---

## Acceptance, from spec §16

1. Every experience, project and roadmap item in correct chronological order, with the
   today boundary in the right place.
2. Smooth reveal at 60fps on a mid-range phone.
3. Future items visually distinct and labelled as goals.
4. A project node opens its case study.
5. Reduced motion / Recruiter Mode gives a clean static list, no layout breakage.
6. Adding an item in the CMS makes it appear here immediately, with no code change.

Plus two from this proposal:

7. Turning off a lens removes exactly that node type and nothing else; the choice
   survives a reload and can be shared as a URL.
8. Life and career are distinguishable without relying on colour.

---

## Open questions for review

1. **`Milestone` entity — yes, or certifications-only for now?** My recommendation is
   yes; it is about an hour and the life track is thin without it.
2. **Which categories?** Proposed: Education, Recognition, Community, Personal, Career.
3. **Default lens state** — everything on, or roles and projects on with life and goals
   off? Everything-on shows the full arc; the quieter default respects a first-time
   visitor. I lean everything-on, since the whole point is the parallel tracks.
4. **How far back does the timeline start?** The earliest milestone sets it. Worth
   deciding whether school-age entries belong or whether it starts at university.
