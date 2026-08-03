using System.Globalization;
using System.IO.Compression;
using System.Security;
using System.Text;
using Chronicle.Application.Features.Resumes;

namespace Chronicle.Portfolio.Server.Api;

/// <summary>
/// Writes the résumé as a Word document, for the applications that will not take a PDF.
/// </summary>
/// <remarks>
/// <para>
/// Hand-built OOXML over <see cref="ZipArchive"/> rather than the Open XML SDK. A .docx
/// is a zip of four small XML parts, and the SDK's value is in the parts this document
/// deliberately does not have — tables, sections, images, numbering. Adding ten megabytes
/// of API surface to emit headings and paragraphs would be paying for the complexity we
/// are specifically avoiding.
/// </para>
/// <para>
/// **Everything here is chosen for a parser, not a reader.** Applicant-tracking systems
/// read the document text in order and match headings against a fixed vocabulary, so:
/// one column, no tables, no text boxes, no headers or footers, no images, and section
/// headings spelled the conventional way — "Experience", "Education", "Skills" — rather
/// than the site's own voice. Bullets are a literal "• " inside an indented paragraph
/// instead of a numbering definition, because a numbering reference that a parser does
/// not resolve turns a list into one run-on line.
/// </para>
/// </remarks>
public static class WordResume
{
    private const string DocumentXmlns =
        "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

    /// <summary>Half-points, which is how OOXML sizes text: 22 = 11pt.</summary>
    private const int BodySize = 21;

    /// <summary>
    /// A font the reader is certain to have.
    /// </summary>
    /// <remarks>
    /// A CV set in something the reader lacks is re-rendered in a substitute at a
    /// different width, and two pages become three at the worst possible moment.
    /// </remarks>
    private const string BodyFont = "Calibri";

    public static byte[] Build(ResumeDto resume)
    {
        ArgumentNullException.ThrowIfNull(resume);

        var body = new StringBuilder();
        WriteHeader(body, resume);
        WriteSummary(body, resume);
        WriteExperience(body, resume);
        WriteEducation(body, resume);
        WriteProjects(body, resume);
        WriteSkills(body, resume);
        WriteCertifications(body, resume);
        WriteAvailability(body, resume);

        return Package(body.ToString());
    }

    /// <summary>The file name the browser saves it under, derived from the name on it.</summary>
    public static string FileName(ResumeDto resume)
    {
        ArgumentNullException.ThrowIfNull(resume);

        var name = resume.Profile?.FullName;
        if (string.IsNullOrWhiteSpace(name))
        {
            return "resume.docx";
        }

        var safe = new string([.. name.Select(c => char.IsLetterOrDigit(c) ? c : '-')])
            .Trim('-');

        // Collapse the runs of dashes a name with punctuation leaves behind.
        while (safe.Contains("--", StringComparison.Ordinal))
        {
            safe = safe.Replace("--", "-", StringComparison.Ordinal);
        }

        return safe.Length == 0 ? "resume.docx" : $"{safe}-CV.docx";
    }

    // ── Sections ────────────────────────────────────────────────────────────────

    private static void WriteHeader(StringBuilder body, ResumeDto resume)
    {
        var profile = resume.Profile;

        Paragraph(body, profile?.FullName ?? "Résumé", size: 32, bold: true, spaceAfter: 40);

        if (!string.IsNullOrWhiteSpace(profile?.Headline))
        {
            Paragraph(body, profile.Headline, size: 24, spaceAfter: 60);
        }

        if (profile is null)
        {
            return;
        }

        // One line, separated by pipes. A parser splits on the separator; a stack of
        // labelled lines ("Email: ...") wastes a third of the first page.
        string?[] contact =
        [
            profile.Email,
            profile.Phone,
            profile.Location,
            profile.LinkedInUrl,
            profile.GitHubUrl,
            profile.WebsiteUrl,
        ];

        var line = string.Join(
            "  |  ",
            contact.Where(v => !string.IsNullOrWhiteSpace(v)).Select(Tidy));

        if (line.Length > 0)
        {
            Paragraph(body, line, size: 19, spaceAfter: 220);
        }
    }

    private static void WriteSummary(StringBuilder body, ResumeDto resume)
    {
        if (string.IsNullOrWhiteSpace(resume.Profile?.Summary))
        {
            return;
        }

        Heading(body, "Professional Summary");
        Paragraph(body, resume.Profile.Summary, spaceAfter: 200);
    }

