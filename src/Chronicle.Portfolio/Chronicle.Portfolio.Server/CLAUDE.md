# Chronicle.Portfolio.Server — conventions

One ASP.NET Core host, two surfaces separated by route and auth policy:

- `/api/*` — anonymous, output-cached, CORS-locked, rate-limited. Consumed by the client.
- `/admin/*` — Blazor Server CMS behind Identity.

Root conventions: `../../../CLAUDE.md`.

## Endpoints

Minimal APIs under `Api/Endpoints`, one static class per resource, mapped from
`Program.cs`. Endpoints translate HTTP into a MediatR request and nothing else — no
business logic, no data access.

Group a resource when it has more than one route or a query filter (`Projects`,
`Posts`). Single-route resources share `ContentEndpoints`, because a file per one-line
route is ceremony without a seam.

**Every API group is cached and tagged:**

```csharp
.CacheOutput(p => p.Expire(TimeSpan.FromSeconds(60)).Tag(CacheTags.Projects))
.RequireRateLimiting("api")
```

Add `.SetVaryByQuery(...)` for any filter, or every caller gets the first caller's
filtered result.

Give each endpoint `.WithName`, `.WithSummary` and a `.Produces<T>()`; that is what
`/scalar/v1` renders, and it is the client's contract.

## Cache invalidation is the contract

Commands that change a resource **must** call `IContentCacheInvalidator.EvictAsync` with
the same tag, or the CMS will look broken to whoever just saved — they press save,
reload, see the old content, and cannot tell whether the save worked.

Tag a page's cache with everything it derives from, not just its own resource. The
skills page is tagged `skills`, `projects` and `experience`, because editing a project
changes what it shows even though no skill row moved.

## Errors

`GlobalExceptionHandler` maps to RFC-7807 ProblemDetails. Expected failures —
`ValidationException`, `NotFoundException` — carry their message through, because the
caller caused them and needs to know what to fix.

**Anything unexpected is deliberately opaque outside Development.** The detail is logged
server-side; a public API must not leak stack traces or connection strings to whoever
asked.

## Admin

**The login page is static SSR on purpose — do not add `@rendermode` to it.**
`SignInManager` writes an auth cookie, which needs a live `HttpContext` with unsent
response headers. An interactive Server circuit runs over a WebSocket long after headers
are flushed, so signing in from one silently fails to set the cookie. A plain form POST
is the correct mechanism, not a fallback.

Other admin rules:

- Identity's cookie paths are pointed at `/admin/*` in `AddInfrastructure`. Without that
  the middleware bounces unauthenticated visitors to `/Account/Login`, which does not
  exist here.
- Wrong password and unknown email return **the same message**, so the form cannot be
  used to enumerate accounts.
- Return URLs go through `Login.SafeReturnUrl`, which requires a single leading slash.
  `//evil.example` is a well-formed relative URI that browsers resolve as
  protocol-relative — an open redirect. There are tests for this.
- Sign-out is **POST with an antiforgery token**, never a GET link that any `<img>` tag
  could trigger.
- No Bootstrap. `wwwroot/app.css` is hand-written and reuses the public site's
  mission-control palette, so the two do not feel like different products.

## Pipeline order

In `Program.cs`, and it matters: exception handler → HTTPS → CORS → rate limiter →
output cache → authentication → authorisation → **antiforgery** → endpoints.

Antiforgery must follow authentication, because Blazor's admin form tokens are bound to
the authenticated user.

## OpenAPI

Built-in .NET 10 `AddOpenApi()` with a Scalar UI at `/scalar/v1`. **Swashbuckle is
deliberately not used.**

The document filters to `api/` paths, so Blazor's component endpoints stay out of the
public contract.
