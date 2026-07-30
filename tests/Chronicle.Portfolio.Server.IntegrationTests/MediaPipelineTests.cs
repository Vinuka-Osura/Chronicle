using System.Net;
using Chronicle.Application.Common.Exceptions;
using Chronicle.Application.Features.Media;
using Chronicle.Application.Features.Media.Commands.DeleteProjectImage;
using Chronicle.Application.Features.Media.Commands.UploadProjectImage;
using Chronicle.Application.Features.Media.Queries.GetStorageUsage;
using Chronicle.Application.Features.Projects.Commands.SaveProject;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Chronicle.Portfolio.Server.IntegrationTests;

/// <summary>
/// Upload, serve, count, delete — against the real host and a real disk.
/// </summary>
/// <remarks>
/// The parts worth proving here are the ones no unit test can see: that the file
/// genuinely lands on disk under a server-generated key, that the static route hands it
/// back with the right type, that the gauge counts what is actually there, and that
/// deleting removes both halves rather than leaving a row pointing at nothing.
/// </remarks>
[Collection(ChronicleHostFixture.Name)]
public class MediaPipelineTests(ChronicleTestHost host) : IAsyncLifetime
{
    private static readonly byte[] Png =
        [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, .. new byte[64]];

    public async Task InitializeAsync()
    {
        await host.ResetAsync();

        if (Directory.Exists(ChronicleTestHost.MediaRoot))
        {
            Directory.Delete(ChronicleTestHost.MediaRoot, recursive: true);
        }
    }

    public Task DisposeAsync() => Task.CompletedTask;

    [Fact]
    public async Task An_upload_lands_on_disk_and_is_served_back()
    {
        var projectId = await NewProjectAsync();

        var image = await UploadAsync(projectId, "Architecture Diagram FINAL v2.png", "The posting path");

        image.SizeBytes.ShouldBe(Png.Length);
        image.ContentType.ShouldBe("image/png");
        image.Caption.ShouldBe("The posting path");

        // The key is generated server-side and carries none of the operator's filename.
        await host.ScopedAsync(async services =>
        {
            var media = await ChronicleTestHost.DbContext(services).Media.SingleAsync();

            media.StorageKey.ShouldNotContain("FINAL");
            media.StorageKey.ShouldNotContain(" ");
            media.StorageKey.ShouldEndWith(".png");

            // The original name is kept as a fact about the file, not as part of its path.
            media.Metadata.OriginalFileName.ShouldBe("Architecture Diagram FINAL v2.png");

            File.Exists(Path.Combine(ChronicleTestHost.MediaRoot, media.StorageKey)).ShouldBeTrue();
        });

        // And the static route actually serves it, with the type derived from the bytes.
        var response = await host.CreateClient().GetAsync(new Uri(image.Url, UriKind.Relative));

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.ShouldBe("image/png");
        (await response.Content.ReadAsByteArrayAsync()).ShouldBe(Png);
    }

    [Fact]
    public async Task Two_uploads_of_the_same_file_do_not_collide()
    {
        var projectId = await NewProjectAsync();

        var first = await UploadAsync(projectId, "shot.png");
        var second = await UploadAsync(projectId, "shot.png");

        first.Url.ShouldNotBe(second.Url);
        // Appended rather than inserted, so a new upload never displaces the screenshot
        // that was deliberately put first.
        second.SortOrder.ShouldBeGreaterThan(first.SortOrder);
    }

    /// <summary>
    /// The check that matters. A filename and a declared content type are both supplied
    /// by whoever is uploading; only the bytes are evidence.
    /// </summary>
    [Fact]
    public async Task A_non_image_named_as_an_image_is_rejected_and_nothing_is_written()
    {
        var projectId = await NewProjectAsync();

        var failure = await Should.ThrowAsync<ValidationException>(() =>
            UploadAsync(projectId, "screenshot.png", content: [.. "MZ"u8.ToArray(), .. new byte[64]]));

        failure.Errors.ShouldNotBeEmpty();

        await host.ScopedAsync(async services =>
            (await ChronicleTestHost.DbContext(services).Media.CountAsync()).ShouldBe(0));

        // Rejected before anything touched storage - no orphaned file to clean up.
        if (Directory.Exists(ChronicleTestHost.MediaRoot))
        {
            Directory.GetFiles(ChronicleTestHost.MediaRoot, "*", SearchOption.AllDirectories)
                .ShouldBeEmpty();
        }
    }

