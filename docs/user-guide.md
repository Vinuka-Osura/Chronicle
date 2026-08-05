# Chronicle — user guide

What the application is, what each part of it does, and how to run it. Written for the
people who use it rather than the people who build it: no implementation detail, and no
assumption that you have read the code.

`README.md` covers setup, `CLAUDE.md` covers code conventions, and
`implementation-spec.md` covers the technical design. This is the plain-language one.

> **Status.** Every public page and every admin screen is built. What remains is a
> final pass over the visual design and animation, and deployment. The content is
> still a fictional engineer, Sam Iversen, until real details replace it — see
> `content-template.md`. Last updated 30 July 2026.

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
mood — you write in the admin. The live half is your most recent commit, from the
cached GitHub data. If GitHub cannot be reached that half is simply absent rather than
faked.

The strip loads separately from the rest of the page, so a slow or unavailable status
never delays the content behind it, and its space is reserved so nothing jumps when it
appears.

Below it the page reads as five scenes, in this order:

| Scene | What it is | Where the content comes from |
|---|---|---|
| **Introduction** | The positioning statement and three entry points. Holds still briefly while the headline draws back, then releases — the one place on the site that does. | Fixed copy |
| **Selected work** | The featured projects, as cards. | Projects marked *Featured* in the admin |
| **Outcomes** | What the work actually did — "Statement p95: 2.4s to 40ms". | The **Metrics** field on each featured project |
| **By the numbers** | The work in aggregate: contributions, languages, streak, repositories, projects and skills, each with its own chart. | GitHub, plus your projects, skills and timeline |
| **Range** | Strongest skills by category, and how many projects each was used on. | Skills, and the projects they are linked to |
| **Get in touch** | A closing sign-off. | Fixed copy |

**Several of these depend on you filling something in.** *Outcomes* shows a figure for
every metric on a featured project and disappears entirely if there are none, so adding
metrics to a case study is what makes it grow. Project cards show whatever image you
upload as the thumbnail; until then each one gets a generated pattern of its own, so a
card without a picture still looks finished.

**A card only ever appears when its data exists.** In *By the numbers*, the four GitHub
cards need a configured token — without one they are simply absent rather than showing
zeroes, because a headline "0 contributions" is a worse claim than no claim. The two
drawn from your own content, projects and timeline, are always there.

**A number is never given a chart it has not earned.** A bar or a ring says its
quantities sit on one scale. So "2.4s to 40ms" gets a comparison bar, because seconds and
milliseconds are the same measurement; a value like "40ms to 3 incidents" gets none, and
a metric written as a word rather than a number is shown exactly as you typed it. Every
figure counts up when you scroll to it, and counts again if you come back.

The strip along the bottom of every page names the scene you are in, how far down you
are, and offers the way back to the top. It stands aside when the full footer arrives.

**Working now.**

### About

Five sections, in this order:

| Section | What it is | Where the content comes from |
|---|---|---|
| **Opening** | The one-sentence version, set large. | Fixed copy |
| **The story** | How you got here, with the strongest sentence pulled out as a quote. | Fixed copy |
| **Where** | Every role: title, employer, dates, what you did, the stack. | Your experience entries |
| **Learning** | What you are working on now, with how far along each one is. | Learning items in the CMS |
| **Credentials** | Certifications, each linking to its verifiable record. | Certifications in the CMS |

**About used to say where none of the work happened.** The roles existed only on the
résumé and the timeline, which is the first thing most people read an About page to find
out — so they are here too, drawn from the same rows rather than typed out again. Add a
role in the admin and it appears in all three places at once.

The heading over that section counts itself: "two roles, one company" is worked out from
the entries rather than written down, so it cannot quietly become wrong the day you add
the third.

*Learning* is the section that costs something to publish — a list of what you are
currently bad at is a harder claim to fake than a list of what you are good at. Each item
shows its progress where you have set one; an item with no percentage shows its status
and no bar, because a missing measurement should look missing rather than look like zero.

Credentials without a verifiable link render plainly rather than as a dead link.

**Working now.** The prose still lives in the code rather than the CMS — it changes
about once a year, so it did not earn a screen. Everything else on the page is content
you can edit.

