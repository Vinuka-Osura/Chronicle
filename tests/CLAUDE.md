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

## Worth testing

Security guards, always. `SafeReturnUrlTests` is the model: it enumerates the
protocol-relative and absolute-URL cases that a naive relative-URI check lets through.
Anything where getting it wrong is a vulnerability rather than a bug deserves the cases
written out.
