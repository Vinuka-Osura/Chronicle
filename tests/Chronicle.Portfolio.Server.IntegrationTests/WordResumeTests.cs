using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;
using Chronicle.Application.Features.Certifications;
using Chronicle.Application.Features.Experience;
using Chronicle.Application.Features.Profile;
using Chronicle.Application.Features.Projects;
using Chronicle.Application.Features.Resumes;
using Chronicle.Application.Features.Skills;
using Chronicle.Domain.Enums;
using Chronicle.Portfolio.Server.Api;

namespace Chronicle.Portfolio.Server.IntegrationTests;

/// <summary>
/// The Word export, which is a file someone attaches to a job application.
/// </summary>
/// <remarks>
/// <para>
/// No database, like <see cref="SafeReturnUrlTests"/> — the writer is a pure function
/// from a DTO to bytes, and the interesting failures are all in that transformation.
/// </para>
/// <para>
/// Worth testing because every way this breaks is silent. A malformed part or an
/// unescaped ampersand produces a file that downloads happily and fails to open on
/// someone else's desk, and a section quietly dropped produces a CV that is missing a job
/// with nothing to indicate it. Neither shows up on the page this is generated from.
/// </para>
/// </remarks>
public class WordResumeTests
{
    private static ResumeDto Sample(ProfileDto? profile = null) => new(
        profile ?? new ProfileDto(
            "Ada Lovelace",
            "Software Engineer",
            "Backend engineer working on systems where being nearly right is being wrong.",
            "ada@example.com",
            "+44 7700 900000",
            "London, UK",
            "https://www.linkedin.com/in/example",
            "https://github.com/example",
            null,
            "Available at one month's notice."),
        [
            new ExperienceDto(
                Guid.NewGuid(),
                "Software Engineer",
                "Northwind & Co",
                new DateOnly(2024, 4, 1),
                null,
                "Backend work on the payments platform.",
                ["Shipped the ledger", "Cut p95 latency by 98%"],
                ["C#", ".NET"]),
        ],
        [new ResumeEducationDto("BSc Computer Science", "Distributed consensus", new DateOnly(2019, 9, 1), new DateOnly(2022, 6, 1))],
        [
            new ProjectCardDto(
                "ledger",
                "Core Banking Ledger",
                "A double-entry ledger that stays correct under concurrent posting.",
                true,
                new DateOnly(2023, 8, 1),
                null,
                ["fintech"],
                ["C#", "PostgreSQL"],
                null),
        ],
        [
            new SkillGroupDto(SkillCategory.DevOps, [
                new SkillDto("Docker", SkillCategory.DevOps, 4m, ProficiencyLevel.Advanced, 4, []),
            ]),
        ],
        [new CertificationDto("CKAD", "The Linux Foundation", new DateOnly(2025, 6, 1), null, null)]);

    /// <summary>Reads a part out of the package, so a test can assert on real bytes.</summary>
    private static string Part(byte[] docx, string path)
    {
        using var archive = new ZipArchive(new MemoryStream(docx), ZipArchiveMode.Read);
        using var stream = archive.GetEntry(path)!.Open();
        using var reader = new StreamReader(stream, Encoding.UTF8);
        return reader.ReadToEnd();
    }

    /// <summary>
    /// Section headings are the only lines written in capitals, which is what lets these
    /// tests assert on document structure without depending on the sample content.
    /// </summary>
    private static bool IsHeading(string line) => line.Length > 0 && !line.Any(char.IsLower);

    /// <summary>The text an applicant-tracking system extracts, in the order it reads it.</summary>
    private static IReadOnlyList<string> ExtractedText(byte[] docx)
    {
        var document = Part(docx, "word/document.xml");

        return [.. Regex
            .Matches(document, "<w:t[^>]*>(.*?)</w:t>", RegexOptions.Singleline)
            .Select(m => XElement.Parse($"<t>{m.Groups[1].Value}</t>").Value)];
    }

    [Theory]
    [InlineData("[Content_Types].xml")]
    [InlineData("_rels/.rels")]
    [InlineData("word/_rels/document.xml.rels")]
    [InlineData("word/document.xml")]
    public void Writes_every_part_Word_requires_to_open_the_file(string path)
    {
        var docx = WordResume.Build(Sample());

        using var archive = new ZipArchive(new MemoryStream(docx), ZipArchiveMode.Read);
        archive.GetEntry(path).ShouldNotBeNull($"a .docx without {path} will not open");
    }

