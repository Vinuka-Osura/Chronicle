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

Not yet decided; due before the Day 6 deploy. The hard part is a .NET backend that is
always on, because "free" and "always on" rarely coexist.

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
