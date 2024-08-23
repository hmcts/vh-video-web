using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using VideoWeb.Services;

namespace VideoWeb.Extensions;

public static class CacheInitialisation
{
    public static void SeedCacheWithReferenceData(this IApplicationBuilder app)
    {
        using var serviceScope = app.ApplicationServices.CreateScope();
        var referenceDataService = serviceScope.ServiceProvider.GetService<IReferenceDataService>();
        referenceDataService.InitialiseCache();
    }
}
