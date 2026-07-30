using Chronicle.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Chronicle.Application.Features.Media.Queries.GetStorageUsage;

/// <summary>How much media storage is in use, and against what ceiling.</summary>
public sealed record GetStorageUsageQuery : IRequest<StorageUsageDto>;

public sealed class GetStorageUsageQueryHandler(IChronicleDbContext db, IMediaStorage storage)
    : IRequestHandler<GetStorageUsageQuery, StorageUsageDto>
{
    public async Task<StorageUsageDto> Handle(
        GetStorageUsageQuery request,
        CancellationToken cancellationToken)
    {
        /*
          Summed from the database, not by listing the bucket.

          Listing is a Class A operation on R2 - the billable kind - and it would run on
          every admin page load to answer a question we already recorded at upload time.
          The two can only disagree if something wrote to the bucket outside this
          application, which nothing does.
        */
        var usage = await db.Media
            .AsNoTracking()
            .GroupBy(_ => 1)
            .Select(g => new { Bytes = g.Sum(m => m.SizeBytes), Count = g.Count() })
            .FirstOrDefaultAsync(cancellationToken)
            .ConfigureAwait(false);

        var info = storage.Describe();

        return new StorageUsageDto(
            info.Provider,
            info.Location,
            usage?.Bytes ?? 0,
            info.QuotaBytes,
            usage?.Count ?? 0);
    }
}
