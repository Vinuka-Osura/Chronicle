# Technical decisions

Choices that are expensive to reverse, with the reasoning. Recorded when made rather
than reconstructed later.

---

## 0. Standing constraint: the bill must be £0.00

Every choice in this document is subject to it. Not "cheap", not "free tier with
headroom" — **nothing may charge, ever**. When a free tier and a hard guarantee
disagree, the hard guarantee wins.

Two practical rules follow:

- **Prefer no account and no card over a generous allowance.** A service that cannot
  bill you is safer than one that merely probably will not.
- **Size for reality.** This is a portfolio: a few dozen screenshots, a handful of short
  videos, tens of database rows. Storage measured in megabytes, not gigabytes. Choosing
  infrastructure for imagined scale is how free projects start costing money.

---

## 1. Media storage — Cloudflare R2

**Decision: R2, with a usage gauge in the admin dashboard.**

| | **R2** | Cloudinary | Supabase Storage | Local disk |
|---|---|---|---|---|
| Free storage | **10 GB, permanent** | ~10 GB shared quota | 1 GB | host's disk |
| Egress | **$0, uncapped** | counts against the quota | 5 GB/month | host's bandwidth |
| Video | yes | **not on free tier** | yes | yes |
| API | **S3-compatible** | proprietary | S3-compatible | filesystem |
| Ties media to the server | **no** | no | no | **yes** |

### On the cost risk

R2 needs a card on file and Cloudflare offers no hard spend cap, which is worth stating
plainly. It is not, however, a real risk here, because the gap between the limit and the
requirement is an order of magnitude:

| | Free allowance | Realistic use | Headroom |
|---|---|---|---|
| Storage | 10 GB | well under 1 GB — dozens of screenshots and a few short videos | **10×+** |
| Class B ops (reads) | 10 M/month | thousands, and CDN cache hits do not count | **~1000×** |
| Class A ops (writes) | 1 M/month | one per CMS upload | effectively unbounded |
| Egress | unlimited | — | n/a |

Exceeding this would take a hundredfold change in what the site is. A cap protects
against runaway *usage*; there is no mechanism here by which usage runs away, because
nothing writes to the bucket except a human uploading a file in the CMS.

**Mitigation, and it is the part that closes the question:** the admin dashboard shows
current object count and total bytes against the 10 GB allowance. Usage becomes
something you glance at while editing rather than something you would have to remember
to check in Cloudflare's console — so the number is visible long before it could matter.

### The advantage local disk would have cost us

Local storage would have tied the deployment to a host with a persistent disk, ruling
out every ephemeral container platform. R2 keeps media independent of wherever the
server runs, so the hosting decision below stays open — and media survives a redeploy,
a host migration, or the server being rebuilt from scratch.

**Never a consumer sync product** — Dropbox, Google Drive and similar rate-limit
hot-linking, rewrite share URLs, and offer no cache headers.

---

## 1b. Hosting, at £0.00

**Deferred, deliberately.** Deployment now happens after the application is complete and
tested rather than on Day 6, and a domain has to be bought first. The options below stay
on the table; nothing about the codebase depends on which one wins, because Aspire is
dev-time orchestration and the server is an ordinary ASP.NET Core app underneath.

The hard part is a .NET backend that is always on, because "free" and "always on" rarely
coexist.

| Option | Free? | Catch |
|---|---|---|
| **Oracle Cloud Always Free** VM | permanently free, generous | card for identity check, never charged. Run the app, Postgres and media on one box |
| **Azure App Service F1** | permanently free | 60 CPU-minutes/day, no SSL on custom domains, shared and slow |
| **Render / Railway free** | free tier | **spins down when idle; ~50s cold start** — a recruiter would see a hanging page |
| **Neon** (database) | free, no card | scales to zero but wakes automatically |
| **Vercel Hobby** (frontend) | free, no card | fine as-is |

Leading candidate: **Vercel for the client, Oracle Always Free for the server, Postgres
and media on that same VM.** One box, persistent disk, no card charged, nothing that
sleeps.

**Ruled out: anything that spins down on idle**, for the same reason Supabase's pausing
was ruled out — a portfolio's whole job is to be up when someone finally clicks the
link.

