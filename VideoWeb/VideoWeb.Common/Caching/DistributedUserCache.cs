using System;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using VideoWeb.Services.User;

namespace VideoWeb.Common.Caching
{
    public class DistributedUserCache : IUserCache
    {
        private readonly IDistributedCache _distributedCache;

        public DistributedUserCache(IDistributedCache distributedCache)
        {
            _distributedCache = distributedCache;
        }

        public async Task<UserProfile> GetOrAddAsync(string key, Func<string, Task<UserProfile>> valueFactory)
        {

            var profile = GetProfileFromCache(key);
            if (profile != null) return profile;
            
            profile = await valueFactory.Invoke(key);
            var serialisedProfile = JsonConvert.SerializeObject(profile, CachingHelper.SerializerSettings);

            var data = Encoding.UTF8.GetBytes(serialisedProfile);
            await _distributedCache.SetAsync(key, data,
                new DistributedCacheEntryOptions
                {
                    SlidingExpiration = TimeSpan.FromHours(4)
                });

            return profile;
        }

        private UserProfile GetProfileFromCache(string key)
        {
            try
            {
                var data = _distributedCache.Get(key);
                var profileSerialised = Encoding.UTF8.GetString(data);
                var profile =
                    JsonConvert.DeserializeObject<UserProfile>(profileSerialised, CachingHelper.SerializerSettings);
                return profile;
            }
            catch (Exception)
            {
                return null;
            }
        }
        
        
    }
}
