using Chronicle.Domain.Entities;
using Chronicle.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Chronicle.Infrastructure.Data;

/// <summary>
/// Development seed data: one complete, fictional engineer.
/// </summary>
/// <remarks>
/// <para>
/// <b>Sam Iversen is not a real person.</b> Every date, employer, credential and article
/// here is invented. The persona exists so the application is demonstrable to anyone
/// before the owner's real history is entered, and so every feature has something honest
/// to render.
/// </para>
/// <para>
/// It is deliberately <i>coherent</i> rather than merely populated. Roles, projects and
/// certifications share the same skills and overlapping dates, because the timeline
/// derives its connections from exactly those relationships — data that did not line up
/// would make the page look broken while the code was working correctly. One project
/// fills every optional case-study field and another leaves them null, so both the full
/// and the hide-empty-sections paths are exercised.
/// </para>
/// <para>
/// Seeding is skipped entirely once any project exists, so this can never overwrite real
/// content. Replace it through the admin CMS.
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
        var payments = NewTag("Payments", "payments", "domain");
        context.Tags.AddRange(backend, database, frontend, devops, architecture, payments);

        // ---- Skills ----
        var csharp = NewSkill("C#", SkillCategory.Backend, 4.0m, ProficiencyLevel.Advanced, 0);
        var dotnet = NewSkill(".NET", SkillCategory.Backend, 4.0m, ProficiencyLevel.Advanced, 1);
        var aspnet = NewSkill("ASP.NET Core", SkillCategory.Backend, 3.5m, ProficiencyLevel.Advanced, 2);
        var typescript = NewSkill("TypeScript", SkillCategory.Frontend, 2.5m, ProficiencyLevel.Proficient, 0);
        var react = NewSkill("React", SkillCategory.Frontend, 2.0m, ProficiencyLevel.Working, 1);
        var nextjs = NewSkill("Next.js", SkillCategory.Frontend, 1.5m, ProficiencyLevel.Working, 2);
        var postgres = NewSkill("PostgreSQL", SkillCategory.Database, 3.0m, ProficiencyLevel.Advanced, 0);
        var sqlserver = NewSkill("SQL Server", SkillCategory.Database, 3.5m, ProficiencyLevel.Proficient, 1);
        var efcore = NewSkill("EF Core", SkillCategory.Database, 3.0m, ProficiencyLevel.Advanced, 2);
        var redis = NewSkill("Redis", SkillCategory.Database, 1.5m, ProficiencyLevel.Working, 3);
        var docker = NewSkill("Docker", SkillCategory.DevOps, 3.0m, ProficiencyLevel.Proficient, 0);
        var actions = NewSkill("GitHub Actions", SkillCategory.DevOps, 2.0m, ProficiencyLevel.Proficient, 1);
        var kubernetes = NewSkill("Kubernetes", SkillCategory.DevOps, 1.5m, ProficiencyLevel.Working, 2);
        var azure = NewSkill("Azure", SkillCategory.Cloud, 2.5m, ProficiencyLevel.Proficient, 0);

        context.Skills.AddRange(
            csharp, dotnet, aspnet, typescript, react, nextjs,
            postgres, sqlserver, efcore, redis, docker, actions, kubernetes, azure);

        // ---- Projects ----
        // Flagship: every optional section populated, so the full case-study template renders.
        var ledger = new Project
        {
            Title = "Core Banking Ledger",
            Slug = "core-banking-ledger",
            Pitch = "A double-entry ledger that stays correct under concurrent posting.",
            Problem =
                "Balances were derived by summing every transaction on read. As volume grew, "
                + "statement queries slowed from milliseconds to seconds — and worse, two transfers "
                + "posted in the same instant could each read a stale balance and both succeed, "
                + "leaving an account overdrawn that should not have been.",
            Solution =
                "Moved to an append-only double-entry journal with periodic balance snapshots. "
                + "A read hits the newest snapshot plus the journal entries after it, so producing a "
                + "statement is bounded work regardless of how old the account is.",
            KeyDecisions =
                "**Append-only over mutable balances.** A mutable balance column is one bad UPDATE "
                + "away from money that cannot be explained. An immutable journal means every balance "
                + "is reproducible from history, which turns an incident from a mystery into a query.\n\n"
                + "**Snapshots over recomputing from zero.** Pure event sourcing would have left reads "
                + "unbounded — fine at launch, unusable after five years. Snapshotting trades a little "
                + "storage for predictable reads.\n\n"
                + "**Serializable isolation on the posting path only.** Correctness where money moves, "
                + "cheaper isolation everywhere else. Applying it globally would have cost throughput "
                + "for no benefit.",
            ArchitectureNotes =
                "Postings enter through a single command handler that writes both legs of the entry in "
                + "one transaction — there is no code path that can write one without the other. A "
                + "background worker writes per-account snapshots on a schedule. Read queries never "
                + "touch the write path, so a slow report cannot block a payment.",
            Results =
                "- Statement queries: ~2.4s to under 40ms at the 95th percentile\n"
                + "- Zero balance discrepancies in the eighteen months since cutover\n"
                + "- Reconciliation moved from an overnight batch to an on-demand query\n"
                + "- Posting throughput held at ~4,000 transactions per second",
            LessonsLearned =
                "The hard part was never the ledger — it was the migration. Proving the new balances "
                + "matched the old ones for every account, before switching reads over, mattered more "
                + "than any amount of unit testing. Shadow-reading both paths in production for two "
                + "weeks found three edge cases that no test had.\n\n"
                + "I would also start the snapshot worker earlier next time. It was treated as an "
                + "optimisation and built last, which meant the first load test measured the wrong thing.",
            StartDate = new DateOnly(2023, 8, 1),
            EndDate = new DateOnly(2024, 10, 31),
            Featured = true,
            SortOrder = 0,
            Tags = [backend, database, architecture, payments],
            TechStack = [csharp, dotnet, postgres, efcore, redis]
        };
        ledger.Screenshots.Add(new Media
        {
            Url = "https://placehold.co/1200x720/0E1420/F2F4F6?text=Posting+path+and+snapshot+worker",
            Caption = "The posting path and the snapshot worker",
            SortOrder = 0
        });

        var reconciliation = new Project
        {
            Title = "Reconciliation Engine",
            Slug = "reconciliation-engine",
            Pitch = "Matching two ledgers that disagree, without a human reading spreadsheets.",
            Problem =
                "Every morning someone exported the internal ledger and the scheme settlement file "
                + "and matched them by hand. It took two hours, and the errors it found were a day old.",
            Solution =
                "A matching engine that treats reconciliation as a search problem: exact matches first, "
                + "then progressively looser strategies with a confidence score, and only genuine "
                + "ambiguity reaching a person.",
            KeyDecisions =
                "**Strategies as an ordered pipeline, not one clever algorithm.** Each strategy is small "
                + "enough to reason about and can be disabled independently when it misbehaves.\n\n"
                + "**Everything unmatched is surfaced, never silently dropped.** A reconciliation tool "
                + "that hides what it cannot explain is worse than no tool at all.",
            Results =
                "- Manual review: two hours a day to roughly ten minutes\n"
                + "- 98.6% matched automatically on the first pass\n"
                + "- Breaks surfaced within minutes of settlement rather than the next morning",
            StartDate = new DateOnly(2025, 1, 15),
            Featured = true,
            SortOrder = 1,
            Tags = [backend, database, payments],
            TechStack = [csharp, dotnet, postgres, azure, kubernetes]
        };

        // Minimal on purpose: optional sections left null, so the hide-empty-sections path
        // is exercised as well as the full one.
        var chronicle = new Project
        {
            Title = "Chronicle",
            Slug = "chronicle",
            Pitch = "The .NET backend and Next.js frontend behind this site.",
            Problem =
                "A portfolio that is a static page says nothing about whether its author can build "
                + "and run a system.",
            Solution =
                "Built it as a product instead: Clean Architecture over .NET 10, an Identity-protected "
                + "CMS, a cached read-only API, and a Next.js frontend — orchestrated with .NET Aspire.",
            GithubUrl = "https://github.com/Vinuka-Osura/Chronicle",
            StartDate = new DateOnly(2026, 6, 1),
            Featured = true,
            SortOrder = 2,
            Tags = [backend, frontend, architecture],
            TechStack = [csharp, dotnet, aspnet, typescript, nextjs, postgres]
        };

        var statements = new Project
        {
            Title = "Statement Delivery Pipeline",
            Slug = "statement-delivery-pipeline",
            Pitch = "Scheduled statement generation and delivery for 40,000 accounts.",
            Problem = "Monthly statements were generated by hand and posted in batches that often slipped.",
            Solution = "A queue-backed worker that renders, stores and delivers statements idempotently.",
            Results =
                "- Month-end run: six hours to twenty-five minutes\n"
                + "- Re-runs are safe; delivery is exactly-once per account",
            StartDate = new DateOnly(2022, 11, 1),
            EndDate = new DateOnly(2023, 6, 30),
            SortOrder = 3,
            Tags = [backend, devops],
            TechStack = [csharp, dotnet, sqlserver, docker]
        };

        context.Projects.AddRange(ledger, reconciliation, chronicle, statements);

        // ---- Experience ----
        context.Experiences.AddRange(
            new Experience
            {
                Role = "Software Engineer",
                Company = "Northwind Payments",
                StartDate = new DateOnly(2024, 4, 1),
                Summary =
                    "Backend work on the payments platform, focused on correctness under load and on "
                    + "the reconciliation tooling that sits behind it.",
                Highlights =
                [
                    "Designed and shipped the double-entry ledger now used for every account posting",
                    "Cut statement query latency by roughly 98% at the 95th percentile",
                    "Replaced a two-hour daily manual reconciliation with an automated engine",
                    "Introduced integration testing against a real database, retiring a mock-heavy suite"
                ],
                SortOrder = 0,
                TechStack = [csharp, dotnet, aspnet, postgres, efcore, azure, kubernetes]
            },
            new Experience
            {
                Role = "Junior Software Engineer",
                Company = "Northwind Payments",
                StartDate = new DateOnly(2022, 7, 4),
                EndDate = new DateOnly(2024, 3, 31),
                Summary =
                    "Joined as a graduate engineer working across internal services, reporting and the "
                    + "month-end batch.",
                Highlights =
                [
                    "Automated month-end statement delivery, removing a recurring manual process",
                    "Took ownership of the reporting service's CI pipeline",
                    "Wrote the team's first containerised local development setup"
                ],
                SortOrder = 1,
                TechStack = [csharp, dotnet, sqlserver, docker, actions]
            });

        // ---- Certifications ----
        // Skills links are what make a certification a node with outgoing edges on the
        // timeline: CKAD -> certifies Kubernetes -> used in Reconciliation Engine.
        context.Certifications.AddRange(
            new Certification
            {
                Name = "Microsoft Certified: Azure Fundamentals (AZ-900)",
                Issuer = "Microsoft",
                IssueDate = new DateOnly(2023, 5, 19),
                SortOrder = 0,
                Skills = [azure]
            },
            new Certification
            {
                Name = "Microsoft Certified: Azure Developer Associate (AZ-204)",
                Issuer = "Microsoft",
                IssueDate = new DateOnly(2024, 9, 6),
                SortOrder = 1,
                Skills = [azure, csharp]
            },
            new Certification
            {
                Name = "Certified Kubernetes Application Developer (CKAD)",
                Issuer = "The Linux Foundation",
                IssueDate = new DateOnly(2025, 6, 24),
                SortOrder = 2,
                Skills = [kubernetes, docker]
            });

        // ---- Eras: the named chapters ----
        context.Eras.AddRange(
            new Era
            {
                Name = "Learning",
                Tagline = "University, side projects, and finding out what this job actually is.",
                StartDate = new DateOnly(2019, 9, 1),
                EndDate = new DateOnly(2022, 6, 30),
                SortOrder = 0
            },
            new Era
            {
                Name = "Finding My Feet",
                Tagline = "First production code, and learning what breaks when real people use it.",
                StartDate = new DateOnly(2022, 7, 1),
                EndDate = new DateOnly(2024, 3, 31),
                SortOrder = 1
            },
            new Era
            {
                Name = "Payments at Scale",
                Tagline = "Building things that are not allowed to be wrong.",
                StartDate = new DateOnly(2024, 4, 1),
                EndDate = null,
                SortOrder = 2
            },
            new Era
            {
                Name = "What Comes Next",
                Tagline = "Ownership, design, and the parts of the job that are not code.",
                StartDate = new DateOnly(2027, 1, 1),
                EndDate = null,
                SortOrder = 3
            });

        // ---- Milestones: the life track ----
        context.Milestones.AddRange(
            new Milestone
            {
                Title = "BSc Computer Science",
                Description =
                    "Three years of fundamentals, and a final-year project on distributed consensus "
                    + "that was far too ambitious and taught me more for it.",
                Date = new DateOnly(2019, 9, 23),
                EndDate = new DateOnly(2022, 6, 17),
                Category = MilestoneCategory.Education,
                SortOrder = 0
            },
            new Milestone
            {
                Title = "First code in production",
                Description =
                    "A month-end batch job. It ran untouched for two years, which I have since learned "
                    + "is the highest praise a piece of software gets.",
                Date = new DateOnly(2022, 9, 12),
                Category = MilestoneCategory.Personal,
                SortOrder = 1
            },
            new Milestone
            {
                Title = "Talk: keeping a ledger honest",
                Description =
                    "An internal engineering session on why balances should be derived rather than "
                    + "stored, and what it costs to get that wrong.",
                Date = new DateOnly(2024, 11, 21),
                Category = MilestoneCategory.Community,
                SortOrder = 2
            },
            new Milestone
            {
                // Deliberately today's month and day, one year back, so the timeline's
                // "on this day" line has something real to show in a demo.
                Title = "Spoke at a local .NET meetup",
                Description =
                    "Forty minutes on reconciliation as a search problem, to a room that asked much "
                    + "better questions than I expected.",
                Date = new DateOnly(2025, 7, 30),
                Category = MilestoneCategory.Community,
                SortOrder = 3
            },
            new Milestone
            {
                Title = "First open-source contribution merged",
                Description = "A small fix to a .NET library I had been depending on for two years.",
                Date = new DateOnly(2025, 8, 14),
                Category = MilestoneCategory.Recognition,
                SortOrder = 4
            });

        // ---- Posts ----
        context.Posts.AddRange(
            new Post
            {
                Title = "Why I stopped wrapping EF Core in a repository",
                Slug = "why-i-stopped-wrapping-ef-core",
                Excerpt =
                    "DbContext is already a repository and a unit of work. Wrapping it costs more than it saves.",
                BodyMarkdown =
                    "## The pattern everyone copies\n\n"
                    + "Almost every Clean Architecture tutorial puts an `IRepository<T>` over EF Core. "
                    + "I did it too, for about two years.\n\n"
                    + "## What it actually costs\n\n"
                    + "`DbSet<T>` already implements the repository pattern, and `DbContext` already "
                    + "implements unit of work. A wrapper over them gives up `Include`, projection, and "
                    + "composable `IQueryable` — and those are the reasons to use an ORM at all.\n\n"
                    + "The version I regret most had eleven methods on it, nine of which existed because "
                    + "some caller needed one more shape of query.\n\n"
                    + "## What I do instead\n\n"
                    + "Expose the `DbSet<T>`s behind an interface the application layer owns. Handlers "
                    + "stay testable, infrastructure stays swappable, and queries stay fast.",
                ReadingTimeMinutes = 4,
                IsPublished = true,
                PublishedAt = new DateTimeOffset(2025, 5, 12, 9, 0, 0, TimeSpan.Zero),
                Tags = [backend, database, architecture]
            },
            new Post
            {
                Title = "Snapshotting a ledger without giving up auditability",
                Slug = "snapshotting-a-ledger",
                Excerpt = "How to keep balance reads bounded when the journal is append-only.",
                BodyMarkdown =
                    "## The tension\n\n"
                    + "An append-only journal is wonderful for audit and terrible for reads: every "
                    + "balance means summing the account's entire history.\n\n"
                    + "## Snapshots\n\n"
                    + "Write a periodic balance snapshot per account. A read becomes "
                    + "`latest snapshot + entries since` — bounded work no matter how old the account.\n\n"
                    + "## The part that bites\n\n"
                    + "Snapshots must be derivable, never authoritative. If a snapshot and the journal "
                    + "disagree, the journal wins and the snapshot is rebuilt. The moment you let a "
                    + "snapshot be the source of truth, you have reinvented the mutable balance column "
                    + "you were trying to escape.",
                ReadingTimeMinutes = 6,
                IsPublished = true,
                PublishedAt = new DateTimeOffset(2025, 11, 2, 9, 0, 0, TimeSpan.Zero),
                Tags = [database, architecture, payments]
            },
            new Post
            {
                Title = "Reconciliation is a search problem",
                Slug = "reconciliation-is-a-search-problem",
                Excerpt =
                    "Stop writing one clever matching algorithm. Write several dull ones and order them.",
                BodyMarkdown =
                    "## The trap\n\n"
                    + "The instinct is to write the smartest possible matcher. It works on the examples "
                    + "you had when you wrote it, and nobody can safely change it afterwards.\n\n"
                    + "## Strategies in order\n\n"
                    + "Exact match on reference. Then amount and date. Then amount within a tolerance "
                    + "and a date window. Each one is small enough to reason about, and each carries a "
                    + "confidence score.\n\n"
                    + "## Never drop anything\n\n"
                    + "Whatever survives every strategy goes to a human, with the reasons it failed. A "
                    + "reconciliation tool that quietly hides what it cannot explain is worse than none.",
                ReadingTimeMinutes = 5,
                IsPublished = true,
                PublishedAt = new DateTimeOffset(2026, 4, 18, 9, 0, 0, TimeSpan.Zero),
                Tags = [backend, payments, architecture]
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
                Topic = "Kubernetes operators",
                Note = "CKAD covered using the platform; this is about extending it.",
                Status = LearningStatus.Exploring,
                ProgressPercent = 20,
                SortOrder = 1
            },
            new LearningItem
            {
                Topic = ".NET Aspire",
                Note = "Using it to orchestrate this site's stack locally.",
                Status = LearningStatus.Comfortable,
                ProgressPercent = 75,
                SortOrder = 2
            },
            new LearningItem
            {
                Topic = "Rust",
                Note = "Reading the book. No production use yet — here for honesty, not decoration.",
                Status = LearningStatus.Exploring,
                ProgressPercent = 15,
                SortOrder = 3
            });

        // ---- Roadmap: rendered below the timeline's today marker ----
        context.RoadmapItems.AddRange(
            new RoadmapItem
            {
                Title = "Lead a system design from blank page to production",
                Description = "Not just implement a design — be accountable for the tradeoffs in it.",
                TargetDate = new DateOnly(2027, 6, 1),
                Status = RoadmapStatus.InProgress,
                SortOrder = 0
            },
            new RoadmapItem
            {
                Title = "Mentor a graduate engineer through their first year",
                Description = "The part of seniority that has nothing to do with code.",
                TargetDate = new DateOnly(2027, 9, 1),
                Status = RoadmapStatus.Planned,
                SortOrder = 1
            },
            new RoadmapItem
            {
                Title = "Senior Software Engineer",
                Description = "Own a system end to end, including its design, its on-call and its juniors.",
                TargetDate = new DateOnly(2028, 1, 1),
                Status = RoadmapStatus.Planned,
                SortOrder = 2
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
        Message = "Seeding sample content for the demo persona (content tables were empty).")]
    private static partial void LogSeeding(ILogger logger);
}
