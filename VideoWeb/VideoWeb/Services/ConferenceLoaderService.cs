using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Configuration;
using VideoWeb.Common.Logging;

namespace VideoWeb.Services;

public interface IConferenceLoaderService
{
    public Task LoadDailyConferencesRoutine(CancellationToken stoppingToken);
}

public class ConferenceLoaderService(ICacheLock cacheLock, 
    IConferenceService conferenceService, 
    ILogger<ConferenceLoaderService> logger, 
    CacheSettings cacheSettings)
    : IConferenceLoaderService
{
    private const string LockKey = "conference_data_loader_lock";
    public async Task LoadDailyConferencesRoutine(CancellationToken stoppingToken)
    {
        try
        {
            await cacheLock.ReleaseLockAsync(LockKey);
            // If lock already exists likely already running by another instance, will set lock if it doesnt exist
            var currentlyLocked = await cacheLock.AcquireLockAsync(LockKey, TimeSpan.FromHours(cacheSettings.LockDuration));
            if (!currentlyLocked)
            {
                try
                {
                    logger.LogPopulatingConferenceCache();
                    await conferenceService.PopulateConferenceCacheForToday(stoppingToken);
                }
                finally
                {
                    await cacheLock.ReleaseLockAsync(LockKey);
                    logger.LogLockReleased();
                }
            }
            else
            {
                logger.LogAnotherInstanceProcessing();
            }
        }
        catch (Exception ex)
        {
            logger.LogErrorPopulatingConferenceCache(ex);
        }
    }
}
