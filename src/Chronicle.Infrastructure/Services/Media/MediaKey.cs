using System.Globalization;

namespace Chronicle.Infrastructure.Services.Media;

/// <summary>
/// Builds the storage key for an upload.
/// </summary>
/// <remarks>
/// <para>
/// <b>Generated entirely server-side.</b> The operator's filename contributes nothing but
/// its extension, and even that is taken from the format detected in the bytes rather
/// than from the name. A filename is untrusted input: <c>../../appsettings.json</c> is a
/// perfectly valid one, and on a local-disk adapter that is a path-traversal write.
/// </para>
/// <para>
/// The date prefix is for humans — listing a bucket by date is how you find the thing
/// you uploaded last March. The Version 7 GUID keeps that listing time-ordered while
/// still being unguessable, so nobody can enumerate the bucket by counting.
/// </para>
/// </remarks>
public static class MediaKey
{
    public static string Create(DateTimeOffset now, string extension) =>
        string.Create(
            CultureInfo.InvariantCulture,
            $"{now:yyyy/MM}/{Guid.CreateVersion7():N}{extension}");
}
