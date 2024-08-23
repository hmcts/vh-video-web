using Microsoft.Extensions.Caching.Distributed;
using System;
using Microsoft.Extensions.Logging;
using VideoApi.Contract.Requests;

namespace VideoWeb.Common.Caching
{
    public sealed class DistributedHearingLayoutCache : RedisCacheBase<Guid, HearingLayout?>, IHearingLayoutCache
    {
        private readonly string _entryPrefix = "layout_";
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }
        
        public DistributedHearingLayoutCache(
            IDistributedCache distributedCache,
            ILogger<DistributedHearingLayoutCache> logger) : base(distributedCache, logger)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(4)
            };
        }

        protected override string GetKey(Guid key)
        {
            return $"{_entryPrefix}{key}";
        }
    }
}
