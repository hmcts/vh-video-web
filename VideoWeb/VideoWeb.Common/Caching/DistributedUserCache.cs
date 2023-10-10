using System;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public class DistributedUserCache : RedisCacheBase<string, Models.UserProfile>, IUserCache
    {
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

        public DistributedUserCache(IDistributedCache distributedCache) : base(distributedCache)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(4)
            };
        }

        public async Task<UserProfile> GetOrAddAsync(string key, UserProfile userProfile)
        {
            var profile = await ReadFromCache(key);

            if (profile != null) return profile;
            await WriteToCache(key, userProfile);

            return userProfile;
        }
        public override string GetKey(string key)
        {
            return key;
        }
    }
}