---

## 1c. Reference — Cloudflare R2, if it is ever needed

Screenshots, architecture diagrams and video need somewhere to live that is not the
database and not the repository.

| | **R2** | Cloudinary | Supabase Storage |
|---|---|---|---|
| Free storage | **10 GB** | ~10 GB (shared quota) | 1 GB |
| Egress | **$0, unlimited** | counts against the same 25 credits | 5 GB/month |
| Video | yes, plain objects | **not on the free tier** | yes |
| API | **S3-compatible** | proprietary SDK | S3-compatible |

**Chosen: R2.** Two reasons that matter more than the storage number. Egress is free and
uncapped, so a page that gets shared widely cannot produce a bill — the failure mode
that actually bites a public portfolio. And it is S3-compatible, so `IMediaStorage` gets
a standard `AWSSDK.S3` implementation and the whole thing is portable to any S3 provider
if that ever changes.

Cloudinary's automatic format and quality optimisation is genuinely good, but
`next/image` already does that, and its free tier **cannot transform video** — which
rules it out given the case-study template includes a walkthrough video.

**Not Dropbox, Google Drive or similar.** They are sync products, not object stores:
they rate-limit hot-linking, rewrite share URLs, and offer no CDN or cache headers.

### Related: do not use Supabase for the production database

Free Supabase projects **pause after 7 days without a request and need unpausing by hand
from the dashboard**. For a portfolio that can sit quiet for weeks, that means a
recruiter opens your link and gets a dead site — the worst failure this project has.
Neon scales to zero the same way but wakes automatically on the next connection. Prefer
Neon, or pay for Supabase.

---

## 2. Making more of PostgreSQL

The database is not a dumb key-value store and should not be treated as one. Two columns
already use `jsonb` — `portfolio_experiences.Highlights` and
`site_github_stats_cache.PayloadJson`. Four more places earn it.

### `portfolio_media.Metadata` → jsonb

Width, height, blur placeholder, MIME type, byte size, and for video duration and poster
frame.

Not optional detail: `next/image` needs intrinsic width and height to reserve space, and
without them every image on the page causes layout shift as it loads. A rigid column per
attribute would also mean a migration every time a new media type needs one more field.

```json
{ "width": 2400, "height": 1350, "mime": "image/avif", "bytes": 184320,
  "blurhash": "LEHV6nWB2yk8pyo0adR*.7kCMdnj", "duration": null }
```

### `portfolio_projects.Links` → jsonb

Replaces four nullable URL columns — `VideoUrl`, `GithubUrl`, `DemoUrl`, `DocsUrl` —
with an ordered list. A project with a design doc, two demos and a conference talk fits
without a schema change, and the ordering becomes the author's rather than the column
order's.

```json
[{ "kind": "source", "label": "Source", "url": "https://..." },
 { "kind": "demo",   "label": "Live demo", "url": "https://..." }]
```

### `portfolio_projects.Metrics` → jsonb

Results are currently one Markdown blob. Structured, they can render as stat tiles —
which is how a reader actually scans an outcome — instead of a bullet list.

```json
[{ "label": "p95 statement latency", "before": "2.4s", "after": "38ms", "direction": "down" },
 { "label": "Balance discrepancies", "after": "0", "direction": "flat" }]
```

### Full-text search on articles → `tsvector` + GIN

The Knowledge Core is specified as searchable. A generated `tsvector` column over title,
excerpt and body with a GIN index gives real ranked search in the database, with no
search service and no client-side filtering of a payload that grows with every post.

```sql
ALTER TABLE knowledge_posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("Title", '')),        'A') ||
    setweight(to_tsvector('english', coalesce("Excerpt", '')),      'B') ||
    setweight(to_tsvector('english', coalesce("BodyMarkdown", '')), 'C')
  ) STORED;
CREATE INDEX ix_knowledge_posts_search ON knowledge_posts USING GIN (search_vector);
```

Generated means Postgres maintains it; there is no way for the index to fall out of step
with the row.

### Also worth using

