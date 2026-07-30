# Tests — conventions

Root conventions: `../CLAUDE.md`.

## Layout

| Project | Scope |
|---|---|
| `Chronicle.Domain.Tests` | the architecture rules — that the domain stays dependency-free |
| `Chronicle.Application.Tests` | validators, mappers, pure projection logic — anything testable without a database |
| `Chronicle.Portfolio.Server.IntegrationTests` | anything needing real SQL or the real host |

Shared packages and settings live in `tests/Directory.Build.props`, so an individual
test csproj is only its project references.

## Naming

`Method_scenario_expectation`, with underscores. **`CA1707` is suppressed for test
projects only**, in `tests/Directory.Build.props` — it is an API-surface rule and test
methods are not API. It stays enforced everywhere in `src/`.

`Shouldly` and `Xunit` are global usings; do not import them per file.

## The architecture tests are load-bearing

`ArchitectureTests` parses `Chronicle.Domain.csproj` as XML and fails if a
`PackageReference` or `ProjectReference` ever appears, and separately asserts the
compiled assembly references only framework assemblies.

**Do not weaken these to make a change compile.** They are the only thing standing
between the layering and a slow drift into mud. If the domain seems to need a
dependency, the behaviour belongs in `Chronicle.Application`.

The csproj path is passed in as `AssemblyMetadata` from the test project's csproj, so
the test does not have to guess where the repository root is.

## Where a handler test belongs

Application tests cover what needs no database. **Anything touching EF goes in the
integration project against real PostgreSQL** — the schema uses Postgres-specific types
(`jsonb`) that SQLite and the EF in-memory provider cannot honour faithfully, so a test
passing against them would prove nothing about production.

Integration tests use `WebApplicationFactory` against a `chronicle_test` database, reset
between tests with `Respawn`. **Testcontainers is not an option** — there is no container
runtime on the development machine.

## Running the integration tests

`ChronicleTestHost` creates `chronicle_test` if it does not exist, migrates it, and
Respawns the content tables before each test. It runs as `Testing`, not `Development`,
so the Sam Iversen sample content does **not** seed — a test that needs content creates
exactly what it asserts on, which is the difference between documenting behaviour and
documenting the seed data.

**The connection string comes from `CHRONICLE_TEST_DB`, never from a literal in the
file.** This repository is public, and a connection string committed to it is a
credential published to the internet — including a local one, because people reuse
passwords. The fallback is the stock `postgres`/`postgres` pair, so a default install
runs the suite with nothing configured:

```powershell
$env:CHRONICLE_TEST_DB = "Host=localhost;Port=5432;Database=chronicle_test;Username=postgres;Password=..."
dotnet test Chronicle.slnx
```

`site_status` and `site_github_stats_cache` are in Respawn's ignore list. They are
seeded singletons pinned by a check constraint, so deleting them would leave the
database in a state the application does not consider valid.

**`ContentPublishingTests` is the one that matters.** It asserts the CMS's central
promise — save, reload the public endpoint, see the change — with no delay and no
cache-buster. If tag eviction ever breaks, an editor sees stale content with no way to
tell whether their save worked, and this is the only place that catches it: the output
cache is host middleware, invisible to a handler unit test.

It has already earned its place. It caught `Taxonomy` matching tag and skill names
case-sensitively *in SQL* while folding case in memory — so "ef core" fetched nothing,
created a rival tag, and hit the unique index. That bug is invisible without a real
database.

## Worth testing

Security guards, always. `SafeReturnUrlTests` is the model: it enumerates the
protocol-relative and absolute-URL cases that a naive relative-URI check lets through.
Anything where getting it wrong is a vulnerability rather than a bug deserves the cases
written out.
