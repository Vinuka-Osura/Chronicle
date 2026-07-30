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

The strip loads separately from the rest of the page, so a slow or unavailable status
never delays the content behind it, and its space is reserved so nothing jumps when it
appears.

**Working now**, apart from the last-commit half.

### About

The narrative: who you are, how you got here, what you care about building. A
**certifications strip** sits inline beneath it, each credential linking out to its
verifiable record, so recognitions live alongside the story rather than on a page nobody
visits. Credentials without a verifiable link render plainly rather than as a dead link.

**Working now.** The prose still lives in the code and moves into the CMS with the
About editor.

### Skills

Skills grouped by domain: Backend, Frontend, Database, DevOps, Cloud, AI, Other. Each
shows years of experience, a proficiency level from 1 to 5, and — the part that matters
— **where it was actually used**.

Those "used in" links are not typed in by hand. They are worked out from the projects
and roles that reference the skill, every time the page loads. A claim of two and a half
years of PostgreSQL is just a number; two case studies and a job that used it is
evidence. Because it is derived, the two can never drift apart. A skill with no work
behind it says so plainly rather than hiding.

**Working now.**

### Timeline

The signature page: your career and your life on one axis, rather than a list of jobs.

**Chapters, not just dates.** The timeline is divided into named eras — "First Steps",
"Banking Systems" — each with a date range and a line on what that period was about. It
is the difference between remembering "the Banking Systems chapter" and remembering
"there were a lot of dates".

**Two tracks.** On a wide screen, work runs down one side of the spine and life down the
other: roles and projects on one, education, certifications and personal milestones on
the other. A certification sitting beside the role it was earned during says something a
list cannot. On a narrow screen they merge into one column and the shape of each node
tells you which track it came from.

**A hard "you are here" line.** Everything above it happened. Everything below is drawn
dotted and hollow, and labelled as a goal, so ambition never reads as achievement.

**Five kinds of thing**, each with its own shape so you can tell them apart at a glance:

| | | |
|---|---|---|
| ● | Role | a period of employment |
| ■ | Project | opens its case study |
| ▲ | Life | education, recognition, community |
| ◆ | Certification | a credential |
| ○ | Goal | stated intention, not yet done |

**Lenses** let you decide what you see. Turn off everything but roles and the page
becomes a career summary; leave it all on and you get the whole arc. Your choice is
remembered, and it goes into the address bar — so a roles-only view is a link you can
send someone. The chips carry the same shapes the nodes use, so the filter doubles as
the key.

**Connections.** Nodes reference each other, and every connection says *why*: a
certification links to the skill it attests to, and on to the projects that used it; a
project links to articles that share its tags; a role links to projects it overlapped
with. None of it is typed in by hand — it is worked out from the underlying
relationships, so it cannot drift out of date. Connections name the most *distinctive*
shared skill rather than the most common one, because "shared Docker, SQL Server" tells
you something and "shared C#" does not.

**Getting around.** A bar under the site header always shows which chapter and year you
are in, with three jumps: start, today, and what comes next. Chapter and year headings
are links to themselves, so clicking one puts it in the address bar and you can send
somebody straight to 2024.

Along the bottom is a scrubber: one bar per year, its height showing how much happened
that year, grouped under chapter names. It answers "when was he busiest" at a glance and
clicking any bar travels there. It slides out of the way as you scroll down and comes
back when you scroll up.

**On this day.** If something on the timeline happened on today's date in an earlier
year, a line by the "you are here" marker says so. If nothing did, it stays quiet rather
than inventing a coincidence.

**Working now.**

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

Real activity from GitHub rather than claims about it: contributions over the last year,
public repositories, current and longest streak, a day-by-day contribution grid, and the
language mix by volume of code.

**Your browser never talks to GitHub.** The server fetches these every few hours and
keeps the result in one row of the database; every visitor reads that row. Three things
follow from that:

- The page stays fast, and stays up, when GitHub is slow or down.
- The rate limit is spent once for the whole site rather than once per visitor.
- The access token never leaves the server, so it cannot be read out of the page.

If a refresh fails, the previous figures stay on screen rather than being replaced by an
error — figures from this morning are worth more to a reader than a apology. The page
states when it last refreshed, so nothing pretends to be live that isn't.

**The colours mean something.** Darker cells are busier days. The four shades are steps
of one colour rather than four different colours, because the grid measures *how much*,
not *which* — and the thresholds come from your own quietest and busiest days, so a
steady year and a frantic one both read clearly instead of one coming out uniformly
pale. "Show monthly totals" gives the same information as a table, for anyone who
cannot use a hover.

The **Now** strip on the home page shares this data: its "last commit" line is the most
recent push the server saw when it last looked.

> **For the owner:** with no `GitHub:Pat` configured, the repository, language and
> last-commit figures still work — those come from GitHub's public API. The contribution
> grid does not: GitHub only exposes it to authenticated requests. If the page shows
> everything except the grid, that is the missing token, not a bug. With no username
> configured at all, the page says "not connected" rather than showing zeroes, because
> "no contributions" and "no data" are different claims and only one of them is true.

### Résumé

A one-page résumé assembled from the same experience, skills, projects, education and
certifications as the rest of the site. There is no separate résumé document to keep in
step — edit a job in the CMS and the résumé changes with everything else.

Use **Print / Save as PDF** for a copy to attach to an application. The printed version
drops the site navigation, the theme toggle and the button itself, and comes out as
selectable text rather than an image — which is what an applicant-tracking system needs
in order to read it at all.

### Contact

A short form — name, email, message — that arrives in your inbox as an email.

**Nothing is stored.** A contact message is a notification, not content, so it is sent
and forgotten. There is no table of other people's personal data to secure, back up, or
eventually have to delete.

Three things protect it from spam and abuse:

- A **hidden field** no person can see or tab into. Automated form-fillers fill in every
  field they find, so anything that arrives with it filled is rejected.
- A **rate limit** of five messages every five minutes per address. Sending more says so
  plainly and suggests emailing directly instead.
- The **visitor's address goes in Reply-To, never in From.** Sending mail that claims to
  come from someone else's domain is how a message ends up in a spam folder — yours,
  not theirs.

If something goes wrong the form says which thing: a rate limit, a field that needs
fixing, a connection that failed, or email not being configured on the server. "Something
went wrong" is not useful to someone who has just written three paragraphs.

> **For the owner:** with no `Smtp:*` settings configured, messages are written to the
> server log in development rather than sent, so the form can be worked on without a mail
> account. In production the same gap returns a clear "not accepting messages right now"
> instead of silently swallowing them.

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