- **GIN indexes on the jsonb columns** once anything queries inside them.
- **`pgvector`** for the Copilot, already planned — same database, no new infrastructure.
- **The career-graph contract is jsonb-shaped already.** Software City's lifecycle model
  (`built`, `upgraded[]`) maps to jsonb directly, so `GET /api/career-graph` can be
  largely a projection rather than an assembly.

### When these land

With the media upload work, not before. They are schema changes, and doing them
alongside the CMS editors means one migration instead of three. Recorded now so the
decision is not remade from scratch later.

---

## 3. Animation

The site is a work sample, so motion has to look considered rather than decorative. The
techniques below are ranked by what they cost and what they buy.

### Static images are the fallback, not the plan

Where something has states or a process, show the process.

| Technique | Best for | Cost |
|---|---|---|
| **Animated SVG** | architecture diagrams: data moving along paths, services lighting up in sequence | low — a few KB, themes automatically via `currentColor`, scriptable |
| **Scroll-scrubbed image sequence** | a hero or product shot the reader controls by scrolling, Apple-style | high — dozens of frames to preload, needs canvas and careful memory handling |
| **Lottie** | illustrated motion designed in After Effects | medium — vector, small, but adds a runtime library |
| **Sprite sheet + CSS `steps()`** | short looping frame animation, e.g. a build indicator | very low — one image, no JavaScript |
| **Native CSS scroll-driven animation** (`animation-timeline: scroll()` / `view()`) | reveal-on-scroll | very low — runs on the compositor, no JavaScript at all |
| **View Transitions API** | continuity between pages | low — native, degrades silently |
| **Motion `useScroll` + `useTransform`** | anything needing real scroll maths | medium — already a dependency |

### Where each goes in this site

- **Case-study architecture diagrams** — animated SVG. The spec asks for a diagram that
  shows the system *working*: a request travelling from client to API to database, a
  worker waking on a schedule. This is the single highest-value animation on the site
  and the cheapest of the impressive options.
- **Timeline** — scroll-linked node reveals plus the per-era colour grade. Native
  scroll-driven animation where supported, Motion as the fallback.
- **Analytics** — charts that draw in once, on first view. Never on every scroll.
- **Software City teaser** — a short scroll-scrubbed sequence of the city being built is
  exactly the right use of the expensive technique, because it is the one place where
  showing beats describing.
- **Page transitions** — View Transitions, subtle.

### Rules that apply to all of it

1. **Animate `transform` and `opacity` only.** Everything else triggers layout or paint
   and drops frames on a mid-range phone — which is what a recruiter is holding.
2. **Every animation must no-op** under Recruiter Mode and `prefers-reduced-motion`. Not
   degrade — stop. Both are already wired globally in `globals.css`.
3. **Nothing animates on a loop in the periphery.** Motion that never resolves is noise,
   and it is exhausting to read next to.
4. **Reserve the space first.** An element that animates in must already occupy its final
   size, or the animation is a layout shift wearing a disguise.
5. **Budget the bytes.** A 40-frame scroll sequence is easily 4 MB. It is worth it in one
   place, and nowhere else.

### When this lands

The final UI/UX phase, after every surface exists. Polishing a page that later gains a
filter, a chart or an empty state is an hour spent twice — see `roadmap.md`.

---

## 4. Charts, and why the colours are computed rather than chosen

The Analytics page is the only surface with data visualisation, and the colour on it is
load-bearing: a heatmap cell's shade *is* its value. Picking those shades by eye is how
a chart ends up unreadable for the ~8% of men with a colour vision deficiency, or
illegible in one of the two themes.

So the ramp is derived and then checked by a script, not chosen.

### Three visualisations, three deliberately different forms

| Data | Form | Colour job |
|---|---|---|
| Four headline figures | stat tiles | none — the number is the chart |
| A year of daily contributions | 53×7 heatmap grid | **sequential**: one hue, light→dark |
| Language mix | horizontal bars | **one hue for every bar** |

The last one is the least obvious and the most important. Languages are *nominal* —
reordering them changes nothing — so giving each its own colour would spend the identity
channel restating what the bar length already says, and claim a distinction between C#
and SQL that no reader has a use for. The name beside the bar is the identity channel.
The same reasoning rules out a value ramp: colouring each bar darker-where-bigger
double-encodes the length.

