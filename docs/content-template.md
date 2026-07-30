# Chronicle — content template

**Fill this in and hand it back.** Everything here becomes the site. Nothing else is
needed from you.

Some rules that will save you time:

- **Leave anything blank that does not apply.** Blank is a real answer and the site
  handles it — optional sections are *hidden*, not rendered as empty headings. Do not
  invent something to fill a gap.
- **Dates**: `YYYY-MM` is enough almost everywhere (`2024-03`). Write `ongoing` for
  anything that has not ended. Where a day matters, the field says so.
- **Don't write to a word count.** Two honest sentences beat a padded paragraph, and
  padding is very visible on a page like this.
- **Markdown works** anywhere marked *(Markdown)* — `**bold**`, `` `code` ``,
  `- bullet lists`, `## headings`, and ```` ``` ```` fenced code blocks.
- Anything you mark **TODO** I will leave as-is and you can fill it later through the
  CMS without a deploy.

A rough order of effort: §1–§3 take ten minutes. §7 (projects) is where the real writing
is, and it is also the part a reader actually judges you on. If you are short of time,
do **one** project properly rather than four thinly.

---

## 1. Who you are

Appears in the page title, the link preview card, the résumé header, and the structured
data search engines read.

| Field | Your answer | Notes |
|---|---|---|
| Full name | | As you want it read |
| Role / title | | e.g. "Software Engineer" |
| Specialism line | | One clause. e.g. "payments systems and reliability" |
| Location | | Optional. City + country, or leave blank |
| Public email | | The address on the printed résumé. Blank = contact form only |
| GitHub username | | |
| LinkedIn URL | | Optional |
| Other profile | | Optional — anything else worth linking |
| Domain | | Once you have bought it |

**Home page headline** — the one sentence at the top of the site. Say what you do and
what makes you different, not what you are looking for.

> Current (demo): *"I build backends that stay correct when things go wrong."*

```
Your headline:

```

**Home page paragraph** — three or four sentences under the headline. What you work on,
and what kind of engineer you are.

```
Your paragraph:

```

**Résumé summary** — three or four sentences, but written for someone deciding whether
to read on. Slightly more formal than the home page.

```
Your summary:

```

---

## 2. The "Now" strip

The first thing on the home page, dated. Something six months stale reads worse than
something plain, so write what is actually true this month — you can change it any time
in the CMS.

| Field | Your answer |
|---|---|
| Now | e.g. "Building a career-visualisation engine in Three.js" |
| Mood *(optional)* | One or two words. Hidden in Recruiter Mode |

---

## 3. About page

| Field | Your answer |
|---|---|
| Heading | e.g. "How I work" |
| Body *(Markdown)* | Several paragraphs. Your approach, what you care about, how you got here |

```
Body:

```

---

## 4. Eras — the Timeline's chapters

**This is the piece that makes the timeline yours.** Eras are the named chapters your
life divides into, and only you can say where one ended and the next began — no
algorithm can find that boundary. Everything else on the timeline gets sorted into these
by date.

Three to six is right. Fewer and it is not a story; more and it is a list.

Name them the way you would in conversation, not the way a CV would. "Finding my feet"
is a better era name than "Junior Developer, 2021–2023".

| # | Era name | Tagline *(optional)* | Start | End | Notes |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

> Demo, for shape: *Learning the Craft* (2019-09 → 2021-06) · *Finding My Feet*
> (2021-07 → 2023-01) · *Payments at Scale* (2023-02 → 2025-12) · *What Comes Next*
> (2026-01 → ongoing)

---

## 5. Milestones

The dated moments that are not a job and not a project: graduating, a talk, an award, a
move, a first commit. These are the punctuation of the timeline.

**Category** must be one of: `Education` · `Recognition` · `Community` · `Personal`

| Date | End date *(optional)* | Category | Title | One-line description | Link *(optional)* |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

Education entries also feed the résumé's Education section, so include degrees here with
their start and end dates.

---

## 6. Experience

One block per role. **Copy the block for each one.** Most recent first is easiest.

```
Company:
Role / title:
Start (YYYY-MM):
End (YYYY-MM or "ongoing"):
Location (optional):

Summary — two or three sentences on what the role was:


Highlights — 3 to 5 bullets. What you actually did and what changed because of it.
Numbers where you have them; skip them where you do not rather than inventing one.
  -
  -
  -

Tech stack (comma separated):
```

---

## 7. Projects — the case studies

**This is the part people read.** Everything else establishes that you exist; this is
where someone decides whether you are good.

Copy the block per project. **Two to four is plenty.** Fill every section for your
flagship; for smaller ones fill only Problem and Solution and leave the rest blank —
those sections then disappear rather than showing as empty headings, and a short honest
entry reads far better than a padded one.

```
Title:
Slug (lowercase-with-hyphens — this becomes the URL):
Featured? (yes/no — featured projects lead the home and projects pages):
Start (YYYY-MM):
End (YYYY-MM or "ongoing"):

