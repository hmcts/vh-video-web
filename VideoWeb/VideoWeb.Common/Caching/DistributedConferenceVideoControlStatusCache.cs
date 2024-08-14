using Microsoft.Extensions.Caching.Distributed;
using System;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public sealed class DistributedConferenceVideoControlStatusCache : RedisCacheBase<Guid, ConferenceVideoControlStatuses>, IConferenceVideoControlStatusCache
    {
        private readonly string _entryPrefix = "video_control_statuses_";
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }
        
        public DistributedConferenceVideoControlStatusCache(
            IDistributedCache distributedCache, 
            ILogger<DistributedConferenceVideoControlStatusCache> logger) : base(distributedCache, logger)
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
