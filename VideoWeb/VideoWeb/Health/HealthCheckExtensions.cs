using System;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using VideoWeb.Common.Configuration;

namespace VideoWeb.Health;

[ExcludeFromCodeCoverage]
public static class HealthCheckExtensions
{
    private static readonly string[] Tags = ["startup", "readiness"];
    public static IServiceCollection AddVhHealthChecks(this IServiceCollection services)
    {
        var container = services.BuildServiceProvider();
        var connectionStrings = container.GetService<ConnectionStrings>();
        var servicesConfiguration = container.GetService<IOptions<HearingServicesConfiguration>>().Value;
        services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy())
            .AddRedis(connectionStrings.RedisCache, tags: Tags)
            .AddUrlGroup(
                new Uri(
                    new Uri(servicesConfiguration.VideoApiUrl),
                    "/health/liveness"),
                name: "Video API",
                failureStatus: HealthStatus.Unhealthy,
                tags:Tags)
            .AddUrlGroup(
                new Uri(
                    new Uri(servicesConfiguration.BookingsApiUrl),
                    "/health/liveness"),
                name: "Bookings API",
                failureStatus: HealthStatus.Unhealthy,
                tags:Tags);
        return services;
    }
    
    public static IEndpointRouteBuilder AddVhHealthCheckRouteMaps(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHealthChecks("/health/liveness", new HealthCheckOptions()
        {
            Predicate = check => check.Tags.Contains("self"),
            ResponseWriter = HealthCheckResponseWriter
        });

        endpoints.MapHealthChecks("/health/startup", new HealthCheckOptions()
        {
            Predicate = check => check.Tags.Contains("startup"),
            ResponseWriter = HealthCheckResponseWriter
        });
                
        endpoints.MapHealthChecks("/health/readiness", new HealthCheckOptions()
        {
            Predicate = check => check.Tags.Contains("readiness"),
            ResponseWriter = HealthCheckResponseWriter
        });
        
        return endpoints;
    }
    
    private static async Task HealthCheckResponseWriter(HttpContext context, HealthReport report)
    {
        var result = JsonConvert.SerializeObject(new
        {
            status = report.Status.ToString(),
            details = report.Entries.Select(e => new
            {
                key = e.Key, value = Enum.GetName(typeof(HealthStatus), e.Value.Status),
                error = e.Value.Exception?.Message
            })
        });
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync(result);
    }
}