### Skills

Skills grouped by domain: Backend, Frontend, Database, DevOps, Cloud, AI, Other. Each
shows years of experience, a proficiency level from 1 to 5, and — the part that matters
— **where it was actually used**.

Those "used in" links are not typed in by hand. They are worked out from the projects
and roles that reference the skill, every time the page loads. A claim of two and a half
years of PostgreSQL is just a number; two case studies and a job that used it is
evidence. Because it is derived, the two can never drift apart. A skill with no work
behind it says so plainly rather than hiding.

The page opens with four counted figures — skills tracked, domains, the deepest one in
years, and how many distinct projects and roles back them up. Each group is headed with
its own count and its strongest entry, and the fullest groups come first, so the page
opens on its best material rather than on whatever the alphabet decided.

Each card names its proficiency level rather than only plotting it, shows its years
against the deepest skill on the page, and splits the evidence into projects and roles —
"used on four things" was hiding the more useful "two shipped projects and two jobs".
Projects link to their case study; roles are shown dashed, because they are a fact rather
than a destination.

**Working now.**

### Timeline

The signature page: your career and your life on one axis, rather than a list of jobs.

**The bar along the bottom is the whole span at once.** Its height is how many things were
running that month, split by kind and stacked — so a busy stretch is visibly busy, and you
can see at a glance where the work actually was. Drag it, click it, or use the arrow keys
to move through the years; the marker shows where you currently are.

It replaces a row of year buttons that drew a bar only for years containing something, so
an empty year vanished from the axis altogether and the spacing quietly misrepresented
time. Every month now occupies the same width whether anything happened in it or not,
which is the only way the shape means anything.

**Duration is drawn as area; a moment is drawn as a mark.** A role or a project or a degree
occupies months, so it is counted across every month it ran — a three-year degree is a
plateau, not a spike on the day it started. A certification has an issue date and nothing
else; giving it a width would be inventing duration, and drawn as a single month it would
be a sliver too thin to see. Those appear as small glyphs on the axis instead.

That is why isolating the Certifications lens gives you a row of marks and no curve at all.
It is the right answer: those are days, not seasons.

**The lenses now actually filter.** Turning one off hides its cards, its band in the bar,
and any year that contained nothing else. Your choice is remembered in a cookie and
reflected in the address bar, so a filtered timeline can be linked to.

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

The case studies, with a browser over them.

**Search covers the technology, not just the title.** Someone looking for "Postgres"
wants the projects that used it, and no title contains the word — matching titles alone
would return nothing and read as "you have not done that", which is the opposite of true.
Every word has to appear somewhere, in any order, so "postgres ledger" finds the ledger.

Alongside it: **tag chips** with a count each, and a **sort** — Curated, Newest, Oldest.
Curated is the order you set yourself.

**You control the order.** Each project has a *Sort order* in the admin: lower comes
first. Featured projects still lead, and within featured and within the rest your number
decides, with the start date settling anything you have left equal. It used to be the
last tiebreaker behind the date, which meant setting it did nothing unless two projects
happened to share a start date — the field was there and the order it produced was still
chronological.

The filtered list animates: cards fade and contract as they leave, and the survivors slide
into the gap rather than jumping. A count on screen says "3 of 4" so a filtered list never
looks like a short list.

**Each case study** carries the problem, the solution, the key decisions, the architecture
(as prose and as a generated diagram), measured results with their caveats, lessons
learned, screenshots, a walkthrough video and links out — every one of them optional, and
absent rather than empty when you have not filled it in. At the bottom, the previous and
next case study by name, so reading one leads to another.

**Media before object storage exists.** Thumbnails, screenshots and the walkthrough video
are stored as URLs, so anything reachable works today: put a file in the client's
`public/` folder and enter `/media/whatever.png`, or paste a link to a video host. Nothing
waits on a storage service being set up. Until you add one, project cards show a pattern
generated from the project's own name, so a card without a picture still looks finished.

**Working now.**

### Knowledge Core

**Everything on this page is evidence of knowing something, at different strengths.**
That is the whole organising idea, and the four sections run from strongest to most
honest:

