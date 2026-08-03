using MediatR;

namespace Chronicle.Application.Features.Resumes.Queries.GetResume;

/// <param name="MaxProjects">
/// How many projects to carry. A CV is a summary, not an index — the default of three is
/// what fits before "selected work" stops being selected.
/// </param>
public sealed record GetResumeQuery(int MaxProjects = 3) : IRequest<ResumeDto>;
