using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common.Caching
{
    public interface IUserClaimsCache
    {
        Task<List<Claim>> SetAsync(string key, List<Claim> userClaims);
        Task<List<Claim>> GetAsync(string key);
        Task ClearFromCache(string key);
    }

    public class DistributedUserClaimsCache : RedisCacheBase<string, List<Claim>>, IUserClaimsCache
    {
        private readonly string _entryPrefix = "userclaims_";
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

        public DistributedUserClaimsCache(
            IDistributedCache distributedCache,
            ILogger<RedisCacheBase<string, List<Claim>>> logger) : base(distributedCache, logger)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(4)
            };
        }

        public async Task<List<Claim>> SetAsync(string key, List<Claim> userClaims)
        {
            await WriteToCache(key, userClaims);

            return userClaims;
        }

        public async Task<List<Claim>> GetAsync(string key)
        {
            var result = await ReadFromCache(key);
            if(result?.Count == 0)
            {
                return null;
            }
            return result;
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
