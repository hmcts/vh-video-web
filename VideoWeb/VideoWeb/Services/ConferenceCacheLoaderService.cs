using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VideoWeb.Common;
using VideoWeb.Common.Caching;

namespace VideoWeb.Services;

public class ConferenceCacheLoaderService(CacheLock cacheLock, 
    ConferenceService conferenceService,
    ILogger<ConferenceCacheLoaderService> logger)
    : BackgroundService
{
    private const string LockKey = "conference_data_loader_lock";
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Run once daily at 1:00am
                var nextRunTime = DateTime.Today.AddDays(1).AddHours(1) - DateTime.UtcNow;
                if (nextRunTime < TimeSpan.Zero)
                    nextRunTime = TimeSpan.Zero;
                
                await Task.Delay(nextRunTime, stoppingToken);
                if (await cacheLock.AcquireLockAsync(LockKey, TimeSpan.FromHours(2)))
                {
                    try
                    {
                        logger.LogInformation("Populating Conference Cache");
                        await conferenceService.PopulateConferenceCacheForToday(stoppingToken);
                    }
                    finally
                    {
                        await cacheLock.ReleaseLockAsync(LockKey);
                        logger.LogInformation("Lock released");
                    }
                }
                else
                {
                    logger.LogInformation("Another VideoWeb instance is already processing the job");
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred while executing Redis data load");
            }
        }
    }
}