    private static void WriteExperience(StringBuilder body, ResumeDto resume)
    {
        if (resume.Roles.Count == 0)
        {
            return;
        }

        Heading(body, "Experience");

        foreach (var role in resume.Roles)
        {
            Paragraph(body, $"{role.Role}, {role.Company}", bold: true, spaceAfter: 0);
            Paragraph(body, Range(role.StartDate, role.EndDate), size: 19, spaceAfter: 40);

            if (!string.IsNullOrWhiteSpace(role.Summary))
            {
                Paragraph(body, role.Summary, spaceAfter: 40);
            }

            // Six is the ceiling a recruiter reads before skipping to the next role, and
            // the CMS is where the choice of which six belongs.
            foreach (var highlight in role.Highlights.Take(6))
            {
                Bullet(body, highlight);
            }

            if (role.TechStack.Count > 0)
            {
                Paragraph(
                    body,
                    $"Technologies: {string.Join(", ", role.TechStack)}",
                    size: 19,
                    spaceAfter: 180);
            }
            else
            {
                Spacer(body);
            }
        }
    }

    private static void WriteEducation(StringBuilder body, ResumeDto resume)
    {
        if (resume.Education.Count == 0)
        {
            return;
        }

        Heading(body, "Education");

        foreach (var item in resume.Education)
        {
            Paragraph(body, item.Title, bold: true, spaceAfter: 0);
            Paragraph(body, Range(item.StartDate, item.EndDate), size: 19, spaceAfter: 40);

            if (!string.IsNullOrWhiteSpace(item.Detail))
            {
                Paragraph(body, item.Detail, spaceAfter: 160);
            }
            else
            {
                Spacer(body);
            }
        }
    }

    private static void WriteProjects(StringBuilder body, ResumeDto resume)
    {
        if (resume.Projects.Count == 0)
        {
            return;
        }

        Heading(body, "Selected Projects");

        foreach (var project in resume.Projects)
        {
            Paragraph(body, project.Title, bold: true, spaceAfter: 0);
            Paragraph(body, Range(project.StartDate, project.EndDate), size: 19, spaceAfter: 40);
            Paragraph(body, project.Pitch, spaceAfter: project.TechStack.Count > 0 ? 40 : 160);

            if (project.TechStack.Count > 0)
            {
                Paragraph(
                    body,
                    $"Technologies: {string.Join(", ", project.TechStack)}",
                    size: 19,
                    spaceAfter: 160);
            }
        }
    }

    private static void WriteSkills(StringBuilder body, ResumeDto resume)
    {
        if (resume.Skills.Count == 0)
        {
            return;
        }

        Heading(body, "Skills");

        foreach (var group in resume.Skills)
        {
            // Names only, comma separated. The years are on the site; here they would sit
            // between the keyword and the matcher looking for it.
            var names = string.Join(", ", group.Skills.Select(s => s.Name));

            // The category name verbatim. Every value in the enum is already one word,
            // and the de-camel-casing this used to do turned DevOps into "Dev Ops".
            Paragraph(body, $"{group.Category}: {names}", spaceAfter: 60);
        }

        Spacer(body);
    }

    private static void WriteCertifications(StringBuilder body, ResumeDto resume)
    {
        if (resume.Certifications.Count == 0)
        {
            return;
        }

        Heading(body, "Certifications");

        foreach (var cert in resume.Certifications)
        {
            Paragraph(
                body,
                $"{cert.Name} — {cert.Issuer}, {cert.IssueDate.ToString("MMMM yyyy", CultureInfo.InvariantCulture)}",
                spaceAfter: 60);
        }

        Spacer(body);
    }

    private static void WriteAvailability(StringBuilder body, ResumeDto resume)
    {
        if (string.IsNullOrWhiteSpace(resume.Profile?.Availability))
        {
            return;
        }

        Heading(body, "Availability");
        Paragraph(body, resume.Profile.Availability);
    }

    // ── Paragraph primitives ────────────────────────────────────────────────────

    /// <summary>
    /// A section heading, as bold small-caps-sized text with a bottom rule.
    /// </summary>
    /// <remarks>
    /// Deliberately direct formatting rather than Word's built-in Heading 1 style. Parsers
    /// key off the heading *text*, and a document whose styles.xml is missing renders
    /// styled headings as body text — direct formatting cannot degrade that way.
    /// </remarks>
    private static void Heading(StringBuilder body, string text)
    {
        body.Append("<w:p><w:pPr><w:spacing w:before=\"240\" w:after=\"80\"/>")
            .Append("<w:pBdr><w:bottom w:val=\"single\" w:sz=\"6\" w:space=\"2\" w:color=\"B26B00\"/></w:pBdr>")
            .Append("</w:pPr>")
            .Append(Run(text.ToUpperInvariant(), size: 20, bold: true, color: "B26B00"))
            .Append("</w:p>");
    }