Bars are also scaled against the **largest share, not against 100**, and therefore have
no track behind them. A full-width track would read as a 100% reference, which would be
quietly false.

### The heatmap ramp

Five steps — four live levels plus "no contributions" — derived in OKLCH at even
lightness intervals on the accent's own hue (64°), then validated:

- lightness strictly monotone, adjacent ΔL ≥ 0.06, so the steps are tellable apart;
- a single hue, because a rainbow would invent categories the data does not have;
- the **lightest live step still clears 2:1 on the surface**, so the quietest real day
  is never mistaken for an empty one.

The first attempt failed that last check — the pale end sat at 1.14:1 — and the whole
ramp had to shift darker. That is exactly the failure eyeballing would have shipped.

**Dark mode is a separate ramp, not an inversion.** Its direction reverses (lighter means
more, because light is what reads as "more" on a dark surface) and each step was
re-derived against `#0b0f16`. `--color-heat-0` is deliberately *off* the ramp: an absence
is chrome, not the lowest value, so it wears the rule colour.

Level thresholds are **quartiles of the account's own non-zero days**, not fixed numbers.
Fixed thresholds flatter a busy account and render a quiet one as a single uniform
shade; quartiles give both a readable spread of the year they actually had.

### Non-negotiables carried into the components

- **A table view is a requirement, not a nicety.** The heatmap's per-day values are
  otherwise only reachable by hovering, and a value only a mouse can reach is a value
  some readers cannot reach at all. The monthly-totals table is the accessible twin.
- **Text never wears the data colour.** Axis and month labels use `ink-soft`, not
  `ink-faint`: at 10px they are small text, and the faint token clears 3:1 but not the
  4.5:1 text bar on the light surface.
- **The tooltip is `aria-hidden`.** Announcing on every cell the pointer crosses is a
  stream of noise; the table carries the same values.
- **No dual axes, ever** — two y-scales on one plot invent a correlation that is not in
  the data. Two measures of different scale get two charts.

---

## 5. Software City as a saleable product, and what that forces

Software City is now intended to be **sold separately**, not just kept in its own
repository. That changes almost nothing about Chronicle and one thing about the licence.

### The contract is the product's input, not Chronicle's output

If people buy the renderer they feed it **their** data. So the thing being depended on is
`contracts/career-graph.v1.schema.json`, and Chronicle is one producer of that shape with
no special status. Framed the other way round — "the city reads Chronicle's API" — the
product is unsellable, because every buyer would need a Chronicle.

### Which is why the schema had to be relicensed

The repository licence reserves essentially all rights: no copying, no deriving, no
reuse. A schema under those terms is a document describing a contract that **nobody is
permitted to honour**, which is the same as having no contract.

`contracts/` is therefore carved out under **CC0**. A buyer can copy it, generate types
from it, embed it, and ship commercially without asking. The carve-out covers the format
only — no rights over the producer or any consumer. See `contracts/LICENSE` and §4b of the
root licence.

### Build it later, not now

Weeks of work: a WebGL renderer, a city generator, time scrubbing, and real performance
work for a mid-range phone. Chronicle is not deployed yet, and a 3D city attached to a
portfolio nobody can reach is worth what the portfolio is worth.

The endpoint, the schema and the contract test are done, so the seam is finished and the
city is unblocked whenever it starts. That was a day, not weeks.

### Rules the commercial framing imposes

1. **Develop it in its own repository from commit 1.** Provenance matters when selling
   software; code that was ever inside a proprietary repo is a question a buyer's lawyer
   asks.
2. **It must never import Chronicle code** — only read the contract.
3. **Version the schema, never edit v1 in place.** A shipped consumer is entitled to
   assume v1 means what it meant when they built against it. A change is `v2`, a new file.
4. **The contract test is not optional.** It is the only thing in this repository
   protecting software outside it, and a rename nobody notices here is a broken renderer
   days later with no obvious cause.

### What is still an open product question

Not decided, and not decidable from here: what a buyer actually buys — hosted service,
npm package, licensed source — and how they get their data in. That decision shapes the
renderer's architecture, so it wants answering before the code starts, not after.
