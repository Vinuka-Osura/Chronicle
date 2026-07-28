using System.Reflection;
using Chronicle.Application.Common.Behaviours;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Chronicle.Application;

public static class DependencyInjection
{
    /// <summary>
    /// Registers MediatR, every FluentValidation validator in this assembly, and the
    /// request pipeline.
    /// </summary>
    /// <remarks>
    /// Pipeline order matters and is deliberate. Registration order is execution order,
    /// outermost first:
    /// <list type="number">
    ///   <item>Unhandled exception - outermost, so it sees failures from every stage below.</item>
    ///   <item>Performance - times validation plus handler, which is what a caller waits for.</item>
    ///   <item>Validation - last, so an invalid request is rejected before the handler runs.</item>
    /// </list>
    /// </remarks>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddValidatorsFromAssembly(assembly, includeInternalTypes: true);

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(UnhandledExceptionBehaviour<,>));
            cfg.AddOpenBehavior(typeof(PerformanceBehaviour<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehaviour<,>));
        });

        return services;
    }
}
