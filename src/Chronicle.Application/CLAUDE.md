# Chronicle.Application — conventions

Use cases, DTOs, validators, and the port interfaces the outer layers implement.

Root conventions: `../../CLAUDE.md`. The full cross-layer feature recipe is there.

## CQRS with MediatR

MediatR is pinned to **12.5.0**, the last Apache-2.0 release. 13+ moved to a commercial
licence requiring a runtime key. Do not bump it without revisiting that.

Handlers are registered by assembly scan in `DependencyInjection.AddApplication()`.

### Pipeline order is deliberate

Registration order is execution order, outermost first:

1. `UnhandledExceptionBehaviour` — outermost, so it sees failures from every stage below
2. `PerformanceBehaviour` — times validation plus handler, which is what a caller waits for
3. `ValidationBehaviour` — last, so an invalid request never reaches the handler

## Persistence: `IChronicleDbContext`, and no repository

**There is deliberately no generic `IRepository<T>`.** EF Core's `DbContext` already is
a repository and a unit of work; wrapping it costs `Include`, projection and composable
`IQueryable` — the things that make an ORM worth using.

`IChronicleDbContext` exposes the `DbSet<T>`s directly. Handlers stay testable and
Infrastructure stays swappable, which is what the abstraction was actually for.

This means Application references `Microsoft.EntityFrameworkCore`. That is a known,
accepted trade in Clean Architecture: the Domain stays pure, and this layer gets a
usable query API.

## Read handlers project inside the query

`.Select(x => new Dto(...))` on the `IQueryable`. **Never materialise entities and map
afterwards** — a card query should not drag every Markdown case-study column across the
wire to render a card that displays none of them. Mapping libraries are for commands.

Always `.AsNoTracking()` on reads.

When a projection genuinely will not translate — combining two different joins, for
instance — project into an anonymous shape first and finish in memory, and say in a
comment why. `GetSkillsQueryHandler` is the worked example.

## Filters that protect data belong in the handler

`GetPostsQueryHandler` filters unpublished drafts itself rather than trusting callers to
remember. A rule that can be forgotten at the call site will be.

Where something is hidden rather than forbidden, return **404, not 403** — the public
API should not confirm that a draft exists at a given slug.

## Degrade rather than throw, where the page can survive it

A missing singleton row is a seeding gap, not a client error: `GetSiteStatusQuery`
returns an honest placeholder instead of a 500, because the home page is not worth
failing over a status line. A genuinely absent resource still throws `NotFoundException`.

## Logging

**`[LoggerMessage]` source generation** (CA1848), never the `ILogger.LogX(...)`
extension methods, which box their arguments.

The generator cannot emit into a generic type, so generic classes delegate to a
non-generic holder — see `BehaviourLog`, which the pipeline behaviours call into.

## Ports live here

`IGitHubService`, `IEmailService`, `IMediaStorage`, `ICopilotService`,
`IDateTimeProvider` and `IContentCacheInvalidator` are interfaces this layer owns and
Infrastructure or the host implements. They are ports, not domain — they describe things
the application needs done, not things the business is.

Take `IDateTimeProvider` rather than `DateTimeOffset.UtcNow` anywhere behaviour depends
on the clock, so it stays deterministic under test.

## Cache tags

`CacheTags` lives here, beside `IContentCacheInvalidator`, so the endpoints that set a
tag and the commands that evict it share one vocabulary rather than two string literals
that can drift.
