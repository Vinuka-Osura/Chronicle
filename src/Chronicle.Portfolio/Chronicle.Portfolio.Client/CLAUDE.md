@AGENTS.md

# Chronicle.Portfolio.Client — conventions

The public site. Next.js 16, React 19, Tailwind v4, Motion.

Root conventions: `../../../CLAUDE.md`.

## This is Next.js 16, and it differs from what you remember

The `AGENTS.md` imported above says it outright, and it is worth repeating: **read
`node_modules/next/dist/docs/` for this exact version before writing anything
non-trivial.** Prefer it over recall.

The differences that have already caused real problems here:

- **`fetch` is not cached by default.** Caching is explicit — `use cache` plus
  `cacheTag`/`cacheLife` in each feature's `api.ts`.
- **Cache Components is on** (`cacheComponents: true` in `next.config.ts`). It replaces
  the ppr / useCache / dynamicIO flags and makes Partial Prerendering the default.
- **`params` and `searchParams` are Promises.** Await them.
- **Anything touching runtime data must sit inside `<Suspense>` or the build fails** —
  `cookies()`, `headers()`, unbaked `params`, and `usePathname()`. Two consequences you
  will meet:
  - Recruiter Mode and theme use a **pre-paint inline script**, not `cookies()` during
    render, which would pull every page out of the static shell.
  - `SiteHeader` isolates `usePathname()` behind Suspense boundaries whose fallbacks
    render **identical markup**, so only the active-link highlight arrives late and
    nothing shifts.
- **`generateStaticParams` must return at least one entry** under Cache Components. The
  case-study route deliberately has none — baking the slug list at build would 404 any
  project added in the CMS until the next deploy, which is the opposite of the point.
  It resolves params at request time inside Suspense instead.

## Feature folders

Everything a feature owns lives with it. Only genuinely shared things go up a level.

```
src/app/<feature>/
  page.tsx           the route
  api.ts             that feature's typed fetchers, with use cache + cacheTag
  components/        components only this feature uses
  [slug]/page.tsx    nested routes as needed

src/lib/http.ts      shared fetch wrapper — the ONE place the base URL is read
src/lib/types.ts     shared DTO types mirroring the API
src/lib/appearance.tsx  theme + Recruiter Mode
src/components/      used by three or more features (SiteHeader, Footer, Markdown)
```

Promote a component out of a feature folder only once a **third** feature needs it. Two
users is a coincidence; three is a pattern.

The home page lives in an `(home)` route group so it can own `api.ts` and `components/`
like every other feature. Route groups do not affect the URL.

## Fetching

Go through `lib/http.ts`. `requestOr` degrades to an empty result rather than throwing,
so `next build` succeeds without a database — **the normal case in CI. Do not "fix" this
by making it throw.**

Tag a feature's cache with everything it derives from. The skills page tags `skills`,
`projects` and `experience`, because editing a project changes what it shows.

Match `cacheLife` to how live the data claims to be: content is `hours`, the Mission
Control status strip is `minutes` because it asserts it is current.

## Styling and theming

Tailwind v4 is **CSS-first**. Tokens live in `@theme` in `app/globals.css`. **There is
no `tailwind.config.ts`** — do not create one.

**Use the semantic tokens** — `bg-paper`, `text-ink`, `text-signal`, `border-rule` —
never literal colours. A `[data-theme="dark"]` block redefines what they mean, so
anything built on tokens themes in both directions for free and needs no `dark:`
variant. The `dark:` variant exists via `@custom-variant` for the rare case a token swap
cannot express, such as the theme toggle's two icons.

The dark palette is not the light one inverted: the accent lifts from `#b26b00` to
`#e0973f`, because the darker value loses its contrast on a dark surface.

Recruiter Mode is CSS, not a second component tree — `rm-hide`, `rm-grid`, `rm-compact`,
`rm-spacious` in `globals.css`. One code path to maintain, not two.

## Motion

`prefers-reduced-motion` is honoured globally and independently of Recruiter Mode.
Animate `transform` and `opacity` only; anything else triggers layout or paint and drops
frames on the mid-range phone a recruiter is actually holding. Full guidance:
`docs/technical-decisions.md` §3.

## Navigation

Every route is reachable from the header, every internal link uses `next/link` (a bare
`<a>` costs a full page load), and the active route is marked `aria-current="page"`. A
visitor should never reach a dead end or need the back button to continue.

## Before pushing

```bash
npm run lint        # Turbopack does NOT run ESLint, so a green build proves nothing
npm run typecheck
npm run build
```

All three. A build passing while lint fails is exactly how a broken CI run got through
once already.

**Dependency overrides must stay within a major version.** An override that crosses one
is an API change wearing a patch's clothes: forcing `brace-expansion` to v5 to clear an
advisory broke the `minimatch@3` inside ESLint, which needs the v1 API. If the only
fixed version is in a different major, leave it, confine it to dev dependencies, and
write down why — see the comments in `package.json`.
