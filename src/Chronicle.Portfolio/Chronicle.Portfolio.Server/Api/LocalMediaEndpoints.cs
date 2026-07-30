using Chronicle.Application.Common.Interfaces;
using Chronicle.Infrastructure.Services.Media;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;

namespace Chronicle.Portfolio.Server.Api;

/// <summary>
/// Serves uploads back when the local-disk adapter is in use.
/// </summary>
/// <remarks>
/// Only wired up when local disk is actually the provider. With R2 the browser fetches
/// from Cloudflare directly and this host never sees the request, so mapping the route
/// anyway would expose a directory nothing writes to.
/// </remarks>
public static class LocalMediaEndpoints
{
    public static WebApplication MapLocalMedia(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        if (app.Services.GetRequiredService<IMediaStorage>() is not LocalDiskMediaStorage local)
        {
            return app;
        }

        var options = app.Services.GetRequiredService<IOptions<MediaStorageOptions>>().Value.LocalDisk;

        // The folder does not exist until the first upload, and StaticFiles throws on a
        // missing physical path.
        Directory.CreateDirectory(local.RootPath);

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(local.RootPath),
            RequestPath = options.PublicPath.TrimEnd('/'),

            /*
              Serve only the formats the upload validator accepts, and serve nothing else
              at all. The default provider maps hundreds of extensions; restricting it
              means that even if something unexpected ever lands in this folder, the
              server will not hand it back as executable content.
            */
            ContentTypeProvider = new FileExtensionContentTypeProvider(
                new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
                {
                    [".png"] = "image/png",
                    [".jpg"] = "image/jpeg",
                    [".jpeg"] = "image/jpeg",
                    [".gif"] = "image/gif",
                    [".webp"] = "image/webp",
                    [".avif"] = "image/avif"
                }),
            ServeUnknownFileTypes = false,

            OnPrepareResponse = context =>
            {
                // Keys carry a Version 7 GUID and are never reused, so an object at a
                // given URL is immutable and can be cached for a year.
                context.Context.Response.Headers.CacheControl =
                    "public, max-age=31536000, immutable";

                // Belt and braces: nothing here is HTML, and this stops a browser from
                // deciding otherwise on the strength of the bytes.
                context.Context.Response.Headers.XContentTypeOptions = "nosniff";
            }
        });

        return app;
    }
}
