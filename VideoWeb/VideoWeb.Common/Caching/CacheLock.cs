using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common.Caching;

public class CacheLock(IDistributedCache distributedCache, ILogger<CacheLock> logger)
    : RedisCacheBase<string, string>(distributedCache, logger)
{
    public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; } = new () { SlidingExpiration = TimeSpan.FromHours(1) };
    protected override string GetKey(string key) => key;
    
    /// <summary>
    /// Sets a distributed cache lock with a sliding expiration. If the lock is already set, returns true.
    /// </summary>
    /// <param name="lockKey"></param>
    /// <param name="expiry"></param>
    /// <returns></returns>
    public async Task<bool> AcquireLockAsync(string lockKey, TimeSpan expiry)
    {
        var cacheAlreadyLocked = await ReadFromCache(lockKey);
        if (cacheAlreadyLocked == "locked")
            return true;
        
        CacheEntryOptions.AbsoluteExpiration = DateTimeOffset.UtcNow.Add(expiry);
        await WriteToCache(lockKey, "locked");
        return false;
    }
    
    /// <summary>
    /// Removes the lock from the distributed cache
    /// </summary>
    /// <param name="lockKey"></param>
    public async Task ReleaseLockAsync(string lockKey) => await RemoveFromCache(lockKey);
}
