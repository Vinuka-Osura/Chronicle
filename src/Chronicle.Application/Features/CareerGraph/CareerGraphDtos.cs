using System.Text.Json.Serialization;

namespace Chronicle.Application.Features.CareerGraph;

/// <summary>
/// The career as timestamped entities with lifecycles — the input format for the
/// Software City renderer.
/// </summary>
/// <remarks>
/// <para>
/// <b>The shape here is dictated by <c>contracts/career-graph.v1.schema.json</c>, not the
/// other way round.</b> That file is the product boundary: it is CC0, it is versioned,
/// and anything that can emit this shape can drive the renderer. Chronicle is one
/// producer of it and has no special status.
/// </para>
/// <para>
/// Which means this file may not be changed casually. A property renamed here is a
/// contract break for every consumer, and the schema test will refuse it — which is the
/// point of having the test.
/// </para>
/// </remarks>
public sealed record CareerGraphDto(
    int Version,
    DateTimeOffset GeneratedAt,
    CareerSubjectDto Subject,
    IReadOnlyList<CareerEntityDto> Entities);

public sealed record CareerSubjectDto(string Name, string? Headline, string? Url);

/// <param name="Kind">
/// building, road, district or landmark. A string rather than an enum in the DTO because
/// the contract defines the vocabulary and the contract is not ours to extend quietly.
/// </param>
/// <param name="Magnitude">
/// 0 to 1, normalised here. Raw values would be meaningless to a consumer: only the
/// producer knows whether 4 is a lot of years.
/// </param>
public sealed record CareerEntityDto(
    string Id,
    string Kind,
    string Label,
    string? District,
    DateOnly Built,
    IReadOnlyList<DateOnly> Upgraded,
    DateOnly? Retired,
    double Magnitude,
    IReadOnlyList<string> Connects,
    bool Speculative,
    string? Href,
    // Always emitted, even when empty: the schema defaults it to {}, and a consumer that
    // has to distinguish "absent" from "empty" is one that will get it wrong.
    [property: JsonPropertyName("meta")] IReadOnlyDictionary<string, string> Meta);