| Section | The claim it makes |
|---|---|
| **Articles** | I understood it well enough to explain it in public |
| **Credentials** | Somebody else set an exam and marked it |
| **Images** | I published something anyone can pull |
| **Learning** | I do not know it yet, and here is how far I have got |

The last one is the one that costs something to publish, and it is the reason the page
works: a list of what you are currently bad at is a harder claim to fake than a list of
what you are good at.

**Credentials, container images and outside articles used to live on Analytics.** They
moved here because Analytics claims, in its own opening line, to show work *measured*
rather than claimed — and a certificate is a claim with provenance, not a measurement.
Analytics kept the counts; this page has the things themselves.

Any section with nothing in it does not render at all. A heading over an empty space
reads as neglect.

#### Articles

**Articles here are ones published somewhere else** — on Medium, fetched automatically
from your feed, or anywhere at all by adding the link in the CMS. Fill in *Article URL* on
an article and it becomes a preview card that opens the real thing rather than a page on
this site; leave it blank and the article is hosted here as before, with its own address
and full text.

That is how anything on LinkedIn gets here. LinkedIn publishes no feed and no public
article API, so it cannot be fetched the way Medium can — you paste the link and a cover
image, and it renders identically to one that arrived on its own.

**Search reads the whole article, not just the title.** Titles count most, then the
summary, then the body — so an article *about* a subject comes above one that mentions it
once in passing. It also understands word endings: searching "ledgers" finds "ledger".

**Search reaches articles hosted here only**, and the count line says so while you are
searching. An article on Medium leaves only its title and a two-line summary in the
database, so there is no body to search; quietly dropping those from a result set would
teach the reader they do not exist.

**Search reads the whole article, not just the title.** Titles count most, then the
summary, then the body — so an article *about* a subject comes above one that mentions
it once in passing. It also understands word endings: searching "ledgers" finds
"ledger", and "snapshot" finds "Snapshotting".

You can be more precise if you want to:

| Type this | And you get |
|---|---|
| `double entry` | articles containing both words, anywhere |
| `"double entry"` | only that exact phrase |
| `postgres OR redis` | either one |
| `audit -migration` | audit, but not the ones about migrations |

Anything it cannot parse is treated as ordinary words rather than an error — a stray
quote is a typo, not something worth showing you a failure for.

Drafts never appear. An article is invisible to the public site until you publish it.

**Working now.**

### Engineering Analytics

**This page answers "how much". Everything it shows is a measurement.** Its opening line
claims the work is measured rather than claimed, and the page is now held to that: the
credentials, the container images and the outside articles moved to Knowledge, because a
list of certificates is a claim with provenance rather than something measured. What stays
here is the counting.

Real activity from GitHub rather than claims about it:

- **Contribution mix** — the year's commits, pull requests, reviews and issues, shown
  separately. A year of commits and a year of code review describe very different
  engineers and one headline number cannot tell them apart. These four add up to the
  total, which is why they are the one thing on the page drawn as proportions.
- **The year week by week**, with a four-week trailing mean drawn over the bars rather
  than instead of them, so the smoothing cannot hide a week it disagrees with.
- **Every year on GitHub**, with the current one hatched and labelled "to date" — eleven
  months against twelve full ones would otherwise read as a decline.
- **Rhythm** — the day grid, the share of days with anything on them, and the longest
  streak *beside the longest gap*. A page showing only the best run is selecting its own
  evidence.
- **Which days the work happens on**, as an average per weekday rather than a total: a
  year holds 53 of one weekday and 52 of the rest, and totals would read that rounding
  artefact as a preference.
- **Open-source participation** — repositories you do not own where a maintainer merged
  your work. The one figure on the page a third party controls.
- **Stack Overflow** — reputation, badge counts, top tags, and the accepted-answer rate.
- **Output** — how many articles, images, image pulls and credentials exist, as counts
  only. The things themselves are on Knowledge.

**Private work is acknowledged without disclosing any of it.** Most professional output
lives in repositories nobody outside the company can open, so a portfolio built only on
public activity understates you by design. GitHub will report a *count* of private
contributions — no repository name, no commit message, no employer — but only if you turn
on **Settings → Public profile → Include private contributions on my profile**. Until you
do, that panel does not appear at all, because an empty one would read as "no private
work" when it usually means the setting is off.

