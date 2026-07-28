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

## Adding a feature slice

Copy the Projects slice; it is the reference pattern.

```
Application/Features/<Area>/Queries/<Name>/
  <Name>Query.cs           record, IRequest<TResponse>
  <Name>QueryHandler.cs    filter IQueryable, project straight to the DTO
  <Name>QueryValidator.cs  optional, runs in ValidationBehaviour
Application/Features/<Area>/<Area>Dtos.cs
Portfolio.Server/Api/Endpoints/<Area>Endpoints.cs
```

Then map the group in `Program.cs`.

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
