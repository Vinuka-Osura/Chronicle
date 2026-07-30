# Chronicle.Infrastructure — conventions

EF Core, Npgsql, Identity, migrations, and the implementations of Application's ports.

Root conventions: `../../CLAUDE.md`.

## Constraints live here, not in the domain

**One `IEntityTypeConfiguration<T>` per entity**, under `Data/Configurations`. Every
length, index, relationship, check constraint and column type belongs there. The domain
carries no persistence concerns and no DataAnnotations.

`ChronicleDbContext.OnModelCreating` applies them all with
`ApplyConfigurationsFromAssembly`, so a new configuration is picked up by existing.

## Table naming

Tables are **`<domain>_<plural_entity>`, lowercase snake_case**, set with `ToTable()` in
that entity's configuration. The schema then groups itself by domain instead of
sprawling into a flat alphabetical list. The C# entity keeps its singular PascalCase
name; only the table is renamed.

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

Join tables take the owning domain's prefix, named in `UsingEntity(j => j.ToTable(...))`.

Identity keeps its own `identity` schema and its default table names — those are ASP.NET
Core's, not ours.

Columns stay PascalCase (EF Core's default). Mixing snake_case tables with PascalCase
columns is a deliberate, contained trade: renaming columns too would mean either a
naming-convention package or an entry per property, and the prefix already delivers the
grouping this was for.

Check constraints are named `ck_<table>_<what>`, matching the table's casing.

## Use PostgreSQL properly

It is not a dumb key-value store. `jsonb` where the shape is genuinely open —
`portfolio_experiences.Highlights` and `site_github_stats_cache.PayloadJson` already do
this — plus GIN indexes, generated columns and full-text search where they earn their
place. Planned uses and reasoning: `docs/technical-decisions.md` §2.

Prefer a database-enforced invariant over an application-enforced one. The singleton
check constraints are the pattern: the admin UI would probably be enough, but the
constraint means it does not have to be.

## Audit timestamps

`AuditableEntityInterceptor` stamps `CreatedAt` and `UpdatedAt` on save. An interceptor
rather than a `SaveChanges` override: it is the current EF Core idiom, it composes with
other interceptors, and it keeps the DbContext free of cross-cutting concerns.

It takes `IDateTimeProvider`, so audit stamps stay deterministic under test. **Never
assign those properties by hand.**

The host wires it in, because it needs the service provider — see
`Program.cs`, which registers the DbContext by hand and then calls
`EnrichNpgsqlDbContext` to layer Aspire's health check, retries and tracing on top.

## Per-feature seeders

Every feature owns a seeder under `Data/Seeding/`, registered explicitly in
`FeatureSeeders.All`. Listed rather than assembly-scanned: with a small fixed set, an
explicit list reads better, orders itself, and cannot surprise anyone by picking up a
stray type.

**They ship empty on purpose** — the hook exists so real initial data has an obvious
home the day it is needed, rather than being wedged into whatever file is nearest.

- Seeders must be **idempotent**: they run on every start, in every environment.
- Do **not** call `SaveChangesAsync`. The initialiser saves once after all of them, so
  the whole set lands in a single transaction.
- Use `Order` when one feature's data references another's.

`SampleContent` is different and stays separate — throwaway development data that only
runs when the content tables are empty, so it can never overwrite real content.

## Migrations

```bash
dotnet dotnet-ef migrations add <Name> \
  --project src/Chronicle.Infrastructure \
  --startup-project src/Chronicle.Infrastructure \
  --output-dir Data/Migrations
```

The startup project is Infrastructure itself, not the server:
`ChronicleDbContextFactory` gives the EF tools a connection string they only need to
parse, so migrations can be scaffolded without a reachable database. A migration
describes the model, not any running server.

`--no-build` uses the previously compiled assembly, so **build first after removing a
migration** or the tools will still see the old one.
