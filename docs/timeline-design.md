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

## API: `GET /api/timeline`

One request. **An object, not a bare array** — a deliberate change from spec §5, which
predates eras. Repeating an era's name and range on every item belonging to it would be
waste, and the client needs the era list on its own anyway to draw the scrubber.

```jsonc
{
  // The server's date, so client and server never disagree about where "today" is.
  // A visitor with a wrong system clock would otherwise see the boundary misplaced.
  "today": "2026-07-30",

  "eras": [
    { "id": "…", "name": "First Steps",      "tagline": "…",
      "startDate": "2022-01-01", "endDate": "2024-12-31" },
    { "id": "…", "name": "Banking Systems",  "tagline": "…",
      "startDate": "2025-01-01", "endDate": null },
    { "id": "…", "name": "The Next Chapter", "tagline": "…",
      "startDate": "2027-01-01", "endDate": null }
  ],

  "items": [
    { "type": "milestone", "track": "life", "eraId": "…", "date": "2022-06-01",
      "title": "BSc Computer Science", "subtitle": "University",
      "category": "Education", "description": "…", "connections": [] },

    { "type": "experience", "track": "career", "eraId": "…",
      "date": "2023-01-01", "endDate": "2024-12-31",
      "title": "Associate Software Engineer", "subtitle": "Banking Systems",
      "summary": "…", "highlights": ["…"], "techStack": ["C#", ".NET"],
      "connections": [ { "kind": "project", "title": "Core Banking Ledger",
                         "slug": "core-banking-ledger", "via": "shared C#" } ] },

    { "type": "project", "track": "career", "eraId": "…",
      "date": "2024-03-01", "endDate": null,
      "title": "Core Banking Ledger", "slug": "core-banking-ledger",
      "pitch": "…", "tags": ["backend"], "connections": [] },

    { "type": "certification", "track": "life", "eraId": "…", "date": "2025-11-03",
      "title": "Azure Developer Associate", "subtitle": "Microsoft", "link": "https://…",
      "connections": [ { "kind": "skill", "title": "Azure", "via": "certifies" } ] },

    { "type": "roadmap", "track": "career", "eraId": "…", "date": "2028-01-01",
      "status": "Planned", "title": "Senior Software Engineer",
      "description": "…", "connections": [] }
  ]
}
```

`eraId` is nullable. An item outside every era renders under its year alone rather than
vanishing, so a gap in the era list can never lose content.

**Roadmap items take the career track** by default — every seeded goal is a career goal
and `RoadmapItem` carries no track of its own. Worth revisiting only if a genuinely
personal goal ever needs the life side.

**`Milestone.Category` is a text label on the card, not a shape.** All milestones render
as ▲; the category reads as "Education" beneath the title. Five shapes is the cap, and
splitting milestones into four more would break it.

Items sort ascending by date. Cached and tagged `timeline`, evicted by any command
touching experience, projects, milestones, certifications, eras or roadmap — all six
feed it.

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
nothing to keep. **The context bar survives too** — it is information, not decoration.
The scrubber does not: it is navigation for a page being explored, and Recruiter Mode is
for a page being skimmed once.

**The dual track collapses to one column below `lg` (1024px)**, not at the usual mobile
breakpoint. Two columns of cards either side of a spine need roughly 350px each plus the
spine; at tablet width that is cramped enough to be worse than a single column.

---

## Chrome budget — the constraint that shapes the rest

The page is accumulating persistent furniture: lens chips, jump controls, a sticky
context bar, a scrubber. Four things competing with the content they exist to serve.

**On a 667px phone the budget is 140px, about 21% of the viewport.** That is the ceiling.
It is spent as:

| Element | Height | Sticky? |
|---|---|---|
| Site header | 56px | yes, already exists |
| Context bar — era + year + jump + lens | 44px | yes |
| Scrubber | 40px | yes, hides on scroll down |

Everything persistent lives in **one** 44px row. Two consequences, both decisions:

- **The era and the year share the bar.** Two stacked stickies would cost 88px for
  information that reads as a single fact: *where am I*.
- **The lens control lives there too.** An earlier draft had the chips scroll away with
  the page header, which was wrong: change your mind after scrolling and you would have
  to scroll back to the top to do it. At desktop width the five chips fit beside the era
  and jump controls; below `lg` they collapse to a single `Lens (3)` button opening a
  sheet.

There is room for this because the bar is wide, not because the budget grew — the total
is still 140px.

---

## Interaction

**Scroll** is native and never hijacked. Nodes reveal on entry, ~300ms, fade plus a
small translate.

**Entry** is at the today line, so the first thing seen is the present.

**Context bar** sticks below the site header (`top-14`, since the header is 56px) and
carries everything persistent in one row.

```
desktop ┌──────────────────────────────────────────────────────────────────────┐
        │ BANKING SYSTEMS · 2025   ●■▲◆○ lenses   ⤒ Start  ◉ Today  ⤓ Future  │
        └──────────────────────────────────────────────────────────────────────┘

mobile  ┌────────────────────────────────────┐
        │ BANKING SYSTEMS · 2025   ☰ Lens(5) │
        │                    ⤒   ◉   ⤓       │
        └────────────────────────────────────┘
```

Three anchors rather than one button, because they cost the same and answer the three
questions anyone has: *where did this begin*, *where is now*, *what comes next*. Each
scrolls smoothly, or jumps instantly under `prefers-reduced-motion`.

When an item sits outside every era the bar shows the year alone. A gap in the era list
never breaks the header.

**Lenses** filter node types. Persisted in a cookie *and* in the URL
(`?lens=roles,projects`), so a roles-only view is a link you can send someone.

