# Chronicle — user guide

What the application is, what each part of it does, and how to run it. Written for the
people who use it rather than the people who build it: no implementation detail, and no
assumption that you have read the code.

`README.md` covers setup, `CLAUDE.md` covers code conventions, and
`implementation-spec.md` covers the technical design. This is the plain-language one.

> **Status.** Chronicle is mid-build. Sections marked **Not built yet** describe what a
> surface will do; the site says the same thing honestly rather than showing a
> half-finished page. Last updated 30 July 2026.

---

## What Chronicle is

A personal engineering portfolio built as a working product rather than a static page.

There are two applications and one database:

| Part | Who uses it | What it does |
|---|---|---|
| **Public site** | anyone visiting | Shows the work: projects, experience, skills, writing |
| **Admin CMS** | you, signed in | Where all that content is written and edited |
| **API** | the public site | Serves the content, read-only and cached |

The point of the split is that **publishing is not a deploy**. Write a project in the
admin, save it, and it is live on the next page load. No code change, no rebuild, no
waiting.

---

## The public site

### Mission Control — the home page

The landing surface. A short positioning statement, entry points into the rest of the
site, and a **status strip** showing what you are currently working on.

The status strip has two halves. The editorial half — current focus and an optional
mood — you write in the admin. The live half, your most recent commit, arrives with the
Analytics work; until then that part is simply absent rather than faked.

### About

The narrative: who you are, how you got here, what you care about building. A
**certifications strip** sits inline beneath it, each credential linking out to its
verifiable record, so recognitions live alongside the story rather than on a page nobody
visits.

*Not built yet — the API behind it is ready.*

### Skills

Skills grouped by domain: Backend, Frontend, Database, DevOps, Cloud, AI, Other. Each
shows years of experience, a proficiency level from 1 to 5, and — the part that matters
— **where it was actually used**.

Those "used in" links are not typed in by hand. They are worked out from the projects
and roles that reference the skill, every time the page loads. A claim of two and a half
years of PostgreSQL is just a number; two case studies and a job that used it is
evidence. Because it is derived, the two can never drift apart.

*Not built yet — the API behind it is ready.*

### Timeline

Experience, projects and future goals on one scrollable axis through time. You land at
today. Scrolling back moves through what has happened; scrolling forward crosses a
clearly marked boundary into the **roadmap** — stated goals, drawn dotted and
translucent so they cannot be mistaken for achievements.

*Not built yet.*

### Projects

The catalogue, filterable by tag. Each project opens a **case study** rather than a
description, following the same eight sections every time:

1. What it is, in one line
2. The problem
3. The solution and the decisions behind it
4. The tradeoffs
5. Architecture
6. Results
7. What was learned
8. Links — demo, source, docs, walkthrough

Sections you leave empty simply do not appear. A small project shows three sections and
still looks finished; a flagship shows all eight.

**Working now.**

### Knowledge Core

Two things on one page: **articles** you have written, tag-filterable and showing
reading time, and a **learning board** of what you are studying right now, each with an
honest progress state — Exploring, Learning or Comfortable.

Drafts never appear. An article is invisible to the public site until you publish it.

*Page not built yet — the API behind it is ready.*

### Engineering Analytics

Real activity pulled from GitHub: commits, repositories, a contribution calendar, most
used languages, current streak.

The numbers are fetched by the server and cached, never fetched by your browser. That
keeps the page fast, keeps it working when GitHub is slow, and means your GitHub token
never leaves the server.

*Not built yet.*

### Résumé

An interactive résumé built from the same experience, skills and projects as the rest of
the site — so it cannot go stale — plus a clean printable version.

*Not built yet.*

### Contact

A short form that reaches you by email, with spam protection, plus direct links.

*Not built yet.*

### Software City

A separate project: a career-visualisation engine that renders a developer's history as
a city you can scrub through time. `/city` currently explains the idea; it will link to
the real thing when that ships.

---

## Two things every page respects

### Recruiter Mode

A switch in the header that changes how the whole site renders, for someone who has
about sixty seconds and a stack of candidates.

