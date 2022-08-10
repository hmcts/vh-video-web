using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;

namespace VideoWeb.Common.Caching
{
    public class DistributedJOHConsultationRoomLockCache : RedisCacheBase<string , bool>,IDistributedJOHConsultationRoomLockCache
    {
        public DistributedJOHConsultationRoomLockCache(IDistributedCache distributedCache) : base(distributedCache)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromSeconds(15) 
            };
        }

        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }
        public override string GetKey(string key)
        {
            return key;
        }

        public async Task UpdateJohConsultationRoomLockStatus(bool isLocked, string keyName)
        {
            await base.WriteToCache(keyName,isLocked);
        }

        public async Task<bool> IsJOHRoomLocked(string johConsultationRoomKey)
        {
            return await base.ReadFromCache(johConsultationRoomKey);
        }
    }
}
