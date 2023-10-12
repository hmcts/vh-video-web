using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;

namespace VideoWeb.Common.Caching;

public sealed class DistributedTestCallCache : RedisCacheBase<string, bool>, ITestCallCache
{
    public DistributedTestCallCache(IDistributedCache distributedCache) : base(distributedCache)
    {
        CacheEntryOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpiration = DateTimeOffset.UtcNow.Date
        };
    }

    public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }
        
    public override string GetKey(string key)
    {
        return $"{key}_SelfTestCompleted";
    }

    public Task AddTestCompletedForTodayAsync(string username)
    {
        return WriteToCache(username, true);
    }

    public Task<bool> HasUserCompletedATestToday(string username)
    {
        return ReadFromCache(username);
    }
}
