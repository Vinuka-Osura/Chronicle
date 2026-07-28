using Microsoft.Extensions.Configuration;

var builder = DistributedApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
// Aspire's AddPostgres() starts a container, and there is no container runtime on the
// development machine this was built on. Default to the locally installed PostgreSQL
// instead, and keep the container path one config flag away:
//
//   dotnet user-secrets set "Chronicle:UseContainerDb" "true"   (needs Docker/Podman)
//
// Either way the server sees the same "chronicledb" connection name, so nothing
// downstream knows or cares which one is running.
var useContainerDb = builder.Configuration.GetValue("Chronicle:UseContainerDb", false);

IResourceBuilder<IResourceWithConnectionString> database = useContainerDb
    ? builder.AddPostgres("postgres")
        .WithDataVolume()
        .WithPgWeb()
        .AddDatabase("chronicledb")
    : builder.AddConnectionString("chronicledb");

// ---------------------------------------------------------------------------
// API + admin CMS
// ---------------------------------------------------------------------------
var server = builder.AddProject<Projects.Chronicle_Portfolio_Server>("portfolio-server")
    .WithReference(database)
    .WaitFor(database)
    .WithExternalHttpEndpoints();

builder.Build().Run();
