namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// Port over the response cache, so admin commands can evict what they changed.
/// </summary>
/// <remarks>
/// This is what makes the CMS feel immediate. Public GETs are output-cached, and
/// without eviction an editor would save a change and then watch a stale page for
/// up to the cache TTL, with no way to tell whether the save worked. Commands call
/// <see cref="EvictAsync"/> with the tags they touched, so the next request rebuilds.
/// </remarks>
public interface IContentCacheInvalidator
{
    Task EvictAsync(CancellationToken cancellationToken = default, params string[] tags);
}

/// <summary>Cache tag names, shared by the endpoints that set them and the commands that evict them.</summary>
public static class CacheTags
{
    public const string Projects = "projects";
    public const string Experience = "experience";
    public const string Skills = "skills";
    public const string Posts = "posts";
    public const string Learning = "learning";
    public const string Roadmap = "roadmap";
    public const string Certifications = "certifications";
    public const string Status = "status";
    public const string Profile = "profile";
    public const string Timeline = "timeline";
    public const string CareerGraph = "career-graph";

    /// <summary>
    /// Never evicted by a command - nothing in the CMS can change what GitHub reports.
    /// It exists so the tag vocabulary stays complete and the endpoint reads like the
    /// others.
    /// </summary>
    public const string GitHubStats = "github-stats";

    /// <summary>
    /// Tags invalidated by a change to any dated content, because the Timeline and the
    /// career graph are merged projections over several entities at once.
    /// </summary>
    public static readonly string[] Chronology = [Timeline, CareerGraph];
}
