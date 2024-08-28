using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common.Caching;

public sealed class DistributedTestCallCache : RedisCacheBase<string, bool>, ITestCallCache
{
    public DistributedTestCallCache(
        IDistributedCache distributedCache,
        ILogger<DistributedTestCallCache> logger) : base(distributedCache, logger)
    {
        CacheEntryOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpiration = DateTimeOffset.UtcNow.Date.AddDays(1)
        };
    }

    public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

    protected override string GetKey(string key)
    {
        return $"{key}_SelfTestCompleted";
    }

    public Task AddTestCompletedForTodayAsync(string username, CancellationToken cancellationToken = default)
    {
        return WriteToCache(username, true, cancellationToken);
    }

    public Task<bool> HasUserCompletedATestToday(string username, CancellationToken cancellationToken = default)
    {
        return ReadFromCache(username, cancellationToken);
    }
}
