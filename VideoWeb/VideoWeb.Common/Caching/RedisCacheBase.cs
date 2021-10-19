using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace VideoWeb.Common.Caching
{
    public abstract class RedisCacheBase<TKey, TEntry>
    {
        private readonly IDistributedCache _distributedCache;
        public DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

        public RedisCacheBase(IDistributedCache distributedCache)
        {
            _distributedCache = distributedCache;
        }

        public virtual async Task WriteToCache(TKey key, TEntry toWrite)
        {
            var serialisedLayout = JsonConvert.SerializeObject(toWrite, CachingHelper.SerializerSettings);
            var data = Encoding.UTF8.GetBytes(serialisedLayout);
            await _distributedCache.SetAsync(GetKey(key), data, CacheEntryOptions);
        }

        public virtual async Task<TEntry> ReadFromCache(TKey key)
        {
            try
            {
                var data = await _distributedCache.GetAsync(GetKey(key));
                var profileSerialised = Encoding.UTF8.GetString(data);
                var layout =
                    JsonConvert.DeserializeObject<TEntry>(profileSerialised,
                        CachingHelper.SerializerSettings);
                return layout;
            }
            catch (Exception)
            {
                return default(TEntry);
            }
        }

        public abstract string GetKey(TKey key);
    }
}