    [Theory]
    [InlineData("[Content_Types].xml")]
    [InlineData("_rels/.rels")]
    [InlineData("word/_rels/document.xml.rels")]
    [InlineData("word/document.xml")]
    public void Every_part_is_well_formed_xml(string path) =>
        Should.NotThrow(() => XDocument.Parse(Part(WordResume.Build(Sample()), path)));

    /// <summary>
    /// The regression this test exists for: "Northwind &amp; Co" is a perfectly ordinary
    /// employer name and a raw ampersand is a fatal XML error, so the file downloads and
    /// then refuses to open.
    /// </summary>
    [Fact]
    public void Escapes_markup_characters_in_content()
    {
        var docx = WordResume.Build(Sample());

        Part(docx, "word/document.xml").ShouldContain("Northwind &amp; Co");
        ExtractedText(docx).ShouldContain("Software Engineer, Northwind & Co");
    }

    [Fact]
    public void Carries_every_section_in_the_order_a_cv_is_read()
    {
        var text = ExtractedText(WordResume.Build(Sample()));

        // Headings only, so the assertion is about document structure rather than about
        // the sample content this test happens to use.
        var headings = text
            .Where(IsHeading)
            .ToArray();

        headings.ShouldBe([
            "PROFESSIONAL SUMMARY",
            "EXPERIENCE",
            "EDUCATION",
            "SELECTED PROJECTS",
            "SKILLS",
            "CERTIFICATIONS",
            "AVAILABILITY",
        ]);
    }

    [Fact]
    public void Puts_the_contact_details_on_one_line_near_the_top()
    {
        var text = ExtractedText(WordResume.Build(Sample()));

        text[0].ShouldBe("Ada Lovelace");
        text[1].ShouldBe("Software Engineer");
        text[2].ShouldBe(
            "ada@example.com  |  +44 7700 900000  |  London, UK  |  " +
            "www.linkedin.com/in/example  |  github.com/example");
    }

    /// <summary>
    /// Six is what the CV shows. A role with more highlights is an editing decision, and
    /// silently printing all fourteen is how a two-page CV becomes four.
    /// </summary>
    [Fact]
    public void Stops_at_six_highlights_for_a_role()
    {
        var many = Enumerable.Range(1, 14).Select(n => $"Highlight {n}").ToArray();
        var resume = Sample() with
        {
            Roles = [Sample().Roles[0] with { Highlights = many }],
        };

        var text = ExtractedText(WordResume.Build(resume));

        text.Count(line => line.StartsWith('•')).ShouldBe(6);
        text.ShouldContain("•  Highlight 6");
        text.ShouldNotContain("•  Highlight 7");
    }

    /// <summary>
    /// A section with nothing in it is omitted rather than printed as a bare heading,
    /// which reads as an omission on a CV rather than as an absence.
    /// </summary>
    [Fact]
    public void Omits_the_sections_that_have_no_content()
    {
        var empty = new ResumeDto(Sample().Profile, [], [], [], [], []);

        var headings = ExtractedText(WordResume.Build(empty))
            .Where(IsHeading);

        headings.ShouldBe(["PROFESSIONAL SUMMARY", "AVAILABILITY"]);
    }

    /// <summary>
    /// An unfilled profile still has to produce a file rather than throw — the endpoint is
    /// public, and a 500 on a first-run site is worse than a CV with no name on it.
    /// </summary>
    [Fact]
    public void Survives_a_resume_with_no_profile()
    {
        var docx = WordResume.Build(new ResumeDto(null, [], [], [], [], []));

        Should.NotThrow(() => XDocument.Parse(Part(docx, "word/document.xml")));
        WordResume.FileName(new ResumeDto(null, [], [], [], [], [])).ShouldBe("resume.docx");
    }

    [Theory]
    [InlineData("Ada Lovelace", "Ada-Lovelace-CV.docx")]
    [InlineData("Ada  Lovelace", "Ada-Lovelace-CV.docx")]
    [InlineData("Ada (Ada) Lovelace", "Ada-Ada-Lovelace-CV.docx")]
    [InlineData("///", "resume.docx")]
    public void Names_the_file_after_the_person_on_it(string fullName, string expected)
    {
        var profile = Sample().Profile! with { FullName = fullName };

        WordResume.FileName(Sample(profile)).ShouldBe(expected);
    }
}