**Only three figures on the whole page are drawn as a proportion**, and each has a real
denominator: the contribution mix, the share of active days, and the accepted-answer rate.
Everything else is a bare count and gets a counter. A bar over a number with no denominator
invents a comparison the data cannot make.

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

A full CV assembled from the same profile, experience, skills, projects, education and
certifications as the rest of the site. There is no separate résumé document to keep in
step — edit a job in the CMS and the résumé changes with everything else.

**It is written for an applicant-tracking system first and a reader second.** Most
applications are read by software before a person sees them, and the things that make a
CV parse correctly are structural rather than decorative:

- **One column.** Two columns look better and are extracted in the wrong order by a great
  many parsers, which interleave them line by line and turn a job title into a sentence
  about a programming language.
- **Conventional headings** — Experience, Education, Skills — because they are matched
  against a fixed vocabulary. The site's own voice would be better writing and an
  unrecognised section.
- **Real bullet lists**, where the bullet is drawn by the renderer rather than typed into
  the text. A typed bullet character is extracted as part of the sentence, so every
  achievement arrives with a stray dash welded to the front of it.
- **No graphics** — no meters, no rings, no card art. All of those exist elsewhere on this
  site and none of them survive text extraction as anything but a gap.
- **Six bullets per role at most.** Which six is an editing decision, and it is yours: the
  résumé shows the first six highlights on the job, in the order you put them.

Two ways to take a copy:

| Button | What you get |
|---|---|
| **Print or save as PDF** | The browser's own print output. Selectable text, not an image. |
| **Word (.docx)** | A real Word document, generated from the same data as the page. |

The Word copy exists because some application forms will not accept a PDF at all. It is
built from the same source as the page, so the two cannot say different things — and it is
deliberately plain: one column, standard font, no tables and no images.

**If the page says no profile has been set**, fill in *Profile* in the CMS. The name,
contact details and summary live there; everything below them is assembled from content
you have already entered.

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
prominent action everywhere. The moving background stops entirely, the scrolling loses
its momentum, and the sections that hold still on the way past stop doing so — so the
page is not merely quieter, it is meaningfully shorter.

**It takes effect the instant you switch it, with no reload.** That was not true before
August 2026: the switch changed the layout but left the background and the motion
running, so the mode looked half-applied until the page was reloaded.

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

**Everything on the public site is editable here.** Nothing needs a deploy to change.

The navigation groups the screens by what you are doing: the work (projects, articles),
the person (profile, experience, skills, certifications), and the timeline (eras,
milestones, learning, roadmap, status).

> **Start with Skills.** Projects, roles and certifications can only name a skill that
> already exists, so an empty Skills page will block you everywhere else. That is
> deliberate — see below.

#### Articles

Title, slug, excerpt, tags, body, a published switch, and — optionally — a link to
somewhere else.

- **Fill in *Article URL* and the entry becomes a link rather than a page.** The Knowledge
  list shows a preview card that opens the real article, the body is ignored, and there is
  nothing to read at `/knowledge/{slug}`. This is how anything published on LinkedIn gets
  onto the site: LinkedIn has no feed to read, so you paste the address by hand. Medium
  articles arrive on their own and need no entry here at all.
- **A cover image is worth setting on those.** A card that sends someone off the site has
  to earn the click, and a title on its own does not.
- **The body is only required when there is no external URL.** A pointer has no body of
  its own to store.
- **The slug is suggested from the title, and stops the moment you edit it yourself.**
  It is the article's address, so changing it later breaks any link anyone has shared.
- **Preview** renders the Markdown. Raw HTML is stripped in the preview *and* on the
  public site, so the preview cannot show you something the live page will not.
- **Reading time is calculated for you** from the body. There is no field for it.
- **The first-published date is set once and then left alone.** Fixing a typo three
  months later does not move the article to the top of the archive.
- **Unpublishing is the reversible action; deleting is not.** An unpublished article
  disappears from the public site immediately and its address returns "not found" —
  not "forbidden", which would confirm that something exists there. Deleting asks twice
  and cannot be undone.

