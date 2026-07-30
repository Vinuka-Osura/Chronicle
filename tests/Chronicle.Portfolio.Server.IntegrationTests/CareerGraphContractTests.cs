using System.Text.Json;
using System.Text.Json.Nodes;
using Chronicle.Application.Features.Projects.Commands.SaveProject;
using Chronicle.Application.Features.Skills.Commands.SaveSkill;
using Chronicle.Domain.Enums;
using Json.Schema;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Chronicle.Portfolio.Server.IntegrationTests;

/// <summary>
/// The career-graph endpoint must satisfy the committed schema.
/// </summary>
/// <remarks>
/// <para>
/// This is the only test in the suite protecting something outside this repository.
/// Software City is a separate product with its own release cycle, and the schema is the
/// entire surface between them — so a rename here that nobody notices is a broken
/// renderer that ships days later with no obvious cause.
/// </para>
/// <para>
/// <b>The schema is the authority, not this endpoint.</b> If they disagree the endpoint
/// is wrong, unless the contract was deliberately versioned — which means a new file,
/// not an edit to this one.
/// </para>
/// </remarks>
[Collection(ChronicleHostFixture.Name)]
public class CareerGraphContractTests(ChronicleTestHost host) : IAsyncLifetime
{
    // Absolute: FromFile builds a base URI from the path, and a relative one has no
    // scheme to build from. The file is linked into the output by the csproj.
    private static readonly JsonSchema Schema = JsonSchema.FromFile(
        Path.Combine(AppContext.BaseDirectory, "career-graph.v1.schema.json"));

    private static readonly EvaluationOptions Strict = new()
    {
        // Report every failure rather than stopping at the first, so a broken contract
        // takes one run to diagnose instead of five.
        OutputFormat = OutputFormat.List,
        RequireFormatValidation = true,
    };

    public Task InitializeAsync() => host.ResetAsync();

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task An_empty_career_still_produces_a_valid_document()
    {
        // The degenerate case, and the one most likely to be forgotten: a fresh install
        // with no content must still emit something the renderer can load rather than
        // null, or an empty body, or a 500.
        await AssertValidAsync();
    }

    [Fact]
    public async Task A_populated_career_produces_a_valid_document()
    {
        await SeedAsync();

        var document = await AssertValidAsync();

        var entities = document["entities"]!.AsArray();
        entities.Count.ShouldBeGreaterThan(0);
    }

    [Fact]
    public async Task Every_entity_id_is_unique()
    {
        await SeedAsync();

        var ids = (await FetchAsync())["entities"]!.AsArray()
            .Select(entity => entity!["id"]!.GetValue<string>())
            .ToList();

        // Ids are how a renderer knows a building moved rather than that one vanished and
        // another appeared. Duplicates make that impossible and the schema cannot express
        // the constraint.
        ids.Distinct().Count().ShouldBe(ids.Count);
    }

    [Fact]
    public async Task Every_district_reference_points_at_a_district_that_exists()
    {
        await SeedAsync();

        var entities = (await FetchAsync())["entities"]!.AsArray();

        var districts = entities
            .Where(e => e!["kind"]!.GetValue<string>() == "district")
            .Select(e => e!["id"]!.GetValue<string>())
            .ToHashSet(StringComparer.Ordinal);

        var referenced = entities
            .Select(e => e!["district"])
            .Where(node => node is not null)
            .Select(node => node!.GetValue<string>());

        // A dangling district reference is a building with nowhere to stand. Referential
        // integrity is beyond JSON Schema, so it is asserted here.
        foreach (var reference in referenced)
        {
            districts.ShouldContain(reference);
        }
    }

