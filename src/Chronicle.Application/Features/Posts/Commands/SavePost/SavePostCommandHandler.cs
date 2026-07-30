using Chronicle.Application.Common.Content;
using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Posts.Commands.SavePost;

public sealed class SavePostCommandHandler(
    IChronicleDbContext db,
    IContentCacheInvalidator cache,
    IDateTimeProvider clock) : IRequestHandler<SavePostCommand, Guid>
{
    /// <summary>Rounded up, and never zero — "0 min read" is worse than saying nothing.</summary>
    private const int WordsPerMinute = 220;

    public async Task<Guid> Handle(SavePostCommand request, CancellationToken cancellationToken)
    {
        var slugTaken = await db.Posts
            .AnyAsync(p => p.Slug == request.Slug && p.Id != request.Id, cancellationToken)
            .ConfigureAwait(false);

        if (slugTaken)
        {
            // A duplicate slug would silently shadow an existing article at its URL, so
            // this is the operator's mistake to see rather than something to paper over
            // by appending a number.
            throw new ValidationException(
            [
                new ValidationFailure(
                    nameof(SavePostCommand.Slug),
                    $"Another article already uses '{request.Slug}'.")
            ]);
        }

        Post post;

        if (request.Id is { } id)
        {
            post = await db.Posts
                .Include(p => p.Tags)
                .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
                .ConfigureAwait(false)
                ?? throw new NotFoundException(nameof(Post), id);
        }
        else
        {
            post = new Post();
            db.Posts.Add(post);
        }

        post.Title = request.Title;
        post.Slug = request.Slug;
        post.Excerpt = request.Excerpt;
        post.BodyMarkdown = request.BodyMarkdown;
        post.IsPublished = request.IsPublished;
        post.ReadingTimeMinutes = ReadingTime(request.BodyMarkdown);

        // PublishedAt records when it first went public and is then left alone.
        // Re-dating it on every save would reorder the archive whenever a typo was
        // fixed, and unpublishing to correct something is a correction, not a new
        // article.
        if (request.IsPublished && post.PublishedAt is null)
        {
            post.PublishedAt = clock.UtcNow;
        }

        var tags = await Taxonomy.ResolveTagsAsync(db, request.Tags, cancellationToken)
            .ConfigureAwait(false);

        post.Tags.Clear();
        foreach (var tag in tags)
        {
            post.Tags.Add(tag);
        }

        await db.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // Chronology as well as Posts: a published article is a timeline node, so a draft
        // going live changes the timeline even though nothing dated moved.
        await cache.EvictAsync(cancellationToken, [CacheTags.Posts, .. CacheTags.Chronology])
            .ConfigureAwait(false);

        return post.Id;
    }

    private static int ReadingTime(string markdown)
    {
        var words = markdown.Split(
            (char[]?)null,
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Length;

        return Math.Max(1, (int)Math.Ceiling(words / (double)WordsPerMinute));
    }
}
