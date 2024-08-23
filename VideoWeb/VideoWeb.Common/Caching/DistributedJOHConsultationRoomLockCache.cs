using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common.Caching
{
    public sealed class DistributedJOHConsultationRoomLockCache : RedisCacheBase<string , bool>,IDistributedJOHConsultationRoomLockCache
    {
        public DistributedJOHConsultationRoomLockCache(
            IDistributedCache distributedCache,
            ILogger<DistributedJOHConsultationRoomLockCache> logger) : base(distributedCache, logger)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromSeconds(15) 
            };
        }

        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }
        protected override string GetKey(string key)
        {
            return key;
        }

        public async Task UpdateJohConsultationRoomLockStatus(bool isLocked, string keyName, CancellationToken cancellationToken = default)
        {
            await WriteToCache(keyName,isLocked, cancellationToken);
        }

        public async Task<bool> IsJOHRoomLocked(string johConsultationRoomKey, CancellationToken cancellationToken = default)
        {
            return await ReadFromCache(johConsultationRoomKey, cancellationToken);
        }
    }
}
