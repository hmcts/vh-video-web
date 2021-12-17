using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public class DistributedConferenceVideoControlStatusCache : RedisCacheBase<Guid, ConferenceVideoControlStatuses?>, IConferenceVideoControlStatusCache
    {
        private readonly string _entryPrefix = "video_control_statuses_";
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }
        
        public DistributedConferenceVideoControlStatusCache(IDistributedCache distributedCache) : base(distributedCache)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(4)
            };
        }

        public override string GetKey(Guid key)
        {
            return $"{_entryPrefix}{key}";
        }
    }
}
