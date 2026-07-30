# Timeline — design, revision 2

**Status: awaiting approval. Nothing built yet.**

Signature #1. The page that decides whether this reads as a product or as a CV with
scrolling. Revised after a round of ideas — several of which are better than what I
proposed first.

Constraint held throughout: extend the existing domain, do not invent a parallel one.

---

## Weighing the ideas

| Idea | Verdict | Why |
|---|---|---|
| **Named eras** | **Adopt — headline feature** | The single strongest idea here. Turns dates into narrative |
| **Density / "9 events"** | **Adopt, merged into the scrubber** | Real signal, and it makes navigation earn its space twice |
| **Connect everything** | **Adopt, derived from real joins** | The data already supports most of it. Needs one new join |
| **Horizontal navigator** | **Adopt as a bottom scrubber** | Better than my vertical rail. This is what carries "time travel" |
| **On this day** | **Adopt — small, cheap, charming** | Costs almost nothing, lands only when true |
| **Journey statistics** | **Defer to home, as you said** | Right instinct. A static summary here, animated counters nowhere |
| **Semantic zoom (collapse years)** | **Stretch** | Real work; the scrubber already delivers the "how busy was he" read |
| **Explorer Mode (horizontal layout)** | **Recommend against — see below** | Two layouts, double the bugs, and the scrubber already gets you most of it |

### The one I want to talk you out of

**Story Mode / Explorer Mode as two full layouts.** It is a genuinely appealing idea and
I think it is a trap here:

- It is **two complete implementations** of the signature page — every node type, every
  responsive breakpoint, Recruiter Mode, and the accessibility work, twice. On a page
  where correctness matters most.
- **Horizontal scrolling is hostile** on mobile, with a trackpad, and to screen readers
  and keyboard users. The spec already rules out scroll-hijacking for the same reason.
- A mode most visitors never switch into absorbs the polish budget of the one they all
  see. The vertical page has to be perfect first.

**The bottom scrubber gives you most of the feeling for a tenth of the cost** — a
horizontal band of eras and density you can drag through, with the page travelling to
meet you. If after launch it still feels missing, it is a clean addition rather than a
rewrite. Say the word and I will build it, but I would rather spend that day making the
vertical page excellent.

---

## What the page is now

Four things carry it:

1. **Eras** — the timeline is chapters, not years. You remember "the Banking Systems
   chapter", not "there were lots of dates".
2. **Two tracks, one spine** — career and life in parallel, visibly.
3. **A hard today line** — above it happened, below is blueprint.
4. **Connections** — nodes reference each other, so one thing opens into an ecosystem.

Plus the viewer stays in control: lenses decide what is shown, the scrubber decides
where you are.

---

## Domain: two new entities, one new join

### `Era` — the headline addition

```
Era : AuditableEntity
  Name         string(80)    "Learning", "First Steps", "Banking Systems"
  Tagline      string(160)?  one line: what this chapter was about
  StartDate    DateOnly
  EndDate      DateOnly?     null = the current era
  SortOrder    int
```

Table `profile_eras`. Editorial by nature — only a human can decide where one chapter
ends and the next begins, which is exactly why it is data rather than something derived
from dates.

Items fall into an era by date. An item outside every era still renders, under its year
alone, so a gap in the era list never loses content.

### `Milestone` — the life track

```
Milestone : AuditableEntity
  Title        string(150)
  Description  string(500)
  Date         DateOnly
  EndDate      DateOnly?     null = a point rather than a span
  Category     enum          Education | Recognition | Community | Personal
  Link         string(500)?
  SortOrder    int
```

Table `profile_milestones`. Nothing existing carries a life event, and bending
`Experience` to hold "graduated" would corrupt both the résumé and the skills join.

It also feeds the "bedrock" layer the Software City concept describes, so the
career-graph contract later has real data rather than something invented.

### `Certification ↔ Skill` — makes your AZ-204 example real

One join table, `profile_certification_skills`. Without it a certification is a dead end
on the timeline. With it:

```
AZ-204  ──(certifies)──▶  Azure  ──(used in)──▶  Chronicle
                                 └─(used in)──▶  Statement Delivery Pipeline
```

That is your example working off real data rather than hand-authored links.

---

## Connections, and what is honestly derivable

Everything below comes from joins that already exist or the one above. **Nothing is
hand-maintained**, so it cannot go stale.

| From | To | Via |
|---|---|---|
| Certification | Skills | `profile_certification_skills` *(new)* |
| Skill | Projects, Experience | existing join tables |
| Project | Articles | shared tags |
| Project | Skills | existing join |
| Experience | Projects | shared skills, overlapping dates |
| Project | source, demo, docs, video | its own link fields |

