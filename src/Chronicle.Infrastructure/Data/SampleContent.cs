using Chronicle.Domain.Entities;
using Chronicle.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Chronicle.Infrastructure.Data;

/// <summary>
/// Development seed data.
/// </summary>
/// <remarks>
/// This exists so the frontend can be built against realistically shaped content from
/// day one instead of against empty arrays - one project exercises every optional
/// case-study field, another leaves them null so the "hide empty sections" path is
/// covered too.
/// <para>
/// It is placeholder content, meant to be replaced through the admin CMS. Seeding is
/// skipped entirely once any project exists, so it can never overwrite real content.
/// </para>
/// </remarks>
internal static partial class SampleContent
{
    public static async Task SeedAsync(
        ChronicleDbContext context,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        if (await context.Projects.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        LogSeeding(logger);

        // ---- Tags ----
        var backend = NewTag("Backend", "backend", "domain");
        var database = NewTag("Database", "database", "domain");
        var frontend = NewTag("Frontend", "frontend", "domain");
        var devops = NewTag("DevOps", "devops", "domain");
        var architecture = NewTag("Architecture", "architecture", "topic");
        context.Tags.AddRange(backend, database, frontend, devops, architecture);

        // ---- Skills ----
        var csharp = NewSkill("C#", SkillCategory.Backend, 3.5m, ProficiencyLevel.Advanced, 0);
        var dotnet = NewSkill(".NET", SkillCategory.Backend, 3.5m, ProficiencyLevel.Advanced, 1);
        var aspnet = NewSkill("ASP.NET Core", SkillCategory.Backend, 3.0m, ProficiencyLevel.Advanced, 2);
        var typescript = NewSkill("TypeScript", SkillCategory.Frontend, 2.5m, ProficiencyLevel.Proficient, 0);
        var react = NewSkill("React", SkillCategory.Frontend, 2.0m, ProficiencyLevel.Proficient, 1);
        var nextjs = NewSkill("Next.js", SkillCategory.Frontend, 1.5m, ProficiencyLevel.Working, 2);
        var postgres = NewSkill("PostgreSQL", SkillCategory.Database, 2.5m, ProficiencyLevel.Proficient, 0);
        var sqlserver = NewSkill("SQL Server", SkillCategory.Database, 3.0m, ProficiencyLevel.Advanced, 1);
        var efcore = NewSkill("EF Core", SkillCategory.Database, 3.0m, ProficiencyLevel.Advanced, 2);
        var docker = NewSkill("Docker", SkillCategory.DevOps, 2.0m, ProficiencyLevel.Proficient, 0);
        var actions = NewSkill("GitHub Actions", SkillCategory.DevOps, 1.5m, ProficiencyLevel.Working, 1);
        var azure = NewSkill("Azure", SkillCategory.Cloud, 2.0m, ProficiencyLevel.Working, 0);

        context.Skills.AddRange(
            csharp, dotnet, aspnet, typescript, react, nextjs,
            postgres, sqlserver, efcore, docker, actions, azure);

        // ---- Projects ----
        // Flagship: every optional section populated, so the full case-study template renders.
        var ledger = new Project
        {
            Title = "Core Banking Ledger",
            Slug = "core-banking-ledger",
            Pitch = "A double-entry ledger that stays correct under concurrent posting.",
            Problem =
                "Balances were derived by summing transactions on read. As volume grew, "
                + "statement queries slowed from milliseconds to seconds, and two transfers "
                + "posted in the same instant could each read a stale balance and both succeed.",
            Solution =
                "Moved to an append-only double-entry journal with periodic balance snapshots. "
                + "Reads hit the newest snapshot plus the journal entries after it, so a statement "
                + "is bounded work regardless of account age.",
            KeyDecisions =
                "**Append-only over mutable balances.** A mutable balance column is one bad "
                + "UPDATE away from unexplainable money. An immutable journal means every balance "
                + "is reproducible from history.\n\n"
                + "**Snapshots over recomputing from zero.** Pure event sourcing would have made "
                + "reads unbounded. Snapshotting trades a little storage for predictable reads.\n\n"
                + "**Serializable isolation on the posting path only.** Correctness where money "
                + "moves; cheaper isolation everywhere else.",
            ArchitectureNotes =
                "Postings enter through a single command handler that writes both legs in one "
                + "transaction. A background worker writes snapshots per account. Read queries "
                + "never touch the write path.",
            Results =
                "- Statement queries: ~2.4s to under 40ms at the 95th percentile\n"
                + "- Zero balance discrepancies since the cutover\n"
                + "- Reconciliation went from a nightly batch to an on-demand query",
            LessonsLearned =
                "The hard part was not the ledger, it was the migration: proving the new balances "
                + "matched the old ones for every account before switching reads over. Shadow-reading "
                + "both paths in production for two weeks was worth more than any amount of testing.",
            StartDate = new DateOnly(2024, 3, 1),
            Featured = true,
            SortOrder = 0,
            Tags = [backend, database, architecture],
            TechStack = [csharp, dotnet, postgres, efcore]
        };
        ledger.Screenshots.Add(new Media
        {
            Url = "https://placehold.co/1200x720/0E1420/F2F4F6?text=Ledger+Architecture",
            Caption = "Posting path and snapshot worker",
            SortOrder = 0
        });

        // Minimal: optional sections left null, so the "hide empty sections" path is exercised.
        var chronicle = new Project
        {
            Title = "Chronicle",
            Slug = "chronicle",
            Pitch = "The .NET backend and Next.js frontend behind this portfolio.",
            Problem =
                "A portfolio that is a static page says nothing about whether its author can "
                + "build and run a system.",
            Solution =
                "Built it as a product instead: Clean Architecture over .NET 10, an Identity-protected "
                + "CMS, a cached read-only API, and a Next.js frontend - orchestrated with .NET Aspire.",
            StartDate = new DateOnly(2026, 7, 1),
            Featured = true,
            SortOrder = 1,
            Tags = [backend, frontend, architecture],
            TechStack = [csharp, dotnet, aspnet, typescript, nextjs, postgres]
        };

        var pipeline = new Project
        {
            Title = "Statement Delivery Pipeline",
            Slug = "statement-delivery-pipeline",
            Pitch = "Scheduled statement generation and delivery for 40k accounts.",
            Problem = "Monthly statements were generated by hand and mailed in batches that often slipped.",
            Solution = "A queue-backed worker that renders, stores and delivers statements idempotently.",
            Results = "- Month-end run: 6 hours to 25 minutes\n- Re-runs are safe; delivery is exactly-once per account",
            StartDate = new DateOnly(2023, 9, 1),
            EndDate = new DateOnly(2024, 2, 1),
            SortOrder = 2,
            Tags = [backend, devops],
            TechStack = [csharp, dotnet, sqlserver, docker]
        };

        context.Projects.AddRange(ledger, chronicle, pipeline);

        // ---- Experience ----
        context.Experiences.AddRange(
            new Experience
            {
                Role = "Software Engineer",
                Company = "Banking Systems",
                StartDate = new DateOnly(2025, 1, 1),
                Summary = "Backend work on core banking services, with a focus on correctness under load.",
                Highlights =
                [
                    "Designed and shipped the double-entry ledger now used for all account postings",
                    "Cut statement query latency by ~98% at the 95th percentile",
                    "Introduced integration testing against a real database, replacing mock-heavy suites"
                ],
                SortOrder = 0,
                TechStack = [csharp, dotnet, aspnet, postgres, efcore]
            },
            new Experience
            {
                Role = "Associate Software Engineer",
                Company = "Banking Systems",
                StartDate = new DateOnly(2023, 1, 1),
                EndDate = new DateOnly(2024, 12, 31),
                Summary = "Joined as a graduate engineer working across internal services and reporting.",
                Highlights =
                [
                    "Automated month-end statement delivery, removing a recurring manual process",
                    "Took ownership of the reporting service's CI pipeline"
                ],
                SortOrder = 1,
                TechStack = [csharp, dotnet, sqlserver, docker]
            });

        // ---- Posts ----
        context.Posts.AddRange(
            new Post
            {
                Title = "Why I stopped wrapping EF Core in a repository",
                Slug = "why-i-stopped-wrapping-ef-core",
                Excerpt = "DbContext is already a repository and a unit of work. Wrapping it costs more than it saves.",
                BodyMarkdown =
                    "## The pattern everyone copies\n\n"
                    + "Almost every Clean Architecture tutorial adds `IRepository<T>` over EF Core. "
                    + "I did it too, for about two years.\n\n"
                    + "## What it actually costs\n\n"
                    + "`DbSet<T>` already implements the repository pattern, and `DbContext` already "
                    + "implements unit of work. A wrapper over them gives up `Include`, projection, "
                    + "and composable `IQueryable` - and those are the reasons to use an ORM at all.\n\n"
                    + "## What I do instead\n\n"
                    + "Expose the `DbSet<T>`s behind an interface the application layer owns. "
                    + "Handlers stay testable, infrastructure stays swappable, and queries stay fast.",
                ReadingTimeMinutes = 4,
                IsPublished = true,
                PublishedAt = new DateTimeOffset(2026, 5, 12, 9, 0, 0, TimeSpan.Zero),
                Tags = [backend, database, architecture]
            },
            new Post
            {
                Title = "Snapshotting a ledger without giving up auditability",
                Slug = "snapshotting-a-ledger",
                Excerpt = "How to keep balance reads O(1) when the journal is append-only.",
                BodyMarkdown =
                    "## The tension\n\n"
                    + "An append-only journal is wonderful for audit and terrible for reads: "
                    + "every balance means summing the account's entire history.\n\n"
                    + "## Snapshots\n\n"
                    + "Write a periodic balance snapshot per account. A read becomes "
                    + "`latest snapshot + entries since` - bounded work no matter how old the account is.\n\n"
                    + "## The part that bites\n\n"
                    + "Snapshots must be derivable, never authoritative. If a snapshot and the journal "
                    + "disagree, the journal wins and the snapshot is rebuilt.",
                ReadingTimeMinutes = 6,
                IsPublished = true,
                PublishedAt = new DateTimeOffset(2026, 6, 30, 9, 0, 0, TimeSpan.Zero),
                Tags = [database, architecture]
            });

        // ---- Learning board ----
        context.LearningItems.AddRange(
            new LearningItem
            {
                Topic = "Distributed systems fundamentals",
                Note = "Working through consensus and consistency models properly rather than by folklore.",
                Status = LearningStatus.Learning,
                ProgressPercent = 45,
                SortOrder = 0
            },
            new LearningItem
            {
                Topic = ".NET Aspire",
                Note = "Using it to orchestrate this site's stack locally.",
                Status = LearningStatus.Comfortable,
                ProgressPercent = 70,
                SortOrder = 1
            },
            new LearningItem
            {
                Topic = "Rust",
                Note = "Reading the book. No production use yet - here for honesty, not decoration.",
                Status = LearningStatus.Exploring,
                ProgressPercent = 15,
                SortOrder = 2
            });

        // ---- Roadmap: rendered below the Timeline's "today" marker ----
        context.RoadmapItems.AddRange(
            new RoadmapItem
            {
                Title = "Senior Software Engineer",
                Description = "Own a system end to end, including its design, its on-call and its juniors.",
                TargetDate = new DateOnly(2028, 1, 1),
                Status = RoadmapStatus.Planned,
                SortOrder = 0
            },
            new RoadmapItem
            {
                Title = "Lead a system design from blank page to production",
                Description = "Not just implement a design - be accountable for the tradeoffs in it.",
                TargetDate = new DateOnly(2027, 6, 1),
                Status = RoadmapStatus.InProgress,
                SortOrder = 1
            },
            new RoadmapItem
            {
                Title = "First meaningful open-source contribution",
                Description = "A merged change to a .NET library I actually depend on.",
                TargetDate = new DateOnly(2026, 12, 1),
                Status = RoadmapStatus.InProgress,
                SortOrder = 2
            });

        // ---- Certifications ----
        context.Certifications.AddRange(
            new Certification
            {
                Name = "Microsoft Certified: Azure Fundamentals (AZ-900)",
                Issuer = "Microsoft",
                IssueDate = new DateOnly(2024, 8, 15),
                SortOrder = 0
            },
            new Certification
            {
                Name = "Microsoft Certified: Azure Developer Associate (AZ-204)",
                Issuer = "Microsoft",
                IssueDate = new DateOnly(2025, 11, 3),
                SortOrder = 1
            });
    }

    private static Tag NewTag(string name, string slug, string category) =>
        new() { Name = name, Slug = slug, Category = category };

    private static Skill NewSkill(
        string name,
        SkillCategory category,
        decimal years,
        ProficiencyLevel proficiency,
        int sortOrder) =>
        new()
        {
            Name = name,
            Category = category,
            YearsExperience = years,
            Proficiency = proficiency,
            SortOrder = sortOrder
        };

    [LoggerMessage(EventId = 2100, Level = LogLevel.Information,
        Message = "Seeding sample content (content tables were empty).")]
    private static partial void LogSeeding(ILogger logger);
}
