using Chronicle.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;

namespace Chronicle.Portfolio.Server.Api.Endpoints;

public static class AccountEndpoints
{
    public static IEndpointRouteBuilder MapAccountEndpoints(this IEndpointRouteBuilder app)
    {
        // POST, not GET: signing out is a state change, and a GET logout link can be
        // triggered by any <img> tag on any page the admin happens to visit.
        app.MapPost("/admin/logout", async (SignInManager<ApplicationUser> signInManager) =>
            {
                await signInManager.SignOutAsync().ConfigureAwait(false);
                return Results.LocalRedirect("~/admin/login");
            })
            .ExcludeFromDescription();

        return app;
    }
}