**Not derivable, and not proposed:** LinkedIn posts and GitHub releases. Those are
external and would need either manual entry or another integration. A project's own
links already cover the useful half of that chain.

Each connection carries **why**, so the page can say `Azure — also used in Chronicle`
rather than leaving the reader to guess.

---

## Skeleton — desktop

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Timeline                                                                   │
│  Six years, two tracks. Choose what you want to see.                        │
│                                                                             │
│  ● Roles   ● Projects   ● Life   ● Certifications   ● Goals      ↺ Reset    │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│   BANKING SYSTEMS                                          2023 — present   │
│   Learning to build things that must not be wrong                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ era band, sticky ━━━━━   │
│                                                                             │
│        CAREER                    │                    LIFE                  │
│   2025 ──────────────────────────┼─────────────────────────────────         │
│                                  │                                          │
│   ┌────────────────────┐         ●                                          │
│   │ Software Engineer  │─────────│                                          │
│   │ Banking Systems    │         │                                          │
│   │ 2025 — now         │         │                                          │
│   │ ▾ 3 highlights     │         │                                          │
│   └────────────────────┘         │                                          │
│                                  ●─────────┌────────────────────┐           │
│                                  │         │ ◆ AZ-204           │           │
│                                  │         │   Microsoft        │           │
│                                  │         │ ↳ certifies Azure  │           │
│                                  │         │   used in Chronicle│◂ connection
│                                  │         └────────────────────┘           │
│   2024 ──────────────────────────┼─────────────────────────────────         │
│   ┌────────────────────┐         ●                                          │
│   │ ▸ Core Banking     │─────────│                                          │
│   │   Ledger           │         │                                          │
│   │ ↳ 1 related article│         │                                          │
│   └────────────────────┘         │                                          │
│                                                                             │
│  ═══════════════ ▼ YOU ARE HERE · 30 July 2026 ═══════════════              │
│     ⤷ one year ago today: earned AZ-204        ◂ only shown when true       │
│                                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│   THE NEXT CHAPTER                                              2027 →      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│   ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─┐          ╎                                           │
│   ╎ Senior Engineer   ╎──────────○     blueprint: dotted, hollow, muted     │
│   ╎ target 2028       ╎          ╎                                          │
│   └ ─ ─ ─ ─ ─ ─ ─ ─ ─┘          ╎                                           │
├────────────────────────────────────────────────────────────────────────────┤
│  LEARNING    │ FIRST STEPS │ BANKING SYSTEMS        │ NEXT      ◂ eras      │
│  ▁▁ ▃▁ ▁▁    │ ▃▅ ▂▁      │ ▅█ ▇▅ █▆ ▃            │ ░░ ░░     ◂ density   │
│  2020  2021  │ 2022  2023  │ 2024 2025 2026        │ 2027 2028             │
│                                  ▲ you are here                             │
│              ◂ drag or click to travel · scrubber pinned to the bottom ▸    │
└────────────────────────────────────────────────────────────────────────────┘
```

**The scrubber is where three of your ideas land at once**: eras as named segments,
density bars answering "how busy was he", and the horizontal time-travel affordance —
one component, one set of bugs.

Node shapes carry meaning without colour: **●** happened · **○** planned · **◆**
credential · dotted = future.

## Skeleton — mobile

```
┌────────────────────────┐
│ Timeline               │
│ ●Roles ●Projects ●Li▸ │ ◂ chips scroll sideways
├────────────────────────┤
│ ━━━━━━━━━━━━━━━━━━━━━ │
│  BANKING SYSTEMS       │ ◂ era band, sticky
│  2023 — present        │
│ ━━━━━━━━━━━━━━━━━━━━━ │
│ 2025                   │
│ │                      │
│ ●─┌──────────────────┐ │
│ │ │ Software Engineer│ │
│ │ │ Banking Systems  │ │
│ │ └──────────────────┘ │
│ │                      │
│ ●─┌──────────────────┐ │
│ │ │ ◆ AZ-204         │ │ ◂ ◆ marks the life track
│ │ │ ↳ Azure          │ │
│ │ └──────────────────┘ │
│ ═══ ▼ YOU ARE HERE ═══ │
│ ╎                      │
│ ○─┌ ─ ─ ─ ─ ─ ─ ─ ─┐  │
│ ╎ ╎ Senior Engineer ╎  │
│ ╎ └ ─ ─ ─ ─ ─ ─ ─ ─┘  │
├────────────────────────┤
│ ▁▃▅█▇▅█▆░░  ◂ scrubber │
└────────────────────────┘
```

## Skeleton — Recruiter Mode and reduced motion

Same data, grouped by era, newest first, no motion, no scrubber, no density.

```
Timeline                       ● Roles  ● Projects  ● Life  ● Goals

