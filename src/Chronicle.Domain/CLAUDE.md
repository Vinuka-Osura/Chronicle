# Chronicle.Domain — conventions

The innermost layer. Entities and enums over the BCL, and nothing else.

Root conventions: `../../CLAUDE.md`.

## Zero dependencies, and it is enforced

**This project must have no `PackageReference` and no `ProjectReference`.**
`Chronicle.Domain.Tests` parses the csproj and fails the build if either appears, and
also asserts the compiled assembly references only framework assemblies. The rule is
checked, not trusted.

If something here seems to need a package, the behaviour belongs in
`Chronicle.Application` instead. A domain that depends on nothing can be reasoned about
on its own, and it is the one layer where that is achievable.

## No persistence concerns

**No DataAnnotations.** No `[Required]`, no `[MaxLength]`, no `[Column]`. Every length,
index, relationship and constraint lives in that entity's `IEntityTypeConfiguration<T>`
under `Infrastructure/Data/Configurations`.

The entity says what the thing *is*. The configuration says how it is stored. Keeping
those apart means the domain does not change when the database does.

## Entity shape

- Derive from `AuditableEntity` for anything the CMS creates or edits — it carries
  `CreatedAt` and `UpdatedAt`, stamped automatically by an interceptor. Do not set them
  by hand.
- Derive from `Entity` only where audit timestamps would be misleading. `GitHubStatsCache`
  is the example: its `FetchedAt` means "when we last called GitHub", which is a domain
  fact rather than an audit trail.
- `Guid` primary keys, generated in the constructor via `Guid.CreateVersion7()`, so a
  graph can be built and wired up in memory before it is ever saved. Version 7 is
  time-ordered, which keeps index locality sane.
- Collections are `ICollection<T>` initialised to an empty list, so navigation properties
  are never null.
- Markdown fields are plain `string`. They are stored raw and sanitised at render time.

## Single-row entities

`SiteStatus` and `GitHubStatsCache` are singletons. Each exposes a fixed
`public static readonly Guid SingletonId`, and its configuration adds a check constraint
pinning the primary key to that value.

The constraint is the point: the admin UI only offers an edit form, but a stray insert
from a migration or a console would otherwise leave two rows and an ambiguous answer to
"what is the current status?".

## Enums

Stored as `int`, serialised as strings by `JsonStringEnumConverter`. Give explicit
values, and where the number carries meaning make it match — `ProficiencyLevel` starts
at 1 so the stored int reads the same as the 1-5 level shown in the UI meter.
