using Microsoft.Extensions.Configuration;

var builder = DistributedApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
// Aspire's AddPostgres() starts a container, and there is no container runtime on the
// machine this was built on. Default to the locally installed PostgreSQL instead, and
// keep the container path one flag away:
//
//   dotnet user-secrets set "Chronicle:UseContainerDb" "true"    (needs Docker/Podman)
//
// Either way the server sees the same "chronicledb" connection name, so nothing
// downstream knows or cares which one is running.
var useContainerDb = builder.Configuration.GetValue("Chronicle:UseContainerDb", false);

IResourceBuilder<IResourceWithConnectionString> database = useContainerDb
    ? builder.AddPostgres("postgres")
        .WithDataVolume()
        .AddDatabase("chronicledb")
    : builder.AddConnectionString("chronicledb");

// ---------------------------------------------------------------------------
// API + admin CMS
// ---------------------------------------------------------------------------
var server = builder.AddProject<Projects.Chronicle_Portfolio_Server>("portfolio-server")
    .WithReference(database)
    .WaitFor(database)
    .WithExternalHttpEndpoints();

// ---------------------------------------------------------------------------
// Public site
// ---------------------------------------------------------------------------
// Aspire runs `npm run dev` and assigns the port, so neither side hardcodes the other's
// address: the client learns the API's URL here, and the server learns the client's
// origin for CORS. That is the whole reason the frontend lives in this solution.
// AddNextJsApp rather than the generic AddJavaScriptApp: Aspire 13 knows how Next's
// dev server reports readiness and how it takes its port, so the dashboard shows an
// accurate state instead of "running" the moment the process spawns.
//
// It ships behind an evaluation diagnostic, suppressed here rather than in the csproj so
// the opt-in stays visible at the call site. The blast radius is one line of local dev
// orchestration - nothing deployed depends on it - so an API that may still change is an
// acceptable trade for the better dev loop. Revisit when Aspire stabilises it.
#pragma warning disable ASPIREJAVASCRIPT001
var client = builder
    .AddNextJsApp("portfolio-client", "../Chronicle.Portfolio/Chronicle.Portfolio.Client")
    .WithNpm()
    .WithReference(server)
    .WaitFor(server)
    .WithHttpEndpoint(env: "PORT")
    .WithEnvironment("NEXT_PUBLIC_API_BASE_URL", server.GetEndpoint("http"))
    .WithExternalHttpEndpoints();
#pragma warning restore ASPIREJAVASCRIPT001

// Bound after the fact rather than with WaitFor, which would deadlock the two on
// each other. CORS only needs the URL, not a running client.
server.WithEnvironment("Cors__AllowedOrigins__0", client.GetEndpoint("http"));

builder.Build().Run();
