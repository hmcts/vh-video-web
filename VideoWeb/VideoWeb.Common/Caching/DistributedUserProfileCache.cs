using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching
{
    public sealed class DistributedUserProfileCache : RedisCacheBase<string, UserProfile>, IUserProfileCache
    {
        private readonly string _entryPrefix = "userprofile_";
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

        public DistributedUserProfileCache(
            IDistributedCache distributedCache,
            ILogger<DistributedUserProfileCache> logger) : base(distributedCache, logger)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(4)
            };
        }

        public async Task<UserProfile> GetOrAddAsync(string key, UserProfile userProfile, CancellationToken cancellationToken = default)
        {
            var profile = await ReadFromCache(key, cancellationToken);

            if (profile != null) return profile;
            await WriteToCache(key, userProfile, cancellationToken);

            return userProfile;
        }

        public async Task<UserProfile> GetAsync(string key, CancellationToken cancellationToken = default)
        {
            return await ReadFromCache(key, cancellationToken);
        }

        public async Task<UserProfile> SetAsync(string key, UserProfile userProfile, CancellationToken cancellationToken = default)
        { 
            await WriteToCache(key, userProfile, cancellationToken);
            return userProfile;
        }

        public async Task ClearFromCache(string key, CancellationToken cancellationToken = default)
        {
            await RemoveFromCache(key, cancellationToken);
        }

        protected override string GetKey(string key)
        {
            return $"{_entryPrefix}{key}";
        }
    }
}
