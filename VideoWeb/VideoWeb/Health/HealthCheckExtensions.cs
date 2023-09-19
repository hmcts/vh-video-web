using System;
using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using VideoWeb.Common.Configuration;

namespace VideoWeb.Health;

[ExcludeFromCodeCoverage]
public static class HealthCheckExtensions
{
    public static IServiceCollection AddVhHealthChecks(this IServiceCollection services)
    {
        var container = services.BuildServiceProvider();
        var connectionStrings = container.GetService<ConnectionStrings>();
        var servicesConfiguration = container.GetService<IOptions<HearingServicesConfiguration>>().Value;
        services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy())
            .AddRedis(connectionStrings.RedisCache, tags: new[] {"startup", "readiness"})
                // .AddUrlGroup(
                // need a private endpoint o check signalr health
                // new Uri(
                //     new Uri(new ServiceEndpoint(connectionStrings.SignalR).Endpoint),
                //     "/api/v1/health"),
                // name: "SignalR Azure Hub",
                // failureStatus: HealthStatus.Unhealthy,
                // tags: new[] {"startup", "readiness"})
            .AddUrlGroup(
                new Uri(
                    new Uri(servicesConfiguration.VideoApiUrl),
                    "/health/health"),
                name: "Video API",
                failureStatus: HealthStatus.Unhealthy,
                tags: new[] {"startup", "readiness"})
            .AddUrlGroup(
                new Uri(
                    new Uri(servicesConfiguration.BookingsApiUrl),
                    "/health/health"),
                name: "Bookings API",
                failureStatus: HealthStatus.Unhealthy,
                tags: new[] {"startup", "readiness"})
            .AddUrlGroup(
                new Uri(
                    new Uri(servicesConfiguration.UserApiUrl),
                    "/health/health"),
                name: "User API",
                failureStatus: HealthStatus.Unhealthy,
                tags: new[] {"startup", "readiness"});
        return services;
    }
}