Pitch — ONE line. Appears on the card and in the timeline node. Make it concrete:
"A double-entry ledger that stays correct under concurrent posting" beats
"A banking application".


--- REQUIRED ---

Problem (Markdown) — what was actually wrong, and why it mattered. Write the
constraints, not just the goal. This is the section that shows whether you understood
the problem or just took the ticket.


Solution (Markdown) — what you built. Enough that a reader could sketch it.


--- OPTIONAL, and usually the most-read ---

Key decisions (Markdown) — what you chose, what you rejected, and WHY. If you write
only one optional section, write this one. "I picked X" is not interesting;
"I picked X over Y because Z, and here is what it cost me" is.


Architecture notes (Markdown) — how the pieces fit. Diagram URL below if you have one.


Results (Markdown) — what changed. Numbers if you have them, honestly. "Cut p99 from
1.2s to 180ms" is worth more than three paragraphs of adjectives. If you have no
numbers, say what got better in plain terms rather than reaching for a metric.


Lessons learned (Markdown) — what you would do differently. Do not skip this because
it feels like admitting weakness; it is the section that most reliably separates
people who have shipped from people who have not.


--- LINKS (all optional, all must be full https:// addresses) ---

GitHub URL:
Live demo URL:
Docs URL:
Video / walkthrough URL:
Architecture diagram image URL:

--- CLASSIFICATION ---

Tags (comma separated — free text, used for filtering. e.g. "Backend, Fintech"):
Tech stack (comma separated — these MUST match skill names in §8 exactly):
```

---

## 8. Skills

The tech stack of every project and role must appear here, or the save is rejected — a
skill carries years and a level that only you can set, so a typo cannot be allowed to
create a new one silently.

**Category** must be one of: `Backend` · `Frontend` · `Database` · `DevOps` · `Cloud` ·
`AI` · `Other`

**Level** must be one of: `Learning` · `Working` · `Proficient` · `Advanced` · `Expert`

Be honest about levels. An inflated one is a trap you set for yourself in an interview.

| Skill | Category | Years | Level |
|---|---|---|---|
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

> The site derives "used in" automatically from your projects and roles, so there is no
> field for it and it can never disagree with them.

---

## 9. Certifications

| Name | Issuer | Issued (YYYY-MM) | Expires *(optional)* | Credential URL *(optional)* | Skills it attests to |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| | | | | | |

The last column links a certificate to entries in §8, so AZ-204 can point at both "Azure"
and "C#". Names must match §8 exactly.

---

## 10. Articles (Knowledge Core)

Optional at launch — you can write these in the CMS whenever, with no deploy. Include
any you already have.

```
Title:
Slug (lowercase-with-hyphens):
Excerpt — one or two sentences, shown on the card and in search results:
Tags (comma separated):
Published? (yes/no — no keeps it as a draft, invisible on the public site):

Body (Markdown):

```

> Reading time is calculated from the body. There is no field for it.

---

## 11. Currently learning

What you are actively working through. Shows on the Knowledge page.

**Status** must be one of: `Planned` · `InProgress` · `Completed` · `Paused`

| Title | Kind (book / course / paper / other) | Status | Started | Finished | Link *(optional)* | One-line note |
|---|---|---|---|---|---|---|
| | | | | | | |
| | | | | | | |
| | | | | | | |

---

## 12. Roadmap

Stated intentions, rendered below the timeline's "today" marker. These are goals, not
achievements, and the site says so — which is what makes them worth stating.

**Status** must be one of: `Planned` · `InProgress` · `Done` · `Abandoned`

| Goal | Target date *(optional)* | Status | Why it matters — one line |
|---|---|---|---|
| | | | |
| | | | |
| | | | |
| | | | |

---

## 13. Images

Optional, and not needed to launch — every page works without them.

| What | Have it? | Notes |
|---|---|---|
| Profile photo | | Square, 400px+. About page and résumé |
| Project screenshots | | 2–4 per project. Name them so I can tell which is which |
| Architecture diagrams | | PNG or SVG |

Send them in a folder or as links; I will wire up storage and the CMS upload.

---

## 14. Anything else

Things that do not fit above, corrections to any of it, or parts of the site you want to
work differently.

```

```

---

## What happens after you send this back

1. I replace the demo persona with your content in the seed data, so the site is yours
   from the first run.
2. You review it running locally and tell me what is wrong.
3. We buy the domain and deploy.
4. **From then on you edit projects, articles and the status strip yourself in `/admin`,
   and changes are live on the next page load** — no deploy, no waiting for a cache.

**Every one of these sections is now editable in `/admin` too.** So this template is a
convenience, not a requirement — if you would rather type it straight into the CMS, do
that instead and skip the document entirely. It is still the faster route for §7
(projects), where the writing is the work and a text editor beats a web form.

If you do use the CMS directly, **fill in Skills first**: projects, roles and
certifications can only name a skill that already exists, so an empty Skills page blocks
everything else.
