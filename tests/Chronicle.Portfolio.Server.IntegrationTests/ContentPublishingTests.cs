using System.Net;
using System.Net.Http.Json;
using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Features.Posts.Commands.SavePost;
using Chronicle.Application.Features.Projects.Commands.SaveProject;
using Chronicle.Domain.Entities;
using Chronicle.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Chronicle.Portfolio.Server.IntegrationTests;

/// <summary>
/// The CMS's central promise: press save, reload the public page, see the change.
/// </summary>
/// <remarks>
/// Without cache eviction an editor saves, reloads, still sees the old content, and has
/// no way to tell whether the save failed or the cache is simply stale. That is the
/// failure this file exists to catch, and it can only be caught against the real host -
/// the output cache is host middleware, not something a handler unit test can see.
/// </remarks>
[Collection(ChronicleHostFixture.Name)]
public class ContentPublishingTests(ChronicleTestHost host) : IAsyncLifetime
{
    public Task InitializeAsync() => host.ResetAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    // -----------------------------------------------------------------------
    // The promise
    // -----------------------------------------------------------------------

    [Fact]
    public async Task Saving_an_article_replaces_the_cached_public_response()
    {
        var client = host.CreateClient();

        // Populate the output cache with the empty list.
        var before = await client.GetFromJsonAsync<List<PostRow>>("/api/posts");
        before.ShouldNotBeNull();
        before.ShouldBeEmpty();

        await SendAsync(new SavePostCommand(
            null,
            "Why I stopped reaching for AutoMapper",
            "why-i-stopped-reaching-for-automapper",
            "Explicit projection reads worse for ten lines and better for ten thousand.",
            "The case against convention-based mapping in a read-heavy application.",
            IsPublished: true,
            ["EF Core", "Architecture"]));

        // No delay, no cache-buster. If eviction did not happen this still returns the
        // empty list, which is exactly what an editor would see.
        var after = await client.GetFromJsonAsync<List<PostRow>>("/api/posts");

        after.ShouldNotBeNull();
        after.Count.ShouldBe(1);
        after[0].Slug.ShouldBe("why-i-stopped-reaching-for-automapper");
    }

    [Fact]
    public async Task Saving_a_project_replaces_the_cached_public_response()
    {
        var client = host.CreateClient();

        (await client.GetFromJsonAsync<List<ProjectRow>>("/api/projects")).ShouldNotBeNull().ShouldBeEmpty();

        await SendAsync(NewProject("Core Banking Ledger", "core-banking-ledger"));

        var after = await client.GetFromJsonAsync<List<ProjectRow>>("/api/projects");

        after.ShouldNotBeNull();
        after.Count.ShouldBe(1);
        after[0].Title.ShouldBe("Core Banking Ledger");
    }

    [Fact]
    public async Task Unpublishing_an_article_removes_it_from_the_public_list()
    {
        var client = host.CreateClient();

        var id = await SendAsync(new SavePostCommand(
            null, "Temporary", "temporary", "An excerpt.", "A body long enough to count.",
            IsPublished: true, []));

        (await client.GetFromJsonAsync<List<PostRow>>("/api/posts")).ShouldNotBeNull().Count.ShouldBe(1);

        await SendAsync(new SavePostCommand(
            id, "Temporary", "temporary", "An excerpt.", "A body long enough to count.",
            IsPublished: false, []));

        (await client.GetFromJsonAsync<List<PostRow>>("/api/posts")).ShouldNotBeNull().ShouldBeEmpty();

        // Hidden, not forbidden: the public API must not confirm that a draft exists at
        // a given slug.
        var detail = await client.GetAsync(new Uri("/api/posts/temporary", UriKind.Relative));
        detail.StatusCode.ShouldBe(HttpStatusCode.NotFound);
    }

    // -----------------------------------------------------------------------
    // Guards the CMS depends on
    // -----------------------------------------------------------------------

    [Fact]
    public async Task A_duplicate_slug_is_rejected_rather_than_shadowing_the_original()
    {
        await SendAsync(new SavePostCommand(
            null, "First", "shared-slug", "An excerpt.", "A body long enough to count.",
            IsPublished: true, []));

        var failure = await Should.ThrowAsync<ValidationException>(() => SendAsync(
            new SavePostCommand(
                null, "Second", "shared-slug", "An excerpt.", "A body long enough to count.",
                IsPublished: true, [])));

        failure.Errors.ShouldContainKey(nameof(SavePostCommand.Slug));
    }