#### Projects

The eight-part case study template. Only **Problem** and **Solution** are required —
leaving the rest empty is a real editorial choice, and the public page *hides* those
sections rather than printing an empty heading. **Preview** shows the assembled case
study in the order a visitor reads it.

**The architecture diagram is written, not drawn.** One connection per line:

```
Client -> API : HTTPS
API -> Posting handler
Posting handler -> Journal : one transaction
Snapshot worker -> Snapshots : scheduled
```

The site works out the layout and animates it — edges draw themselves and each box
lights up as the flow reaches it, once, when the diagram scrolls into view. There is a
Replay link; it does not loop, because a diagram pulsing away in the middle of a case
study competes with the writing it is meant to support.

This beats uploading a picture on every count that matters. It changes colour with the
theme, it is real text so it can be searched and read aloud, it weighs a couple of
kilobytes instead of a couple of hundred, and it cannot go stale — change the
description and the picture changes. The image field is still there for anything this
cannot express.

The label after `:` is optional and `#` starts a comment. A line it cannot parse is
skipped rather than breaking the page.

Two rules that will stop you if you break them:

- **Links must be full `http(s)` addresses.** A relative one would resolve against
  whatever page the visitor is on, and other schemes are a way to smuggle scripts into
  a link.
- **Tech stack entries must already exist as skills.** Tags are created as you type
  them, because inventing a tag while writing is normal. Skills are not: a skill carries
  years of experience and a proficiency level only you can set, so a typo is rejected
  rather than quietly creating a "Kubernets" with zero years next to it on the Skills
  page.

Tag and skill names match **regardless of case**, so "EF Core" and "ef core" stay one
tag rather than two that each filter to half your articles.

#### Screenshots

Each project has an image list under its editor, available once the project has been
saved — an image has to belong to something.

- **PNG, JPEG, WebP, AVIF or GIF, up to 5 MB.**
- **SVG is not accepted.** An SVG is a document rather than a picture: it can carry
  scripts, and serving one from this site would be a security hole with your login
  behind it. Export the diagram as PNG — one click, and the problem disappears.
- **The format is read from the file itself, not from its name.** Renaming
  `something.exe` to `screenshot.png` will not get it past the check, because the first
  few bytes of a real image cannot lie about what they are. This also means a JPEG named
  `.png` is stored correctly as a JPEG rather than being served with the wrong type.
- **Deleting removes the file as well as the entry**, and asks twice. The file goes
  first: a stored file with no entry is invisible and costs a few kilobytes, whereas an
  entry with no file is a broken image on a public page.

#### Status strip

The one-line "Now" on the home page, plus an optional mood. The last-commit half of the
strip comes from GitHub and is shown here read-only — there is nothing to edit.

#### Profile

Who the site is about: your name, the line under it, your contact details, and the
professional summary at the top of the CV. It is one form and there is only ever one of
it — you cannot create a second person.

- **The headline is a job title, not a slogan.** A parser reads the line under the name as
  the role you are applying for, so *Software Engineer* belongs there and *building things
  that matter* does not.
- **The summary is two to four sentences of prose**, and the field will not take more than
  about four. It is the block a human skims and a keyword matcher reads, so use the actual
  nouns of the work rather than adjectives about yourself.
- **Links need the full `https://` address.** A shorter one is resolved against whatever
  site the CV is opened on, and becomes a dead link on someone else's desk.
- **Anything optional you leave blank is omitted entirely**, not printed as an empty
  label. That includes the whole Availability section.
- **Location is city and country.** Enough to answer "can they work here?" — a street
  address on a public CV is an address on a public page.

Until this is filled in, the résumé page says so rather than showing an invented person.

#### Experience

Roles held. **Highlights are one per line** — three to five is right. Write what you did
and what changed because of it, with numbers where you have them and nothing invented
where you do not.

A role feeds three places at once: the timeline, the résumé, and the "used in" lists on
the skills page. Saving one refreshes all three.

**The résumé shows the first six highlights**, in your order. A role with more than six is
not truncated by accident — it is showing the six you put first, and reordering them here
is how you choose which.

#### Skills

The vocabulary everything else draws on, and **the page to fill in first**.

