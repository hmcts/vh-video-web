using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public class DistributedUserProfileCache : RedisCacheBase<string, UserProfile>, IUserProfileCache
    {
        private readonly string _entryPrefix = "userprofile_";
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

        public DistributedUserProfileCache(
            IDistributedCache distributedCache,
            ILogger<RedisCacheBase<string, UserProfile>> logger) : base(distributedCache, logger)
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

        public async Task<UserProfile> GetAsync(string key)
        {
            return await ReadFromCache(key);
        }

        public async Task<UserProfile> SetAsync(string key, UserProfile userProfile)
        { 
            await WriteToCache(key, userProfile);
            return userProfile;
        }

        public async Task ClearFromCache(string key)
        {
            await RemoveFromCache(key);
        }

        protected override string GetKey(string key)
        {
            return $"{_entryPrefix}{key}";
        }
    }
}
