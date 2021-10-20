using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;

namespace VideoWeb.Common.Caching
{
    public class DistributedHearingLayoutCache : RedisCacheBase<Guid, HearingLayout?>, IHearingLayoutCache
    {
        private readonly string _entryPrefix = "layout_";
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }


        public DistributedHearingLayoutCache(IDistributedCache distributedCache) : base(distributedCache)
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
