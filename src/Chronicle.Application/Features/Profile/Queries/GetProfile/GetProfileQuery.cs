using MediatR;

namespace Chronicle.Application.Features.Profile.Queries.GetProfile;

/// <summary>
/// The CV header, or <see langword="null"/> when nobody has filled it in yet.
/// </summary>
/// <remarks>
/// Nullable on purpose, and the one query here that does not fall back to a placeholder.
/// A missing status strip can say "heads-down on something" and lose nothing; a missing
/// profile cannot invent a name and an email address, because the page that renders it is
/// a résumé and every field on it is a claim about a real person.
/// </remarks>
public sealed record GetProfileQuery : IRequest<ProfileDto?>;
