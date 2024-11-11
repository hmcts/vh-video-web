using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common.Caching;

public sealed class DistributedJohConsultationRoomLockCache(
    IDistributedCache distributedCache,
    ILogger<DistributedJohConsultationRoomLockCache> logger)
    : RedisCacheBase<string, bool>(distributedCache, logger), IDistributedJohConsultationRoomLockCache
{
    public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; } = new()
    {
        SlidingExpiration = TimeSpan.FromSeconds(15)
    };
    
    protected override string GetKey(string key)
    {
        return key;
    }
    
    public async Task UpdateJohConsultationRoomLockStatus(bool isLocked, string keyName, CancellationToken cancellationToken = default)
    {
        await WriteToCache(keyName,isLocked, cancellationToken);
    }
    
    public async Task<bool> IsJohRoomLocked(string johConsultationRoomKey, CancellationToken cancellationToken = default)
    {
        return await ReadFromCache(johConsultationRoomKey, cancellationToken);
    }
}