Turned on: animation stops, the layout becomes a single dense column, decorative
imagery disappears, project outcomes move to the front, and the résumé becomes the most
prominent action everywhere.

It is not a stripped-down version. It is the same content arranged for a different
reader, and the choice is remembered — navigate away, come back tomorrow, still on.

### Light and dark

A theme switch sits next to it. If you have never chosen, the site follows your
operating system's setting.

Both preferences apply **before the page first paints**, so there is no flash of the
wrong theme or the wrong layout on load.

The site is also built to work on a phone: the navigation collapses into a menu below
laptop width, and nothing scrolls sideways. If you prefer reduced motion in your system
settings, animations are switched off regardless of Recruiter Mode.

---

## The admin CMS

Reached at `/admin` on the server, behind a sign-in. There is exactly one account —
yours — created from configuration on first run. There is no sign-up, because there is
no second user.

### Signing in

Go to `/admin`. If you are not signed in you land on the sign-in page and, once
authenticated, continue to wherever you were originally heading.

A wrong password and an unknown email give the same message on purpose, so the form
cannot be used to work out which accounts exist. Five failed attempts locks the account
for fifteen minutes.

### The dashboard

Counts for every content type, so you can see at a glance what exists.

### Editing content

*Not built yet.* CRUD screens for projects, articles and site status are next, followed
by the rest. Until they exist, content comes from the seed data.

### Why saving feels instant

Public pages are cached so visitors get them fast. The obvious problem with caching a
CMS is that you save a change, reload, and still see the old version, with no way to
tell whether the save worked.

Chronicle avoids that. Each kind of content is cached under its own label, and saving
clears exactly the labels you touched. The next visitor rebuilds that page; everything
else stays cached. **You should never have to wait for a change to appear.** If you do,
that is a bug worth reporting.

---

## Running it

Full setup lives in `README.md`. The short version, once configured:

```bash
dotnet run --project src/Chronicle.AppHost
```

That starts everything — database connection, API, admin and public site — and opens a
dashboard listing all three with links and live logs.

| You want | Where |
|---|---|
| The public site | the `portfolio-client` link on the dashboard |
| The admin CMS | `/admin` on `portfolio-server` |
| Browse the API | `/scalar/v1` on `portfolio-server` |
| Is it healthy? | `/health` |

---

## The API

Read-only, needs no key, and returns JSON. Browse and try every endpoint at
`/scalar/v1`.

| Endpoint | Returns | Status |
|---|---|---|
| `GET /api/projects` | Project cards, filterable by `?tag=` and `?featured=` | Working |
| `GET /api/projects/{slug}` | One full case study | Working |
| `GET /api/experience` | Roles held, most recent first | Working |
| `GET /api/skills` | Skills by category, each with where it was used | Working |
| `GET /api/posts` | Published articles, filterable by `?tag=` | Working |
| `GET /api/posts/{slug}` | One article | Working |
| `GET /api/learning` | What is being studied now | Working |
| `GET /api/roadmap` | Future goals, soonest first | Working |
| `GET /api/certifications` | Credentials, most recent first | Working |
| `GET /api/status` | Mission Control status strip | Working |
| `GET /api/timeline` | Experience, projects and roadmap merged | Not built yet |
| `GET /api/github/stats` | Cached GitHub activity | Not built yet |
| `GET /api/career-graph` | Career data for Software City | Not built yet |
| `POST /api/contact` | Sends you a message | Not built yet |

Article text and case-study sections come back as **Markdown**, unrendered. The site
turns that into HTML and sanitises it, so the API stays a content service rather than a
presentation one.

When something goes wrong you get a standard problem response — a machine-readable body
with a status, a title and a short explanation. A missing project is a `404`; a
malformed filter is a `400` naming the field. Unexpected failures say only that
something went wrong: the detail is logged on the server rather than shown to whoever
asked.

There is a rate limit of 120 requests a minute per address. It exists to discourage
scraping and no ordinary visitor will ever reach it.
