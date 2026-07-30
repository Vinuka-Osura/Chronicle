using MediatR;

namespace Chronicle.Application.Features.Posts.Queries.GetPostBySlug;

public sealed record GetPostBySlugQuery(string Slug) : IRequest<PostDetailDto>;
