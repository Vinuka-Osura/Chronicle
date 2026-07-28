using Chronicle.Application.Common.Models;

namespace Chronicle.Application.Common.Interfaces;

/// <summary>
/// Port over the retrieval-augmented answer service behind <c>/ask</c>.
/// </summary>
/// <remarks>
/// Phase 3, and deliberately last. The abstraction exists now so the provider - local
/// Ollama, a free-tier API, or a paid one - can be swapped without touching the API
/// surface. Nothing else in the system depends on this.
/// </remarks>
public interface ICopilotService
{
    Task<CopilotAnswer> AskAsync(string question, CancellationToken cancellationToken = default);
}
