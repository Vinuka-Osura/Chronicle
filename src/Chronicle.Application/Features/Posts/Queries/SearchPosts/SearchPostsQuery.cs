using Chronicle.Application.Common.Interfaces;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Posts.Queries.SearchPosts;

/// <param name="Term">Whatever was typed in the search box.</param>
public sealed record SearchPostsQuery(string Term) : IRequest<IReadOnlyList<PostCardDto>>;

public sealed class SearchPostsQueryValidator : AbstractValidator<SearchPostsQuery>
{
    public SearchPostsQueryValidator()
    {
        RuleFor(q => q.Term)
            .NotEmpty()
            .MaximumLength(200)
            .WithMessage("Search terms are capped at 200 characters.");
    }
}

public sealed class SearchPostsQueryHandler(IChronicleDbContext db, IPostSearch search)
    : IRequestHandler<SearchPostsQuery, IReadOnlyList<PostCardDto>>
{
    /// <summary>
    /// Enough that nobody scrolls to the bottom looking for a result that is not there,
    /// and few enough that one query cannot be used to enumerate the whole archive.
    /// </summary>
    private const int MaxResults = 30;

    public async Task<IReadOnlyList<PostCardDto>> Handle(
        SearchPostsQuery request,
        CancellationToken cancellationToken)
    {
        /*
          Two queries on purpose.

          The first ranks in the database, which is the only place ts_rank can run. The
          second loads the cards through the normal projection, so search results are
          built by exactly the same code as the list page and cannot drift from it - one
          shape of card, one place it is defined.

          Both are indexed and bounded at thirty rows, which for a portfolio archive is a
          rounding error against the cost of the round trip.
        */
        var ranked = await search
            .RankAsync(request.Term, MaxResults, cancellationToken)
            .ConfigureAwait(false);

        if (ranked.Count == 0)
        {
            return [];
        }

        var cards = await db.Posts
            .AsNoTracking()
            // IsPublished is already applied by the search, but repeated here so this
            // handler is safe on its own terms rather than on a promise made elsewhere.
            .Where(p => p.IsPublished && ranked.Contains(p.Id))
            .Select(p => new
            {
                p.Id,
                Card = new PostCardDto(
                    p.Slug,
                    p.Title,
                    p.Excerpt,
                    p.ReadingTimeMinutes,
                    p.PublishedAt,
                    p.Tags.OrderBy(t => t.Name).Select(t => t.Name).ToList())
            })
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        // Restored to the ranking order the database worked out - an IN clause gives no
        // order back, and returning best-match-first is the entire point of searching.
        var byId = cards.ToDictionary(row => row.Id, row => row.Card);

        return [.. ranked.Where(byId.ContainsKey).Select(id => byId[id])];
    }
}
