using Chronicle.Portfolio.Server.Components.Account;

namespace Chronicle.Portfolio.Server.IntegrationTests;

/// <summary>
/// The sign-in page sends the visitor wherever <c>?returnUrl=</c> says, and that value
/// arrives from whoever built the link. These pin down that it can only ever be a
/// same-site path.
/// </summary>
public class SafeReturnUrlTests
{
    [Theory]
    [InlineData("/admin")]
    [InlineData("/admin/projects")]
    [InlineData("/admin/posts?draft=true")]
    public void Keeps_local_paths(string candidate) =>
        Login.SafeReturnUrl(candidate).ShouldBe(candidate);

    [Theory]
    // Protocol-relative: a browser resolves these as absolute URLs to another host,
    // even though Uri.IsWellFormedUriString calls them well-formed relative URIs.
    [InlineData("//evil.example")]
    [InlineData("//evil.example/admin")]
    [InlineData("/\\evil.example")]
    // Absolute URLs.
    [InlineData("https://evil.example")]
    [InlineData("http://evil.example/admin")]
    // Not rooted, so it would resolve against the current directory.
    [InlineData("admin")]
    [InlineData("../admin")]
    // Absent or meaningless.
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Rejects_anything_that_could_leave_the_site(string? candidate) =>
        Login.SafeReturnUrl(candidate).ShouldBe("/admin");
}
