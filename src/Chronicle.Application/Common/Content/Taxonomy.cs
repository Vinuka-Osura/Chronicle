using Chronicle.Application.Common.Interfaces;
using Chronicle.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Common.Content;

/// <summary>
/// Turns the free-typed tag and skill names from the CMS into entities.
/// </summary>
/// <remarks>
/// <para>
/// Shared by the post and project save handlers rather than copied into each: the rule
/// that matters is that names match <b>case-insensitively</b>, and having it written
/// three times is how "EF Core" and "ef core" end up as two tags that each filter to
/// half the articles.
/// </para>
/// <para>
/// Tags are created on demand, because inventing one while writing is normal. Skills are
/// <b>not</b> - a skill carries years of experience and a proficiency level that only a
/// person can set, so a typo in a tech stack must surface as an error rather than
/// quietly seeding a "Kubernets" with zero years against it.
/// </para>
/// </remarks>
public static class Taxonomy
{
    /// <summary>Resolves tag names, creating any that do not exist yet.</summary>
    public static async Task<List<Tag>> ResolveTagsAsync(
        IChronicleDbContext db,
        IEnumerable<string> names,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(db);

        var wanted = Normalise(names);
        if (wanted.Count == 0)
        {
            return [];
        }

        // Matched on the upper-cased name so the database comparison is case-insensitive
        // too. Doing it only in memory looks right and is not: the query would fetch
        // nothing for "ef core", a second "EF Core" tag would be created, and the unique
        // index would either reject the save or - worse, without one - leave two tags
        // each filtering to half the articles.
        var keys = UpperKeys(wanted);

        var existing = await db.Tags
            .Where(t => keys.Contains(t.Name.ToUpper()))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var resolved = new List<Tag>(wanted.Count);

        foreach (var name in wanted)
        {
            var tag = existing.Find(t => string.Equals(t.Name, name, StringComparison.OrdinalIgnoreCase));

            if (tag is null)
            {
                tag = new Tag { Name = name, Slug = Slugify(name) };
                db.Tags.Add(tag);
                // So a repeated name within the same save reuses the one just added
                // rather than adding a second.
                existing.Add(tag);
            }

            resolved.Add(tag);
        }

        return resolved;
    }

    /// <summary>
    /// Resolves skill names to existing skills. Names that match nothing are returned in
    /// <paramref name="unknown"/> for the caller to reject.
    /// </summary>
    public static async Task<(List<Skill> Resolved, List<string> Unknown)> ResolveSkillsAsync(
        IChronicleDbContext db,
        IEnumerable<string> names,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(db);

        var wanted = Normalise(names);
        if (wanted.Count == 0)
        {
            return ([], []);
        }

        var keys = UpperKeys(wanted);

        var existing = await db.Skills
            .Where(s => keys.Contains(s.Name.ToUpper()))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var resolved = new List<Skill>(wanted.Count);
        var unknown = new List<string>();

        foreach (var name in wanted)
        {
            var skill = existing.Find(s => string.Equals(s.Name, name, StringComparison.OrdinalIgnoreCase));

            if (skill is null)
            {
                unknown.Add(name);
            }
            else
            {
                resolved.Add(skill);
            }
        }

        return (resolved, unknown);
    }

    /// <summary>
    /// The comparison keys, matching the <c>upper()</c> the provider will apply to the
    /// column. `ToUpper()` rather than `ToUpperInvariant()`: only the former translates
    /// to SQL, and both sides of the comparison must be built the same way.
    /// </summary>
#pragma warning disable CA1308, CA1311 // See above - this is a SQL-translatable comparison, not a display string.
    private static List<string> UpperKeys(IEnumerable<string> names) =>
        [.. names.Select(name => name.ToUpper())];
#pragma warning restore CA1308, CA1311

    /// <summary>Trims, drops blanks, and collapses case-insensitive duplicates.</summary>
    private static List<string> Normalise(IEnumerable<string> names) =>
        [.. (names ?? [])
            .Select(name => name.Trim())
            .Where(name => name.Length > 0)
            .DistinctBy(name => name.ToUpperInvariant())];

    private static string Slugify(string name)
    {
        var flattened = new string([.. name.ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')]);

        return string.Join('-', flattened.Split('-', StringSplitOptions.RemoveEmptyEntries));
    }
}
