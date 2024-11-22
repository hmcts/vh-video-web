using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common.Caching;

public interface ICacheLock
{
    /// <summary>
    /// Sets a distributed cache lock with a sliding expiration. If the lock is already set, returns true.
    /// </summary>
    /// <param name="lockKey"></param>
    /// <param name="expiry"></param>
    /// <returns></returns>
    public Task<bool> AcquireLockAsync(string lockKey, TimeSpan expiry);
    
    /// <summary>
    /// Removes the lock from the distributed cache
    /// </summary>
    /// <param name="lockKey"></param>
    public Task ReleaseLockAsync(string lockKey);
}

public class CacheLock(IDistributedCache distributedCache, ILogger<CacheLock> logger)
    : RedisCacheBase<string, string>(distributedCache, logger), ICacheLock
{
    public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; } = new () { SlidingExpiration = TimeSpan.FromHours(1) };
    protected override string GetKey(string key) => key;
    
    public async Task<bool> AcquireLockAsync(string lockKey, TimeSpan expiry)
    {
        var cacheAlreadyLocked = await ReadFromCache(lockKey);
        if (cacheAlreadyLocked == "locked")
            return true;
        
        CacheEntryOptions.AbsoluteExpiration = DateTimeOffset.UtcNow.Add(expiry);
        await WriteToCache(lockKey, "locked");
        return false;
    }
    public async Task ReleaseLockAsync(string lockKey) => await RemoveFromCache(lockKey);
}
