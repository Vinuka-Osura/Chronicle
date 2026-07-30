# Chronicle

A personal engineering portfolio built as a product rather than a page: a **.NET 10**
API and CMS behind a **Next.js 16** frontend, orchestrated by **.NET Aspire**, in one
solution.

The site is meant to be its own work sample. Content lives in a database and is edited
through an admin CMS, so publishing a project is an admin action, not a deploy.

```
Next.js client  ──HTTPS/JSON──▶  ASP.NET Core host  ──EF Core──▶  PostgreSQL
(public site)                    /api/*   read-only, cached
                                 /admin/* Blazor CMS, Identity
```

---

## Prerequisites

| Requirement | Notes |
|---|---|
| .NET SDK 10.0.3xx | pinned in `global.json` |
| Node.js 20+ | 24.x is what this was built against |
| PostgreSQL 16+ | a local install is fine — **no container runtime required** |

Docker is *optional*. The AppHost binds to a locally installed PostgreSQL by default;
see [Using a database container](#using-a-database-container) to switch.

---

## Running it

**1. Create the database**

```bash
psql -U postgres -c "CREATE DATABASE chronicle;"
```

**2. Configure secrets** (never committed — this repository is public)

```bash
cd src/Chronicle.AppHost
dotnet user-secrets set "ConnectionStrings:chronicledb" \
  "Host=localhost;Port=5432;Database=chronicle;Username=postgres;Password=<your-password>"

cd ../Chronicle.Portfolio/Chronicle.Portfolio.Server
dotnet user-secrets set "Admin:Email"    "you@example.com"
dotnet user-secrets set "Admin:Password" "<12+ chars, mixed case, digit, symbol>"
```

If `Admin:*` is unset the site still runs — only `/admin` is unreachable, and a warning
says so at startup.

**3. Install client dependencies**

```bash
cd src/Chronicle.Portfolio/Chronicle.Portfolio.Client && npm install
```

**4. Start everything**

```bash
dotnet run --project src/Chronicle.AppHost
```

The Aspire dashboard opens and starts the database connection, the API + CMS, and the
Next.js dev server. Migrations apply and sample content seeds automatically in
Development.

| Surface | Where |
|---|---|
| Public site | the `portfolio-client` endpoint in the dashboard |
| API reference | `/scalar/v1` on `portfolio-server` |
| Admin CMS | `/admin` on `portfolio-server` |
| Health | `/health` and `/alive` |

---

## Layout

```
Chronicle.slnx
├── docs/                              product proposal, implementation spec, city concept
├── src/
│   ├── Chronicle.AppHost/             Aspire orchestration — the run entry point
│   ├── Chronicle.ServiceDefaults/     OpenTelemetry, health checks, resilience
│   ├── Chronicle.Domain/              entities + enums. Zero dependencies, enforced by tests
│   ├── Chronicle.Application/         MediatR CQRS, DTOs, validators, ports
│   ├── Chronicle.Infrastructure/      EF Core + Npgsql, Identity, migrations, seed
│   └── Chronicle.Portfolio/
│       ├── Chronicle.Portfolio.Server/  /api/* minimal APIs + /admin Blazor CMS
│       └── Chronicle.Portfolio.Client/  Next.js 16 + Tailwind v4 + Motion
└── tests/
```

Dependencies point inwards only:

```
AppHost ──▶ Portfolio.Server ──▶ Application + Infrastructure + ServiceDefaults
                                 Infrastructure ──▶ Application ──▶ Domain
```

---

## Notable decisions

**No `IRepository<T>`.** EF Core's `DbContext` is already a repository and a unit of
work. `IChronicleDbContext` exposes the `DbSet<T>`s so handlers stay testable without
giving up `Include`, projection or composable `IQueryable`.

**Cache invalidation, not cache expiry.** Public GETs are output-cached with resource
tags. CMS commands evict the tags they touched, so an edit is live on the next request
instead of after the TTL — the difference between a CMS that feels broken and one that
doesn't.

**Content is resolved at request time, not baked at build.** The case-study route has no
`generateStaticParams`, because pinning the slug list at build would 404 any project
added through the CMS until the next deploy. Two cache layers make it a cache read.

**Recruiter Mode is painted before hydration.** A tiny blocking script stamps
`data-recruiter` on `<html>` from a cookie. Reading the cookie during SSR would have
been simpler but forces every page out of Next's static shell.

**MediatR is pinned to 12.5.0** — the last Apache-2.0 release. 13+ requires a commercial
licence key.

**Transitive security pins.** `Microsoft.OpenApi` (.NET) and `postcss` / `sharp` /
`js-yaml` / `brace-expansion` (npm) are pinned forward past known advisories. npm's own
`audit fix --force` proposed downgrading Next.js to 9.3.3; that is not a fix. Both
ecosystems currently report zero advisories.

---

## Common tasks

```bash
dotnet build Chronicle.slnx           # whole solution, warnings are errors
dotnet test  Chronicle.slnx           # includes the architecture tests
npm run build                         # in the client directory
npm run gen:types                     # regenerate client types from the live OpenAPI doc

# add a migration
dotnet dotnet-ef migrations add <Name> \
  --project src/Chronicle.Infrastructure \
  --startup-project src/Chronicle.Infrastructure \
  --output-dir Data/Migrations
```

### Using a database container

Once Docker or Podman is installed:

```bash
cd src/Chronicle.AppHost
dotnet user-secrets set "Chronicle:UseContainerDb" "true"
```

Aspire then manages PostgreSQL itself and the connection string secret is unnecessary.

---

## Status

**API — complete for Phase 1.** `projects`, `experience`, `skills`, `posts`,
`learning`, `roadmap`, `certifications`, `status`, `timeline`, `github/stats` and
`contact`. All cached, tagged and rate-limited; browse them at `/scalar/v1`.

**Public site — every route is real.** Mission Control, About, Skills, Timeline,
Projects and case studies, Knowledge Core and articles, Engineering Analytics, the
printable résumé, and a working contact form. Light/dark theming, Recruiter Mode and
responsive navigation apply throughout. Link previews are generated, and pages carry
JSON-LD.

**Admin CMS** — Identity sign-in, plus editing for projects, articles and the status
strip. Saving evicts the matching cache tag, so a change is live on the next request
rather than after a TTL — there is an integration test that asserts exactly that.

**Still to come:** media storage and the admin storage gauge, deeper use of `jsonb`,
full-text article search, and a final pass over UI, UX and animation now that every
surface is real. Then deployment. Software City stays a separate repository.

| Document | What it covers |
|---|---|
| [`docs/user-guide.md`](docs/user-guide.md) | The application in plain language, for the people who use it |
| [`docs/content-template.md`](docs/content-template.md) | Fill this in to replace the demo persona with real content |
| [`docs/deployment.md`](docs/deployment.md) | Hosting, domains, storage, email — what it costs and what to buy |
| [`docs/technical-decisions.md`](docs/technical-decisions.md) | The decisions that were expensive to make, and why |
| [`docs/roadmap.md`](docs/roadmap.md) | The day-by-day plan |

> The content is currently a fictional engineer, **Sam Iversen**, so the application is
> coherent end to end before real content exists. See `docs/content-template.md`.

## Contributing

Work happens on `development` and reaches `main` by pull request. Before pushing:

```bash
dotnet build Chronicle.slnx && dotnet test Chronicle.slnx
cd src/Chronicle.Portfolio/Chronicle.Portfolio.Client
npm run lint && npm run typecheck && npm run build
```

Run all three npm scripts — `next build` uses Turbopack and does not invoke ESLint, so a
green build says nothing about lint.

**Software City** ships from its own repository. This one owes it a versioned
`career-graph` contract — see [`docs/software-city-concept.md`](docs/software-city-concept.md).

Build order and acceptance criteria live in
[`docs/implementation-spec.md`](docs/implementation-spec.md).
