using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using VideoWeb.Common.Configuration;

namespace VideoWeb.Services.BackgroundService;

public class ConferenceBackgroundService(IServiceProvider serviceProvider, CacheSettings cacheSettings) : Microsoft.Extensions.Hosting.BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while(!stoppingToken.IsCancellationRequested)
        {
            var nextRunTime = DateTime.UtcNow.Date.AddDays(1).AddHours(cacheSettings.DailyRoutineTime) - DateTime.UtcNow;
            if (nextRunTime < TimeSpan.Zero)
                nextRunTime = TimeSpan.Zero;
            await Task.Delay(nextRunTime, stoppingToken);
            using var scope = serviceProvider.CreateScope();
            var loaderService = (IConferenceLoaderService)scope.ServiceProvider.GetService(typeof(IConferenceLoaderService));
            await loaderService!.LoadDailyConferencesRoutine(stoppingToken);
        }
    }
}