THE NEXT CHAPTER · 2027 →
  2028   Senior Software Engineer                              goal
  2027   Lead a system design end to end                in progress

──────────────────────── today ────────────────────────

BANKING SYSTEMS · 2023 – present
  2026   Chronicle — portfolio platform                     project
  2025   Azure Developer Associate (AZ-204)                     cert
  2025   Software Engineer · Banking Systems                    role
  2024   Core Banking Ledger                                 project
  2023   Associate Software Engineer · Banking Systems          role

FIRST STEPS · 2022 – 2023
  2022   BSc Computer Science                               education
```

Eras survive into Recruiter Mode, because the narrative is the point and it costs
nothing to keep.

---

## Interaction

**Scroll** is native and never hijacked. Nodes reveal on entry, ~300ms, fade plus a
small translate.

**Entry** is at the today line, so the first thing seen is the present.

**Era bands** stick to the top of the viewport while you are inside that chapter, so you
always know which one you are reading.

**Lenses** filter node types. Persisted in a cookie *and* in the URL
(`?lens=roles,projects`), so a roles-only view is a link you can send someone.

**Connections** are listed inside the node. Hovering or focusing a node gives its
related nodes a subtle ring elsewhere on the page — the "one node is an ecosystem" read,
without drawing lines across a scrolling document.

**Scrubber** shows eras, density and position. Click or drag to travel; the page scrolls
smoothly to meet you.

**On this day** appears at the today line only when an event genuinely shares today's
date. Silent otherwise — a feature that fabricates a coincidence is worse than one that
waits for a real one.

---

## Accessibility, non-negotiable per the spec

- Nodes are semantic `<article>` elements inside an ordered list; eras are `<section>`
  with a heading, so the page has a real document outline.
- Project nodes are real `<a>` links — keyboard reachable, openable in a new tab.
- Lens chips are toggle buttons with `aria-pressed`. The scrubber is a real slider with
  `role="slider"` and arrow-key support, or `aria-hidden` if that proves fragile — year
  headings already give screen readers the same navigation.
- Shape and text carry meaning; colour never carries it alone.
- `prefers-reduced-motion` drops every transition, the reveal and the smooth scroll,
  independently of Recruiter Mode.

---

## Build order

**Phase A — core. The page is not shippable without these.**

- [ ] `Era` and `Milestone` entities, configurations, seeders, migration
- [ ] `Certification ↔ Skill` join
- [ ] `GET /api/timeline` — merged, era-grouped, with derived connections
- [ ] Era bands, dual track, year markers, four node types
- [ ] Today line, blueprint future
- [ ] Lens chips: persistence and URL state
- [ ] Scroll reveal
- [ ] Recruiter Mode / reduced-motion static list, grouped by era
- [ ] Mobile single column
- [ ] `docs/user-guide.md` section

**Phase B — same day if Phase A lands early. In this order.**

- [ ] Bottom scrubber: eras, density, position, click to travel
- [ ] Connection highlighting on hover and focus
- [ ] On this day
- [ ] In-place expansion of role highlights

**Phase C — after launch**

- [ ] Semantic zoom: collapse an era to a density band, expand on click
- [ ] Journey statistics on the home page, per your note
- [ ] Ambient industry markers

**Not proposed:** Explorer Mode, 3D, canvas, scroll-scrubbed image sequences. Those
belong to the final UI phase or to Software City.

---

## Acceptance

From spec §16:

1. Every experience, project and roadmap item in correct chronological order, today line
   correctly placed.
2. Reveal is smooth at 60fps on a mid-range phone.
3. Future items visually distinct and labelled as goals.
4. A project node opens its case study.
5. Reduced motion / Recruiter Mode gives a clean static list, no layout breakage.
6. Adding an item in the CMS appears here immediately, no code change.

From this revision:

7. Turning off a lens removes exactly that node type; the choice survives reload and is
   shareable as a URL.
8. Career and life are distinguishable without relying on colour.
9. Every item belongs to an era, or renders correctly under its year when no era covers
   it.
10. Every connection shown is derived from a real relationship — none hand-maintained.

---

## What I need from you

Content, not decisions — the structure above is settled unless you disagree.

I will seed **placeholder eras and milestones** so the page is real from the first run,
and you replace them in the CMS. To make the placeholders close to true, I need:

1. **Your eras** — names, taglines and rough boundaries. My guess, to be corrected:
   *Learning* (—2022) · *First Steps* (2023–2024) · *Banking Systems* (2025–present) ·
   *The Next Chapter* (2027→)
2. **Life milestones** — education especially: what, where, and when.

If you would rather just approve the structure and fill the content in yourself later,
say so and I will seed obvious placeholders clearly marked as such.
