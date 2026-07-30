# Chronicle — working conventions

Read this before changing code. `docs/implementation-spec.md` is the product spec;
this file is how the code is actually organised, and it wins where the two disagree.

**These conventions are a tree.** This file holds what applies everywhere. Rules that
only govern one layer live beside that layer's code and load when you work in it:

| File | Covers |
|---|---|
| `src/Chronicle.Domain/CLAUDE.md` | entities, enums, the zero-dependency rule |
| `src/Chronicle.Application/CLAUDE.md` | CQRS handlers, ports, projections, logging |
| `src/Chronicle.Infrastructure/CLAUDE.md` | EF configurations, table naming, seeders, migrations |
| `src/Chronicle.Portfolio/Chronicle.Portfolio.Server/CLAUDE.md` | endpoints, caching, admin and auth |
| `src/Chronicle.Portfolio/Chronicle.Portfolio.Client/CLAUDE.md` | Next.js 16, feature folders, theming |
| `tests/CLAUDE.md` | test naming, architecture tests, the integration database |

If a rule belongs to exactly one layer, put it in that layer's file. If it spans two or
more, it belongs here.

## Shape

One solution (`Chronicle.slnx`), .NET 10, dependencies pointing inwards only:

```
AppHost ──▶ Portfolio.Server ──▶ Application + Infrastructure + ServiceDefaults
                                 Infrastructure ──▶ Application ──▶ Domain
```

- `Chronicle.Domain` — entities and enums. **Zero package and project references.**
- `Chronicle.Application` — MediatR CQRS, DTOs, validators, and the port interfaces.
- `Chronicle.Infrastructure` — EF Core, Npgsql, Identity, migrations, external services.
- `Chronicle.Portfolio.Server` — one host, two surfaces: `/api/*` and `/admin/*`.
- `Chronicle.Portfolio.Client` — Next.js 16 public site.

## Rules that are easy to break by accident

**Never put a `Version` on a `PackageReference`.** Central Package Management is on;
versions live in `Directory.Packages.props` and nowhere else. Adding one is an NU1008
error by design.

**Never commit a secret.** The repository is public. Connection strings, `Admin:*`,
`GitHub:Pat` and `Smtp:*` go in user-secrets locally and deployment secrets in
production. `appsettings.json` holds empty placeholders that document the keys.

**Warnings are errors.** Including analyzer rules. Two standing suppressions, both
scoped and both commented at the point of use: `CA1707` for underscored test names (in
`tests/Directory.Build.props`), and `ASPIREJAVASCRIPT001` for the experimental
`AddNextJsApp` (at its call site in `AppHost.cs`).

**Nothing may cost money.** See `docs/technical-decisions.md` §0. Prefer a service that
cannot bill over one that merely probably will not, and size for what this actually is —
a portfolio with megabytes of content, not an imagined product at scale.

## Commit messages

```
(Type) - short imperative summary

Body explaining why, wrapped at ~88 columns.
```

`Type` is the kind of work: `Feat`, `Bug Fix`, `Test`, `Refactor`, `Docs`, `Build`,
`Chore`, `Perf`, `Style`. Capitalised, in brackets, followed by a space-hyphen-space.

## Branching

Work happens on `development`; `main` takes it by pull request. Never commit directly
to `main`.

## User documentation

`docs/user-guide.md` explains the application to the people who use it — visitors and
the content editor — in plain language, not implementation detail. **A feature is not
finished until its section exists there.** Written alongside the feature rather than in
a documentation sprint at the end, because that is the only time anyone remembers why a
thing behaves the way it does.

Decisions that were expensive to make go in `docs/technical-decisions.md`, with the
reasoning, when they are made.

## Adding a feature slice

Copy the Projects slice; it is the reference pattern. It crosses every layer, so the
recipe lives here — each step's detail is in that layer's own file.

```
Domain/Entities/<Entity>.cs                          POCO, no annotations
Infrastructure/Data/Configurations/<Entity>Configuration.cs
                                                     ToTable("<domain>_<plural>"),
                                                     lengths, indexes, relationships
Infrastructure/Data/Seeding/<Area>Seeder.cs          empty hook, registered in FeatureSeeders

Application/Features/<Area>/Queries/<Name>/
  <Name>Query.cs           record, IRequest<TResponse>
  <Name>QueryHandler.cs    filter IQueryable, project straight to the DTO
  <Name>QueryValidator.cs  optional, runs in ValidationBehaviour
Application/Features/<Area>/<Area>Dtos.cs

Portfolio.Server/Api/Endpoints/<Area>Endpoints.cs    cached group + rate limit

Client/src/app/<area>/api.ts                         fetchers, use cache + cacheTag
Client/src/app/<area>/components/                    feature-local components
Client/src/app/<area>/page.tsx                       the route
```

Then map the endpoint group in `Program.cs`, add the route to the header's `links`, and
write the feature's section in `docs/user-guide.md`.

## Verifying a change

```bash
dotnet build Chronicle.slnx      # warnings are errors
dotnet test  Chronicle.slnx      # includes the architecture tests

# In the client directory. Run ALL THREE - `next build` uses Turbopack and does not
# invoke ESLint, so a build that passes tells you nothing about lint.
npm run lint
npm run typecheck
npm run build

dotnet run --project src/Chronicle.AppHost   # needs the launch profile for user-secrets
```

Then check the dashboard shows all three resources healthy, `/scalar/v1` lists the
endpoint, and — for a CMS change — that saving in `/admin` is visible on the public page
after one refresh, not after 60 seconds.

## Out of scope here

Software City is a **separate repository**. This solution owes it only
`contracts/career-graph.v1.schema.json` and `GET /api/career-graph`, both Phase 2. Do
not add 3D or rendering code to this repo.