    private static void Paragraph(
        StringBuilder body,
        string text,
        int size = BodySize,
        bool bold = false,
        int spaceAfter = 120)
    {
        body.Append("<w:p><w:pPr><w:spacing w:after=\"")
            .Append(spaceAfter.ToString(CultureInfo.InvariantCulture))
            .Append("\"/></w:pPr>")
            .Append(Run(text, size, bold))
            .Append("</w:p>");
    }

    private static void Bullet(StringBuilder body, string text)
    {
        body.Append("<w:p><w:pPr><w:spacing w:after=\"40\"/>")
            .Append("<w:ind w:left=\"360\" w:hanging=\"180\"/></w:pPr>")
            .Append(Run($"•  {text}", BodySize))
            .Append("</w:p>");
    }

    /// <summary>An empty paragraph, for when a section ends without a trailing line to space.</summary>
    private static void Spacer(StringBuilder body)
        => body.Append("<w:p><w:pPr><w:spacing w:after=\"160\"/></w:pPr></w:p>");

    private static string Run(string text, int size, bool bold = false, string? color = null)
    {
        // The font is stated on every run rather than in a styles.xml default, so the
        // document stays four parts and cannot lose its typeface to a missing part.
        var properties = new StringBuilder(
            $"<w:rPr><w:rFonts w:ascii=\"{BodyFont}\" w:hAnsi=\"{BodyFont}\" w:cs=\"{BodyFont}\"/>");

        if (bold)
        {
            properties.Append("<w:b/>");
        }

        if (color is not null)
        {
            properties.Append("<w:color w:val=\"").Append(color).Append("\"/>");
        }

        properties.Append("<w:sz w:val=\"").Append(size.ToString(CultureInfo.InvariantCulture)).Append("\"/>")
            .Append("<w:szCs w:val=\"").Append(size.ToString(CultureInfo.InvariantCulture)).Append("\"/>")
            .Append("</w:rPr>");

        // xml:space="preserve" or Word eats the leading space in a bullet's hanging indent.
        return $"<w:r>{properties}<w:t xml:space=\"preserve\">{SecurityElement.Escape(text)}</w:t></w:r>";
    }

    // ── Formatting helpers ──────────────────────────────────────────────────────

    private static string Range(DateOnly start, DateOnly? end)
    {
        var from = start.ToString("MMMM yyyy", CultureInfo.InvariantCulture);
        var to = end?.ToString("MMMM yyyy", CultureInfo.InvariantCulture) ?? "Present";
        return $"{from} – {to}";
    }

    /// <summary>Strips a scheme so a link reads as a handle rather than a URL in print.</summary>
    private static string Tidy(string? value)
    {
        var text = value?.Trim() ?? string.Empty;

        foreach (var prefix in new[] { "https://", "http://" })
        {
            if (text.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                text = text[prefix.Length..];
            }
        }

        return text.TrimEnd('/');
    }

    // ── The package ─────────────────────────────────────────────────────────────

    /// <summary>
    /// The four parts that make a .docx openable: content types, the package
    /// relationship, the document relationships, and the document itself.
    /// </summary>
    private static byte[] Package(string bodyXml)
    {
        using var buffer = new MemoryStream();

        using (var archive = new ZipArchive(buffer, ZipArchiveMode.Create, leaveOpen: true))
        {
            Write(archive, "[Content_Types].xml", ContentTypes);
            Write(archive, "_rels/.rels", PackageRelationships);
            Write(archive, "word/_rels/document.xml.rels", DocumentRelationships);
            Write(archive, "word/document.xml", Document(bodyXml));
        }

        return buffer.ToArray();
    }

    private static void Write(ZipArchive archive, string path, string content)
    {
        var entry = archive.CreateEntry(path, CompressionLevel.Optimal);
        using var stream = entry.Open();
        var bytes = Encoding.UTF8.GetBytes(content);
        stream.Write(bytes, 0, bytes.Length);
    }

    private const string ContentTypes =
        """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
        </Types>
        """;

    private const string PackageRelationships =
        """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
        </Relationships>
        """;

    private const string DocumentRelationships =
        """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>
        """;

    /// <summary>A4 with 2cm margins. The typeface is set per run; see <see cref="BodyFont"/>.</summary>
    private static string Document(string bodyXml) =>
        $"""
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="{DocumentXmlns}">
          <w:body>
            {bodyXml}
            <w:sectPr>
              <w:pgSz w:w="11906" w:h="16838"/>
              <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="0" w:footer="0" w:gutter="0"/>
            </w:sectPr>
          </w:body>
        </w:document>
        """;
}
