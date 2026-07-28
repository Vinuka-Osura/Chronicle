# Chronicle — working conventions

Read this before changing code. `docs/implementation-spec.md` is the product spec;
this file is how the code is actually organised, and it wins where the two disagree.

## Shape

One solution (`Chronicle.slnx`), .NET 10, dependencies pointing inwards only:

```
AppHost ──▶ Portfolio.Server ──▶ Application + Infrastructure + ServiceDefaults
                                 Infrastructure ──▶ Application ──▶ Domain
```

- `Chronicle.Domain` — entities and enums. **Zero package and project references.**
  `Chronicle.Domain.Tests` parses the csproj and fails the build if that changes. If
  something needs a package, it belongs in Application.
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

**Constraints go in EF configurations, not DataAnnotations.** One
`IEntityTypeConfiguration<T>` per entity under `Infrastructure/Data/Configurations`.
The domain stays free of persistence concerns.

**Warnings are errors.** Including analyzer rules. Two standing suppressions, both
scoped and both commented at the point of use: `CA1707` for underscored test names, and
`ASPIREJAVASCRIPT001` for the experimental `AddNextJsApp`.

**Logging uses `[LoggerMessage]` source generation** (CA1848). The generator cannot emit
into a generic type, so generic classes delegate to a non-generic holder — see
`BehaviourLog`.

## Naming and layout conventions

### Commit messages

```
(Type) - short imperative summary

Body explaining why, wrapped at ~88 columns.
```

`Type` is the kind of work: `Feat`, `Bug Fix`, `Test`, `Refactor`, `Docs`, `Build`,
`Chore`, `Perf`, `Style`. Capitalised, in brackets, followed by a space-hyphen-space.

### Database tables

Tables are **`<domain>_<plural_entity>`, lowercase snake_case**, so the schema groups
itself by domain instead of sprawling into a flat alphabetical list. The C# entity keeps
its singular PascalCase name; only the table is renamed, via `ToTable()` in that
entity's configuration.

| Domain prefix | Holds |
|---|---|
| `portfolio_` | the work — projects, experience, media, and their joins |
| `profile_` | the person — skills, certifications, roadmap items |
| `knowledge_` | posts and learning items |
| `shared_` | cross-cutting reference data, currently just tags |
| `site_` | singletons — site status, GitHub stats cache |

```
entity Project      -> portfolio_projects
entity LearningItem -> knowledge_learning_items
entity Tag          -> shared_tags
Project <-> Tag     -> portfolio_project_tags
```

Identity keeps its own `identity` schema and its default table names — those are ASP.NET
Core's, not ours.

Columns stay PascalCase (EF Core's default). Mixing snake_case tables with PascalCase
columns is a deliberate, contained trade: renaming columns too would mean either a
naming-convention package or an entry per property, and the prefix already delivers the
grouping this was for.

### Per-feature seeders

Every feature owns a seeder under `Infrastructure/Data/Seeding/`, registered in
`FeatureSeeders`. **They ship empty on purpose** — the hook exists so real initial data
has an obvious home the day it is needed, rather than being wedged into whatever file is
nearest. Seeders must be idempotent: they run on every start, in every environment.

`SampleContent` is different and stays separate — it is throwaway development data and
only runs when the content tables are empty.

### Frontend feature folders

Everything a feature owns lives with it. Only genuinely shared things go up a level.

```
src/app/<feature>/
  page.tsx           the route
  api.ts             that feature's typed fetchers, with use cache + cacheTag
  components/        components only this feature uses
  [slug]/page.tsx    nested routes as needed

src/lib/http.ts      shared fetch wrapper — the ONE place the base URL is read
src/lib/types.ts     shared DTO types
src/components/      used by three or more features (SiteHeader, Footer, Markdown)
```

Promote a component out of a feature folder only once a third feature needs it. Two
users is a coincidence; three is a pattern.

### Navigation

Every route is reachable from the header, every link uses `next/link` (never a bare
`<a>` for internal routes, which would cost a full page load), and the active route is
always marked with `aria-current="page"`. A visitor should never reach a dead end or
have to use the back button to continue.

## Adding a feature slice

Copy the Projects slice; it is the reference pattern.

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

Then map the endpoint group in `Program.cs` and add the route to the header's `links`.

**Read handlers project inside the query.** `.Select(x => new Dto(...))` on the
`IQueryable`, never materialise entities and map afterwards — a card query should not
drag every Markdown column across the wire. Mapping libraries are for commands.

**Every API group is cached and tagged:**

```csharp
.CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(CacheTags.Projects))
.RequireRateLimiting("api")
```

Commands that change that resource must call `IContentCacheInvalidator.EvictAsync` with
the same tag, or the CMS will look broken to whoever just saved.

## Frontend

Next.js 16 differs from earlier versions in ways worth remembering:

- **`fetch` is not cached by default.** Caching is explicit — `use cache` plus
  `cacheTag`/`cacheLife` in `src/lib/api.ts`.
- **Cache Components is on** (`cacheComponents: true`). It replaces the ppr/useCache/
  dynamicIO flags and makes PPR the default.
- **`params` and `searchParams` are Promises.** Await them.
- Anything touching `cookies()`, `headers()` or unbaked `params` must sit inside
  `<Suspense>` or it fails the build. This is why Recruiter Mode uses a pre-paint inline
  script instead of reading its cookie during render.
- Tailwind v4 is CSS-first: tokens live in `@theme` in `globals.css`. There is no
  `tailwind.config.ts`.
- `node_modules/next/dist/docs/` ships the docs for this exact version. Prefer it over
  recall.

Content fetchers degrade to an empty result rather than throwing, so `next build` works
without a database — that is the normal case in CI. Do not "fix" this by making them
throw.

## Verifying a change

```bash
dotnet build Chronicle.slnx      # warnings are errors
dotnet test  Chronicle.slnx      # includes the architecture tests
dotnet run --project src/Chronicle.AppHost
```

Then check the dashboard shows all three resources healthy, `/scalar/v1` lists the
endpoint, and — for a CMS change — that saving in `/admin` is visible on the public page
after one refresh, not after 60 seconds.

## Out of scope here

Software City is a **separate repository**. This solution owes it only
`contracts/career-graph.v1.schema.json` and `GET /api/career-graph`, both Phase 2. Do
not add 3D or rendering code to this repo.
