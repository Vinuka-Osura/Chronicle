namespace Chronicle.Application.Common.Content;

/// <summary>
/// Decides whether an uploaded file is an image this site will serve.
/// </summary>
/// <remarks>
/// <para>
/// <b>The format is read from the bytes, never from the filename or the declared
/// content type.</b> Both of those are supplied by whoever is uploading, and a file
/// called <c>diagram.png</c> announcing <c>image/png</c> can contain anything at all.
/// The first few bytes of a real image cannot lie about what it is.
/// </para>
/// <para>
/// <b>SVG is rejected on purpose.</b> An SVG is a document, not a picture: it can carry
/// <c>&lt;script&gt;</c>, event handlers and external references, and serving one from
/// the site's own origin is stored cross-site scripting with an editor's session behind
/// it. Sanitising SVG properly is a genuinely hard problem with a long history of
/// bypasses. Exporting a diagram to PNG costs one click and closes the hole entirely.
/// </para>
/// </remarks>
public static class ImageValidation
{
    /// <summary>
    /// Five megabytes. Comfortably more than a screenshot or an exported diagram needs,
    /// and small enough that a mistake cannot fill the free tier in one upload.
    /// </summary>
    public const long MaxBytes = 5 * 1024 * 1024;

    private static readonly (string ContentType, string Extension, byte[] Magic, int Offset)[] Formats =
    [
        ("image/png", ".png", [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0),
        ("image/jpeg", ".jpg", [0xFF, 0xD8, 0xFF], 0),
        ("image/gif", ".gif", "GIF89a"u8.ToArray(), 0),
        ("image/gif", ".gif", "GIF87a"u8.ToArray(), 0),
        // RIFF....WEBP - the four size bytes at offset 4 are skipped, so the marker that
        // distinguishes WebP from any other RIFF container sits at 8.
        ("image/webp", ".webp", "WEBP"u8.ToArray(), 8),
        // ISO base media file format brand for AVIF, in the ftyp box.
        ("image/avif", ".avif", "ftypavif"u8.ToArray(), 4)
    ];

    /// <summary>How much of the stream needs reading to identify any supported format.</summary>
    private const int HeaderBytes = 16;

    public static ImageCheck Inspect(Stream content, string fileName, long length)
    {
        ArgumentNullException.ThrowIfNull(content);

        if (length <= 0)
        {
            return ImageCheck.Rejected("That file is empty.");
        }

        if (length > MaxBytes)
        {
            return ImageCheck.Rejected(
                $"That file is {Describe(length)}. The limit is {Describe(MaxBytes)} — " +
                "resize it, or export the diagram at a lower resolution.");
        }

        Span<byte> header = stackalloc byte[HeaderBytes];
        var read = ReadAtLeast(content, header);
        content.Position = 0;

        foreach (var (contentType, extension, magic, offset) in Formats)
        {
            if (read >= offset + magic.Length
                && header[offset..(offset + magic.Length)].SequenceEqual(magic))
            {
                return ImageCheck.Accepted(contentType, extension);
            }
        }

        // Named separately from the generic rejection, because "use a PNG" is actionable
        // and "unsupported format" is not.
        if (LooksLikeSvg(header[..read]) || fileName.EndsWith(".svg", StringComparison.OrdinalIgnoreCase))
        {
            return ImageCheck.Rejected(
                "SVG is not accepted. An SVG can contain scripts, so serving one would be " +
                "a security hole. Export the diagram as PNG instead.");
        }

        return ImageCheck.Rejected(
            "That is not an image this site can serve. Use PNG, JPEG, WebP, AVIF or GIF — " +
            "and note the check reads the file itself, so renaming the extension will not help.");
    }

    private static bool LooksLikeSvg(ReadOnlySpan<byte> header)
    {
        // A leading XML declaration, a BOM, or whitespace can all precede the root tag,
        // so this looks for the markers rather than matching from position zero.
        Span<char> text = stackalloc char[header.Length];
        for (var i = 0; i < header.Length; i++)
        {
            text[i] = char.ToLowerInvariant((char)header[i]);
        }

        return text.Contains("<svg", StringComparison.Ordinal)
            || text.Contains("<?xml", StringComparison.Ordinal);
    }

    private static int ReadAtLeast(Stream content, Span<byte> buffer)
    {
        var total = 0;
        while (total < buffer.Length)
        {
            var read = content.Read(buffer[total..]);
            if (read == 0)
            {
                break;
            }

            total += read;
        }

        return total;
    }

    public static string Describe(long bytes) => bytes switch
    {
        < 1024 => $"{bytes} B",
        < 1024 * 1024 => $"{bytes / 1024d:0.#} KB",
        < 1024L * 1024 * 1024 => $"{bytes / (1024d * 1024):0.#} MB",
        _ => $"{bytes / (1024d * 1024 * 1024):0.##} GB"
    };
}

/// <param name="ContentType">
/// Derived from the bytes, not from what the browser claimed. This is the value that
/// gets stored and served back, so a lie cannot survive the round trip.
/// </param>
public sealed record ImageCheck(bool IsValid, string? ContentType, string? Extension, string? Error)
{
    public static ImageCheck Accepted(string contentType, string extension) =>
        new(true, contentType, extension, null);

    public static ImageCheck Rejected(string error) => new(false, null, null, error);
}
