# Chronicle — roadmap

Rewritten 31 July 2026, replacing the original day-by-day build plan. That plan is done;
keeping it would have described a week that has already happened.

Software City ships from its own repository. This one owes it only
`contracts/career-graph.v1.schema.json` and `GET /api/career-graph`, and **both are
finished** — see `technical-decisions.md` §5.

---

## Where this is

**Feature-complete, and unseen by human eyes.** Every public page and every admin screen
is built, 101 tests pass, the build is clean. Nothing is deployed.

| Area | State |
|---|---|
| Public site | 11 routes, all real. Mission Control, About, Skills, Timeline, Projects + case studies, Knowledge + articles + search, Analytics, Résumé, Contact, Software City |
| API | 13 endpoints — cached, tagged, rate-limited, documented at `/scalar/v1` |
| Admin CMS | 10 screens. Every content type on the site is editable without a deploy |
| Media | Two storage adapters behind one port, magic-byte validation, admin storage gauge |
| Search | PostgreSQL full-text, weighted title → excerpt → body, GIN index |
| Visual | Ambient light, two-tier elevation, one surface primitive, named type scale |
| Motion | Card choreography, scroll reveals, page transitions, animated architecture diagrams |
| Contract | CC0 schema, endpoint, and a test that guards it |

---

## What is left

### 1. Review — you

The visual and motion work is the largest thing in this project that **has never been
looked at by a person**. Structure, compiled CSS and behaviour are verified; appearance
is not.

Four things worth judging:

- **Ambient light** — too subtle, or too strong?
- **Card choreography** — click a tag filter on `/projects`
- **Architecture diagram** — scroll `/projects/core-banking-ledger` into view
- **360px layout, keyboard tab order, and Recruiter Mode**

### 2. Content — you

Either fill in `content-template.md` or type it straight into `/admin`. **Skills first:**
everything else names skills by string, so an empty Skills page blocks the rest.

### 3. Deployment

Full detail in `deployment.md`. About a day's work, most of it one-time setup, and it
needs a domain and three free accounts first.

Roughly £9 a year — all of it the domain.

---

## Deliberately not doing

| | Why |
|---|---|
| **Software City itself** | Weeks of work. Chronicle is not deployed, and a 3D city attached to an unreachable portfolio is worth exactly what the portfolio is worth. The seam is finished, so it starts whenever. |
| **`Project.Links` as jsonb** | Four typed columns beat an untyped list — the UI knows what each link *means*. The original plan had this; it was judged not worth the churn. |
| **An About-page editor** | The prose changes about once a year. It did not earn a screen. |

---

## Known debts

- **The dev database holds a synthetic GitHub payload**, inserted by hand to verify the
  charts. A real refresh replaces it, but it is not code and will not survive a reset.
- **A partial GitHub refresh is cached for the full interval.** If repos fetch but
  languages hit the rate limit, the half-empty payload holds for six hours rather than
  retrying sooner. Worth revisiting if the unauthenticated path ever becomes normal.
- **The PostgreSQL password needs rotating** before anything is public.
- **`GitHub:Pat` is unset**, so the contribution grid is empty. Repos, languages and
  last-commit already work without it.
