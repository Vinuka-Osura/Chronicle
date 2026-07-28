using System.Reflection;
using System.Xml.Linq;
using Chronicle.Domain.Common;

namespace Chronicle.Domain.Tests;

/// <summary>
/// Chronicle.Domain is the innermost layer and must stay free of dependencies.
/// That rule is easy to state and easy to break by accident, so it is asserted
/// here rather than left to code review.
/// </summary>
public class ArchitectureTests
{
    private static XDocument LoadDomainProjectFile()
    {
        var path = typeof(ArchitectureTests).Assembly
            .GetCustomAttributes<AssemblyMetadataAttribute>()
            .Single(a => a.Key == "DomainProjectPath")
            .Value;

        File.Exists(path).ShouldBeTrue($"Chronicle.Domain.csproj was not found at '{path}'.");
        return XDocument.Load(path!);
    }

    [Fact]
    public void Domain_project_declares_no_package_references()
    {
        var packages = LoadDomainProjectFile()
            .Descendants("PackageReference")
            .Select(e => e.Attribute("Include")?.Value)
            .ToArray();

        packages.ShouldBeEmpty(
            "Chronicle.Domain must depend on nothing but the BCL. If you need a package, " +
            "the behaviour you are modelling belongs in Chronicle.Application.");
    }

    [Fact]
    public void Domain_project_declares_no_project_references()
    {
        var projects = LoadDomainProjectFile()
            .Descendants("ProjectReference")
            .Select(e => e.Attribute("Include")?.Value)
            .ToArray();

        projects.ShouldBeEmpty("Chronicle.Domain is the innermost layer; it references nothing.");
    }

    [Fact]
    public void Domain_assembly_references_only_framework_assemblies()
    {
        var offenders = typeof(Entity).Assembly
            .GetReferencedAssemblies()
            .Select(a => a.Name!)
            .Where(name =>
                !name.StartsWith("System", StringComparison.Ordinal) &&
                !name.Equals("netstandard", StringComparison.Ordinal) &&
                !name.Equals("mscorlib", StringComparison.Ordinal))
            .ToArray();

        offenders.ShouldBeEmpty(
            $"Chronicle.Domain picked up non-framework references: {string.Join(", ", offenders)}");
    }

    [Fact]
    public void Every_entity_derives_from_the_common_base()
    {
        var strays = typeof(Entity).Assembly
            .GetTypes()
            .Where(t => t.Namespace == "Chronicle.Domain.Entities" && t is { IsClass: true, IsAbstract: false })
            .Where(t => !typeof(Entity).IsAssignableFrom(t))
            .Select(t => t.Name)
            .ToArray();

        strays.ShouldBeEmpty($"Entities missing an Entity base class: {string.Join(", ", strays)}");
    }
}