A project, role or certification can only name a skill that already exists here. That is
deliberate: a skill carries years of experience and a proficiency level that only you can
set, so accepting an unknown name would quietly create a "Kubernets" with zero years
against it and put it on your public skills page.

Names match **regardless of case**, so you cannot accidentally create both "EF Core" and
"ef core" — which would each filter to half your work and neither would look broken.

**A skill in use cannot be deleted.** The attempt tells you exactly what is holding it —
"used by 2 projects, 1 role" — rather than silently stripping that technology out of
every case study that listed it.

Be honest about levels. An inflated one is a trap you set for yourself in an interview.

#### Certifications

Credentials, and the skills each attests to. Those skills are what link a certificate to
the skills page, so AZ-204 can point at both "Azure" and "C#".

Add the verification URL where you have one. A credential nobody can check is worth less
than one they can.

**Kind decides how much room it gets, and whether it reaches your CV:**

| Kind | Example | Where it appears |
|---|---|---|
| Certification | AZ-900, CKAD | Everywhere, including the résumé |
| Applied Skill | Microsoft Applied Skills | Everywhere, including the résumé |
| Badge | A Microsoft Learn or Credly skill badge | Knowledge and About, **not** the résumé |
| Training | A completed module, course or learning path | Knowledge and About, **not** the résumé |

An invigilated exam and a module you clicked through are not the same claim, and a CV that
lists them together invites the reader to discount both.

**Set *Expires* on anything that lapses** — most Microsoft certifications renew annually.
Leave it blank for the ones that do not. Once the date passes, every page marks the
credential expired and dims it rather than quietly presenting it as current, which on a CV
is the worst place for a false claim.

**"Read from link" fills the name and badge image for you.** Paste a Microsoft Learn share
URL — either the `/api/credentials/share/` or `/api/achievements/share/` kind — or a Credly
badge address, and press it. The page's own title and artwork are read once and saved, so
the site never depends on the issuer being reachable afterwards. Only known credential
issuers are fetched; anything else is refused, because this follows whatever address is
typed into it.

**Credly badges appear on their own** if a Credly username is set on the Profile screen.
Where a badge matches a credential you have entered, yours wins on every fact and Credly
contributes only the picture — so nothing on the site can change because a third party
changed something. Badges Credly knows about and you have not entered are added to the end.

#### Timeline — eras and milestones

Both on one screen, because they only make sense together.

**Eras are the chapters** and only you can define them: no algorithm can find where one
period of your life ended and the next began. Three to six is right — fewer is not a
story, more is a list. Name them the way you would in conversation: "Finding my feet"
reads better than "Junior Developer, 2021–2023".

**You never assign anything to an era.** Projects, roles and milestones sort themselves
in by date. The milestone list shows which era each one lands in so you can spot one that
fell into the wrong chapter, or into none at all.

**Deleting an era loses only the heading.** Nothing points at it, so its contents
reappear under whichever era now covers those dates.

**Milestones** are the dated moments that are neither a job nor a project — graduating,
a talk, an award, a move. Education entries also feed the résumé.

#### Learning and Roadmap

**Learning** is what you are working through now, with an honest status. Leave progress
empty rather than guessing a number.

**Roadmap** is stated intentions, drawn below the timeline's "you are here" line and
labelled as goals. That framing is the only reason they are worth stating — a roadmap
presented as accomplishment is just an inaccurate CV.

### The storage gauge

The dashboard shows how much image storage is in use, against the free allowance.

This exists so the margin is visible **here**, rather than two clicks into someone
else's billing dashboard. The whole condition for using hosted storage at all was that
it must never be able to cost anything, and a safeguard nobody looks at is not a
safeguard. A portfolio's images realistically use well under 1% of the allowance, and
the gauge is how you stay certain of that.

The number is counted from the site's own records rather than by asking the storage
provider — asking is a billable operation, and the answer is already known.

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
| `GET /api/timeline` | Everything dated, merged and sorted into eras | Working |
| `GET /api/github/stats` | Cached GitHub activity | Working |
| `POST /api/contact` | Sends you a message | Working |
| `GET /api/career-graph` | Career data for Software City | Phase 2 |

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