**The lens chips are the legend, and they map one-to-one onto the node shapes.** Five
chips, five glyphs, no overlap — which is why *Life* and *Certifications* are separate
lenses rather than one "life" lens covering two different shapes.

| Chip | Glyph | Shows |
|---|---|---|
| Roles | ● | employment periods |
| Projects | ■ | case studies |
| Life | ▲ | milestones — education, recognition, community |
| Certifications | ◆ | credentials |
| Goals | ○ | roadmap items |

**Connections are listed inside the node, and each one is a link that scrolls to its
target.** Hovering or focusing additionally rings the related node — but that is a bonus
for when both happen to be on screen, not the mechanism. An earlier draft leaned on the
ring alone, which would have felt dead whenever the related node was scrolled out of
view.

**Scrubber** shows eras, density and position. Click or drag to travel; the page scrolls
smoothly to meet you. It hides on scroll-down and returns on scroll-up, so reading
reclaims its 40px.

**On this day** appears at the today line only when an event genuinely shares today's
date. Silent otherwise — a feature that fabricates a coincidence is worse than one that
waits for a real one.

**Shareable anchors.** Every era and year heading is linkable — clicking one updates the
URL to `#era-banking-systems` or `#year-2024`, and arriving at that URL scrolls there.
Together with lens state in the query string, any view of this page is a link.

*Not adopted: a copy-link button on every node.* It would add a control to every card to
serve a rare need, and the era and year anchors already cover the useful case.

---

## Node vocabulary

Five shapes, and no more. A vocabulary large enough to need a legend has failed.

| Glyph | Type | Track |
|---|---|---|
| **●** | role — a period of employment | career |
| **■** | project — links to its case study | career |
| **◆** | certification | life |
| **▲** | milestone — education, recognition, community | life |
| **○** dotted | goal — has not happened | future |

Shape is never the only carrier. Every node also states its type in text, and screen
readers get that text rather than the glyph, which is `aria-hidden`.

Glyphs must stay legible at 12px — that constraint is why there are five and not eight.

---

## Motion inventory

Everything that moves, why, and what it costs. Anything not on this list does not move.

| Motion | Where | Implementation | Notes |
|---|---|---|---|
| **Fade + translate** | node reveal on entry | `opacity` + `translateY(8px)`, 300ms | Compositor-only. The workhorse |
| **Line drawing** | the spine, as you scroll | `transform: scaleY()` on the spine, scroll-linked | **Not** `stroke-dashoffset` — that repaints every frame |
| **Card expansion** | role highlights, in place | height transition on a grid row | Reserve the space; never push content below |
| **Hover response** | any node | `scale(1.01)` + ring, 150ms, **one shot** | See the pulse note below |
| **Connection ring** | related nodes, on hover/focus | ring `opacity`, 150ms | The ecosystem read |
| **Today marker** | the today line only | slow breathing `opacity` | The **only** looping animation on the page |

### On "node pulse on hover"

Taken, but as a **single** response rather than a loop. A pulse that repeats while the
cursor rests is noise — and the site already has one breathing element in the Mission
Control status dot.

**Exactly one thing loops on this page: the today marker.** That is what makes it read as
*now* rather than as another date. A second looping element would cost the first one its
meaning.

### Rules

1. `transform` and `opacity` only. Anything else triggers layout or paint and drops
   frames on the mid-range phone a recruiter is holding.
2. Every animation no-ops — not degrades, **stops** — under Recruiter Mode and
   `prefers-reduced-motion`. Both already wired globally.
3. Reserve space before animating. An element animating in must already occupy its final
   size, or the animation is a layout shift in disguise.

---

## Timeline search — deferred, with a threshold

**Not built now.** With eras, lenses, a scrubber and roughly thirty nodes, everything is
already two interactions away. A search field would be chrome earning nothing, and it
duplicates the real search Knowledge Core needs — which belongs in the database as a
`tsvector`, not as a client-side filter over one page.

**Revisit when the timeline passes ~50 items.** Recording the number so this is a
decision with a trigger rather than something quietly forgotten.

---

## Responsive and accessibility gate the phase

They are **not** a pass at the end. A phase is not done until its work is correct at
360px and by keyboard. Concretely, before any Phase A item is ticked:

- It reads correctly at **360px** with no horizontal scroll anywhere on the page.
- It is reachable and operable by **keyboard alone**, with a visible focus ring.
- It survives **Recruiter Mode** and `prefers-reduced-motion`.
- Its meaning survives **without colour**.

The reason for gating rather than auditing: retrofitting keyboard support into a hover
interaction, or a 360px layout into a component built at 1440px, is a rewrite. Doing it
as you go is a constraint.

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

Every item below is subject to the responsive and accessibility gate above.

**Phase A — core. The page is not shippable without these.**

- [ ] `Era` and `Milestone` entities, configurations, seeders, migration
- [ ] `Certification ↔ Skill` join
- [ ] `GET /api/timeline` — merged, era-grouped, with derived connections
- [ ] Era bands, dual track, year markers, five node shapes
- [ ] Sticky context bar — era + year + the three jump anchors
- [ ] Today line, blueprint future
- [ ] Lens chips doubling as the legend: persistence and URL state
- [ ] Scroll reveal (fade + translate) and the spine drawing itself
- [ ] Shareable era and year anchors
- [ ] Recruiter Mode / reduced-motion static list, grouped by era
- [ ] Mobile single column within the chrome budget
- [ ] `docs/user-guide.md` section

**Phase B — same day if Phase A lands early. In this order.**

- [ ] Bottom scrubber: eras, density, position, click to travel, hide on scroll
- [ ] Connection highlighting on hover and focus
- [ ] In-place expansion of role highlights
- [ ] On this day

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