    [Fact]
    public async Task Renaming_an_article_does_not_collide_with_itself()
    {
        var id = await SendAsync(new SavePostCommand(
            null, "First", "keeps-its-slug", "An excerpt.", "A body long enough to count.",
            IsPublished: true, []));

        // Saving the same article again with its own slug must not read as a duplicate.
        await SendAsync(new SavePostCommand(
            id, "First, edited", "keeps-its-slug", "An excerpt.", "A longer body now.",
            IsPublished: true, []));

        await host.ScopedAsync(async services =>
        {
            var db = ChronicleTestHost.DbContext(services);
            (await db.Posts.CountAsync()).ShouldBe(1);
            (await db.Posts.SingleAsync()).Title.ShouldBe("First, edited");
        });
    }

    /// <summary>
    /// The rule that keeps the tag filter honest. Two casings of one tag would each
    /// filter to half the articles, and neither would look broken.
    /// </summary>
    [Fact]
    public async Task Tags_differing_only_in_case_stay_one_tag()
    {
        await SendAsync(new SavePostCommand(
            null, "First", "first", "An excerpt.", "A body long enough to count.",
            IsPublished: true, ["EF Core"]));

        await SendAsync(new SavePostCommand(
            null, "Second", "second", "An excerpt.", "A body long enough to count.",
            IsPublished: true, ["ef core"]));

        await host.ScopedAsync(async services =>
        {
            var db = ChronicleTestHost.DbContext(services);

            var tags = await db.Tags.ToListAsync();
            tags.Count.ShouldBe(1);
            // The first spelling wins; the second article joins it rather than creating a rival.
            tags[0].Name.ShouldBe("EF Core");

            (await db.Posts.CountAsync(p => p.Tags.Any(t => t.Name == "EF Core"))).ShouldBe(2);
        });
    }

    [Fact]
    public async Task An_unknown_skill_is_rejected_rather_than_created()
    {
        var failure = await Should.ThrowAsync<ValidationException>(() => SendAsync(
            NewProject("Typo", "typo") with { TechStack = ["Kubernets"] }));

        failure.Errors.ShouldContainKey(nameof(SaveProjectCommand.TechStack));

        await host.ScopedAsync(async services =>
            (await ChronicleTestHost.DbContext(services).Skills.CountAsync()).ShouldBe(0));
    }

    [Fact]
    public async Task A_known_skill_is_linked_by_name_whatever_its_casing()
    {
        await host.ScopedAsync(async services =>
        {
            var db = ChronicleTestHost.DbContext(services);
            db.Skills.Add(new Skill
            {
                Name = "PostgreSQL",
                Category = SkillCategory.Database,
                YearsExperience = 4m,
                Proficiency = ProficiencyLevel.Advanced
            });
            await db.SaveChangesAsync();
        });

        await SendAsync(NewProject("Ledger", "ledger") with { TechStack = ["postgresql"] });

        await host.ScopedAsync(async services =>
        {
            var db = ChronicleTestHost.DbContext(services);

            (await db.Skills.CountAsync()).ShouldBe(1);
            var project = await db.Projects.Include(p => p.TechStack).SingleAsync();
            project.TechStack.Single().Name.ShouldBe("PostgreSQL");
        });
    }

    /// <summary>
    /// An empty textarea posts <c>""</c>. Stored as-is it would make an optional section
    /// present-but-blank, and the public page hides sections on null - so it would render
    /// an empty heading rather than nothing.
    /// </summary>
    [Fact]
    public async Task Blank_optional_sections_are_stored_as_null()
    {
        await SendAsync(NewProject("Sparse", "sparse") with
        {
            KeyDecisions = "   ",
            Results = string.Empty,
            GithubUrl = string.Empty
        });

        await host.ScopedAsync(async services =>
        {
            var project = await ChronicleTestHost.DbContext(services).Projects.SingleAsync();

            project.KeyDecisions.ShouldBeNull();
            project.Results.ShouldBeNull();
            project.GithubUrl.ShouldBeNull();
        });
    }

    [Fact]
    public async Task Reading_time_is_derived_from_the_body_and_never_zero()
    {
        await SendAsync(new SavePostCommand(
            null, "Short", "short", "An excerpt.", "Three words only.", IsPublished: true, []));

        await host.ScopedAsync(async services =>
            (await ChronicleTestHost.DbContext(services).Posts.SingleAsync()).ReadingTimeMinutes.ShouldBe(1));
    }

    // -----------------------------------------------------------------------

    private static SaveProjectCommand NewProject(string title, string slug) => new(
        null,
        title,
        slug,
        "A one-line pitch.",
        "The problem it solved.",
        "How it solved it.",
        null, null, null, null, null, null, null, null, null, null,
        new DateOnly(2025, 1, 1),
        null,
        Featured: false,
        SortOrder: 0,
        Tags: [],
        TechStack: []);

    private Task<TResponse> SendAsync<TResponse>(IRequest<TResponse> request) =>
        host.ScopedAsync(services => services.GetRequiredService<ISender>().Send(request));

    private sealed record PostRow(string Slug, string Title);

    private sealed record ProjectRow(string Slug, string Title);
}
