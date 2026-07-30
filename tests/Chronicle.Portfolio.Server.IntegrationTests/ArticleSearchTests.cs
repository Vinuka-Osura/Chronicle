using System.Net.Http.Json;
using Chronicle.Application.Features.Posts;
using Chronicle.Application.Features.Posts.Commands.SavePost;
using Chronicle.Application.Features.Posts.Queries.SearchPosts;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Chronicle.Portfolio.Server.IntegrationTests;

/// <summary>
/// Full-text search over articles.
/// </summary>
/// <remarks>
/// Only provable against real PostgreSQL: the ranking, the stemming and the generated
/// column are all database behaviour. An in-memory provider would let every one of these
/// tests pass while the feature did nothing.
/// </remarks>
[Collection(ChronicleHostFixture.Name)]
public class ArticleSearchTests(ChronicleTestHost host) : IAsyncLifetime
{
    public Task InitializeAsync() => host.ResetAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task Finds_an_article_by_a_word_in_its_title()
    {
        await SeedAsync();

        var results = await SearchAsync("ledger");

        results.ShouldHaveSingleItem().Slug.ShouldBe("snapshotting-a-ledger");
    }

    /// <summary>
    /// The reason this is a database feature rather than a JavaScript filter: the index
    /// stores stems, so a reader who types the plural still finds the article.
    /// </summary>
    [Theory]
    [InlineData("ledgers")]
    [InlineData("snapshotting")]
    [InlineData("SNAPSHOT")]
    public async Task Stems_and_folds_case(string term)
    {
        await SeedAsync();

        (await SearchAsync(term)).ShouldNotBeEmpty();
    }

    [Fact]
    public async Task Searches_the_body_not_only_the_title()
    {
        await SeedAsync();

        var results = await SearchAsync("reconciliation");

        results.ShouldHaveSingleItem().Slug.ShouldBe("keeping-two-systems-honest");
    }

    /// <summary>
    /// The weighting earns its place here: both articles contain "audit", but only one
    /// is about it, and that one has to come first or the ranking is decoration.
    /// </summary>
    [Fact]
    public async Task Ranks_a_title_match_above_a_body_mention()
    {
        await SeedAsync();

        var results = await SearchAsync("audit");

        results.Count.ShouldBe(2);
        results[0].Slug.ShouldBe("audit-trails-that-survive-a-migration");
    }

    [Fact]
    public async Task Never_returns_a_draft()
    {
        await SeedAsync();

        await SendAsync(new SavePostCommand(
            null,
            "A secret ledger essay",
            "a-secret-ledger-essay",
            "Not published yet.",
            "This draft is about a ledger and should stay invisible.",
            IsPublished: false,
            []));

        var results = await SearchAsync("ledger");

        results.ShouldNotContain(post => post.Slug == "a-secret-ledger-essay");
    }

    [Fact]
    public async Task Returns_nothing_rather_than_everything_for_an_unknown_word()
    {
        await SeedAsync();

        (await SearchAsync("xylophone")).ShouldBeEmpty();
    }

    /// <summary>
    /// A search box receives whatever someone types. <c>to_tsquery</c> throws on all of
    /// these; <c>websearch_to_tsquery</c> is used precisely so a typo is a typo rather
    /// than a 500.
    /// </summary>
    [Theory]
    [InlineData("unbalanced \" quote")]
    [InlineData("& | ! ( )")]
    [InlineData("trailing &")]
    [InlineData("a & the")]
    [InlineData("'; DROP TABLE knowledge_posts; --")]
    public async Task Survives_input_that_is_not_valid_query_syntax(string term)
    {
        await SeedAsync();

        // The assertion is that it does not throw. An empty result is a fine answer.
        await Should.NotThrowAsync(() => SearchAsync(term));

        // And nothing was destroyed on the way past.
        (await SearchAsync("ledger")).ShouldNotBeEmpty();
    }

    [Fact]
    public async Task Understands_a_quoted_phrase()
    {
        await SeedAsync();

        // Both words appear across the set, but only one article has them adjacent.
        var results = await SearchAsync("\"double entry\"");

        results.ShouldHaveSingleItem().Slug.ShouldBe("snapshotting-a-ledger");
    }

    [Fact]
    public async Task Excludes_a_word_prefixed_with_a_minus()
    {
        await SeedAsync();

        var withoutMigrations = await SearchAsync("audit -migration");

        withoutMigrations.ShouldNotContain(p => p.Slug == "audit-trails-that-survive-a-migration");
    }

    [Fact]
    public async Task Is_reachable_over_the_api()
    {
        await SeedAsync();

        var results = await host.CreateClient()
            .GetFromJsonAsync<List<PostCardDto>>("/api/posts/search?q=ledger");

        results.ShouldNotBeNull().ShouldHaveSingleItem();
    }

    // -----------------------------------------------------------------------

    private async Task SeedAsync()
    {
        await SendAsync(new SavePostCommand(
            null,
            "Snapshotting a ledger",
            "snapshotting-a-ledger",
            "Bounded reads without giving up history.",
            "A double entry journal is append-only, so every balance stays reproducible. "
            + "Periodic snapshots keep reads bounded as the ledger grows.",
            IsPublished: true,
            ["Architecture"]));

        await SendAsync(new SavePostCommand(
            null,
            "Keeping two systems honest",
            "keeping-two-systems-honest",
            "Matching records nobody wants to read by hand.",
            "Reconciliation is really a search problem. An audit of the differences is "
            + "usually more useful than the totals.",
            IsPublished: true,
            ["Data"]));

        await SendAsync(new SavePostCommand(
            null,
            "Audit trails that survive a migration",
            "audit-trails-that-survive-a-migration",
            "An audit trail is only worth having if it outlives the schema.",
            "Audit rows outlive the tables they describe, so a migration has to carry the "
            + "audit forward rather than rebuild it.",
            IsPublished: true,
            ["Data"]));
    }

    private Task<IReadOnlyList<PostCardDto>> SearchAsync(string term) =>
        SendAsync(new SearchPostsQuery(term));

    private Task<TResponse> SendAsync<TResponse>(IRequest<TResponse> request) =>
        host.ScopedAsync(services => services.GetRequiredService<ISender>().Send(request));
}