    [Fact]
    public async Task Every_road_connects_entities_that_exist()
    {
        await SeedAsync();

        var entities = (await FetchAsync())["entities"]!.AsArray();
        var ids = entities.Select(e => e!["id"]!.GetValue<string>()).ToHashSet(StringComparer.Ordinal);

        var connections = entities
            .Where(e => e!["kind"]!.GetValue<string>() == "road")
            .SelectMany(e => e!["connects"]!.AsArray().Select(c => c!.GetValue<string>()));

        foreach (var target in connections)
        {
            ids.ShouldContain(target);
        }
    }

    [Fact]
    public async Task Roadmap_items_are_flagged_speculative_and_nothing_else_is()
    {
        await SeedAsync();

        var entities = (await FetchAsync())["entities"]!.AsArray();

        var speculative = entities
            .Where(e => e!["speculative"]!.GetValue<bool>())
            .Select(e => e!["id"]!.GetValue<string>())
            .ToList();

        // The property the whole "ambitious without being dishonest" claim rests on. A
        // goal rendered as a built thing is a lie told by a picture.
        speculative.ShouldAllBe(id => id.StartsWith("roadmap:", StringComparison.Ordinal));
    }

    [Fact]
    public async Task The_version_is_one_so_a_consumer_can_refuse_what_it_does_not_know()
    {
        (await FetchAsync())["version"]!.GetValue<int>().ShouldBe(1);
    }

    // -----------------------------------------------------------------------

    private async Task<JsonNode> AssertValidAsync()
    {
        var json = await FetchJsonAsync();

        // Evaluate takes a JsonElement; JsonNode is what the assertions want to walk.
        // Parsing twice is cheaper than converting and keeps both sides honest.
        using var element = JsonDocument.Parse(json);
        var result = Schema.Evaluate(element.RootElement, Strict);

        if (!result.IsValid)
        {
            var problems = Flatten(result).ToList();

            throw new ShouldAssertException(
                "The career graph does not satisfy contracts/career-graph.v1.schema.json.\n"
                + "The schema is the contract; if they disagree, the endpoint is wrong.\n  "
                + string.Join("\n  ", problems));
        }

        return Parse(json);
    }

    /// <summary>Walks the result tree so every failure is reported, not just the top one.</summary>
    private static IEnumerable<string> Flatten(EvaluationResults results)
    {
        if (results.Errors is { Count: > 0 })
        {
            foreach (var (keyword, message) in results.Errors)
            {
                yield return $"{results.InstanceLocation} ({keyword}): {message}";
            }
        }

        foreach (var child in results.Details ?? [])
        {
            foreach (var problem in Flatten(child))
            {
                yield return problem;
            }
        }
    }

    private Task<JsonNode> FetchAsync() => FetchJsonAsync().ContinueWith(
        task => Parse(task.Result),
        TaskScheduler.Default);

    private Task<string> FetchJsonAsync() =>
        host.CreateClient().GetStringAsync(new Uri("/api/career-graph", UriKind.Relative));

    private static JsonNode Parse(string json) =>
        JsonNode.Parse(json)
        ?? throw new ShouldAssertException("The career graph endpoint returned no document.");

    private async Task SeedAsync()
    {
        await SendAsync(new SaveSkillCommand(
            null, "PostgreSQL", SkillCategory.Database, 4m, ProficiencyLevel.Advanced, 0));
        await SendAsync(new SaveSkillCommand(
            null, "C#", SkillCategory.Backend, 5m, ProficiencyLevel.Expert, 0));

        await SendAsync(new SaveProjectCommand(
            null,
            "Core Banking Ledger",
            "core-banking-ledger",
            "A double-entry ledger.",
            "The problem.",
            "The solution.",
            null, null, null, null, null, null, null, null, null, null,
            new DateOnly(2024, 1, 1),
            new DateOnly(2024, 12, 31),
            Featured: true,
            SortOrder: 0,
            Tags: [],
            TechStack: ["PostgreSQL", "C#"]));
    }

    private Task<TResponse> SendAsync<TResponse>(IRequest<TResponse> request) =>
        host.ScopedAsync(services => services.GetRequiredService<ISender>().Send(request));
}