    [Fact]
    public async Task Svg_is_rejected_however_it_is_named()
    {
        var projectId = await NewProjectAsync();
        var svg = System.Text.Encoding.UTF8.GetBytes(
            "<svg xmlns=\"http://www.w3.org/2000/svg\"><script>alert(1)</script></svg>");

        await Should.ThrowAsync<ValidationException>(() =>
            UploadAsync(projectId, "diagram.png", content: svg));
    }

    [Fact]
    public async Task Deleting_removes_the_row_and_the_file()
    {
        var projectId = await NewProjectAsync();
        var image = await UploadAsync(projectId, "shot.png");

        var key = await host.ScopedAsync(async services =>
            (await ChronicleTestHost.DbContext(services).Media.SingleAsync()).StorageKey);

        await SendAsync(new DeleteProjectImageCommand(image.Id));

        await host.ScopedAsync(async services =>
            (await ChronicleTestHost.DbContext(services).Media.CountAsync()).ShouldBe(0));

        File.Exists(Path.Combine(ChronicleTestHost.MediaRoot, key)).ShouldBeFalse();
    }

    // -----------------------------------------------------------------------
    // The storage gauge
    // -----------------------------------------------------------------------

    [Fact]
    public async Task The_gauge_counts_what_was_uploaded()
    {
        var projectId = await NewProjectAsync();

        (await SendAsync(new GetStorageUsageQuery())).ShouldSatisfyAllConditions(
            usage => usage.UsedBytes.ShouldBe(0),
            usage => usage.FileCount.ShouldBe(0));

        await UploadAsync(projectId, "one.png");
        await UploadAsync(projectId, "two.png");

        var after = await SendAsync(new GetStorageUsageQuery());

        after.FileCount.ShouldBe(2);
        after.UsedBytes.ShouldBe(Png.Length * 2);
        after.Provider.ShouldBe("Local disk");
        // A quota is configured, so the gauge has something to measure against.
        after.PercentUsed.ShouldNotBeNull();
    }

    [Fact]
    public async Task The_gauge_falls_back_when_a_file_is_deleted()
    {
        var projectId = await NewProjectAsync();
        var image = await UploadAsync(projectId, "one.png");

        await SendAsync(new DeleteProjectImageCommand(image.Id));

        var usage = await SendAsync(new GetStorageUsageQuery());

        usage.UsedBytes.ShouldBe(0);
        usage.FileCount.ShouldBe(0);
    }

    // -----------------------------------------------------------------------

    private async Task<ProjectImageDto> UploadAsync(
        Guid projectId,
        string fileName,
        string? caption = null,
        byte[]? content = null)
    {
        using var stream = new MemoryStream(content ?? Png);

        return await SendAsync(new UploadProjectImageCommand(
            projectId, stream, fileName, stream.Length, caption));
    }

    private Task<Guid> NewProjectAsync() => SendAsync(new SaveProjectCommand(
        null,
        "Core Banking Ledger",
        "core-banking-ledger",
        "A one-line pitch.",
        "The problem.",
        "The solution.",
        null, null, null, null, null, null, null, null, null,
        new DateOnly(2025, 1, 1),
        null,
        Featured: false,
        SortOrder: 0,
        Tags: [],
        TechStack: []));

    private Task<TResponse> SendAsync<TResponse>(IRequest<TResponse> request) =>
        host.ScopedAsync(services => services.GetRequiredService<ISender>().Send(request));

    /// <summary>For commands with no response — the generic overload cannot infer those.</summary>
    private Task SendAsync(IRequest request) =>
        host.ScopedAsync(services => services.GetRequiredService<ISender>().Send(request));
}
