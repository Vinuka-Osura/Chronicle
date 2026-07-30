using System.Text;
using Chronicle.Application.Common.Content;

namespace Chronicle.Application.Tests.Common;

/// <summary>
/// The upload gate.
/// </summary>
/// <remarks>
/// Getting this wrong is a vulnerability rather than a bug, so the cases are written out
/// rather than assumed. The rule under test is that <b>the bytes decide</b> — a filename
/// and a declared content type are both supplied by whoever is uploading, and neither is
/// evidence of anything.
/// </remarks>
public class ImageValidationTests
{
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0];
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    private static readonly byte[] Gif = [.. "GIF89a"u8.ToArray(), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    private static readonly byte[] Webp = [.. "RIFF"u8.ToArray(), 0, 0, 0, 0, .. "WEBP"u8.ToArray(), 0, 0, 0, 0];
    private static readonly byte[] Avif = [0, 0, 0, 0x20, .. "ftypavif"u8.ToArray(), 0, 0, 0, 0];

    private static ImageCheck Inspect(byte[] bytes, string fileName = "upload.png")
    {
        using var stream = new MemoryStream(bytes);
        return ImageValidation.Inspect(stream, fileName, bytes.Length);
    }

    // -----------------------------------------------------------------------
    // Accepted
    // -----------------------------------------------------------------------

    [Fact]
    public void Accepts_png() =>
        Inspect(Png).ShouldSatisfyAllConditions(
            c => c.IsValid.ShouldBeTrue(),
            c => c.ContentType.ShouldBe("image/png"));

    [Fact]
    public void Accepts_jpeg() => Inspect(Jpeg).ContentType.ShouldBe("image/jpeg");

    [Fact]
    public void Accepts_gif() => Inspect(Gif).ContentType.ShouldBe("image/gif");

    [Fact]
    public void Accepts_webp() => Inspect(Webp).ContentType.ShouldBe("image/webp");

    [Fact]
    public void Accepts_avif() => Inspect(Avif).ContentType.ShouldBe("image/avif");

    /// <summary>
    /// The content type is derived, not echoed. A JPEG uploaded as <c>shot.png</c> is
    /// stored and served as <c>image/jpeg</c>, so the lie cannot survive the round trip.
    /// </summary>
    [Fact]
    public void Reports_the_real_format_not_the_extension()
    {
        var check = Inspect(Jpeg, "screenshot.png");

        check.IsValid.ShouldBeTrue();
        check.ContentType.ShouldBe("image/jpeg");
    }

    /// <summary>The stream must be usable afterwards — the upload writes it straight out.</summary>
    [Fact]
    public void Rewinds_the_stream_so_the_caller_can_still_read_it()
    {
        using var stream = new MemoryStream(Png);

        ImageValidation.Inspect(stream, "a.png", Png.Length);

        stream.Position.ShouldBe(0);
    }

    // -----------------------------------------------------------------------
    // Rejected
    // -----------------------------------------------------------------------

    /// <summary>
    /// The case the whole check exists for: an executable renamed to .png, announced as
    /// an image. Trusting either signal accepts it.
    /// </summary>
    [Fact]
    public void Rejects_a_non_image_renamed_to_an_image_extension()
    {
        // "MZ" — a Windows executable.
        var check = Inspect([.. "MZ"u8.ToArray(), .. new byte[14]], "totally-a-screenshot.png");

        check.IsValid.ShouldBeFalse();
        check.Error.ShouldNotBeNull().ShouldContain("renaming the extension will not help");
    }

    [Fact]
    public void Rejects_a_php_script_named_as_an_image()
    {
        var check = Inspect(Encoding.UTF8.GetBytes("<?php system($_GET['c']); ?>   "), "shell.png");

        check.IsValid.ShouldBeFalse();
    }

    /// <summary>
    /// SVG is a document that can carry scripts. Serving one from the site's own origin
    /// is stored cross-site scripting, so it is refused by content as well as by name.
    /// </summary>
    [Fact]
    public void Rejects_svg_by_its_content_even_when_the_extension_lies()
    {
        var svg = Encoding.UTF8.GetBytes("<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>");

        var check = Inspect(svg, "diagram.png");

        check.IsValid.ShouldBeFalse();
        // Actionable, not just a refusal.
        check.Error.ShouldNotBeNull().ShouldContain("Export the diagram as PNG");
    }

    [Fact]
    public void Rejects_svg_with_a_leading_xml_declaration()
    {
        var svg = Encoding.UTF8.GetBytes("<?xml version=\"1.0\"?><svg xmlns=\"http://www.w3.org/2000/svg\"/>");

        Inspect(svg, "diagram.svg").IsValid.ShouldBeFalse();
    }

    [Fact]
    public void Rejects_an_empty_file()
    {
        var check = Inspect([], "empty.png");

        check.IsValid.ShouldBeFalse();
        check.Error.ShouldNotBeNull().ShouldContain("empty");
    }

    [Fact]
    public void Rejects_a_file_over_the_size_limit()
    {
        using var stream = new MemoryStream(Png);

        // A valid PNG header, but declared larger than the cap. The size is checked
        // before any bytes are read, so an oversized upload never gets buffered.
        var check = ImageValidation.Inspect(stream, "huge.png", ImageValidation.MaxBytes + 1);

        check.IsValid.ShouldBeFalse();
        check.Error.ShouldNotBeNull().ShouldContain("5 MB");
    }

    /// <summary>
    /// RIFF is a container format. Only the WEBP marker at offset 8 makes it an image,
    /// so a WAV file - also RIFF - must not slip through on the first four bytes.
    /// </summary>
    [Fact]
    public void Rejects_a_riff_container_that_is_not_webp()
    {
        var wav = new byte[16];
        "RIFF"u8.CopyTo(wav);
        "WAVE"u8.CopyTo(wav.AsSpan(8));

        Inspect(wav, "audio.png").IsValid.ShouldBeFalse();
    }

    [Fact]
    public void Rejects_a_file_too_short_to_identify()
    {
        Inspect([0x89, 0x50], "truncated.png").IsValid.ShouldBeFalse();
    }

    // -----------------------------------------------------------------------

    [Theory]
    [InlineData(512, "512 B")]
    [InlineData(2048, "2 KB")]
    [InlineData(5 * 1024 * 1024, "5 MB")]
    public void Describe_reads_as_a_size_a_person_would_say(long bytes, string expected) =>
        ImageValidation.Describe(bytes).ShouldBe(expected);
}
