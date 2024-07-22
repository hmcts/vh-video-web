using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using System;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace VideoWeb.Common.Caching
{
    public abstract class RedisCacheBase<TKey, TEntry>
    {
        private readonly IDistributedCache _distributedCache;
        private readonly ILogger<RedisCacheBase<TKey, TEntry>> _logger;
        public abstract DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

        protected RedisCacheBase(
            IDistributedCache distributedCache, 
            ILogger<RedisCacheBase<TKey, TEntry>> logger)
        {
            _distributedCache = distributedCache;
            _logger = logger;
        }

        public virtual async Task WriteToCache(TKey key, TEntry toWrite)
        {
            if(Equals(key, default(TKey)))
                throw new ArgumentNullException(nameof(key));
            if (CacheEntryOptions == null)
                throw new InvalidOperationException($"Cannot write to cache without setting the {nameof(CacheEntryOptions)}");

            var serialisedLayout = JsonConvert.SerializeObject(toWrite, CachingHelper.SerializerSettings);
            var data = Encoding.UTF8.GetBytes(serialisedLayout);

            try
            {
                await _distributedCache.SetAsync(GetKey(key), data, CacheEntryOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error writing to cache for key {Key}", GetKey(key));
            }
        }

        public virtual async Task<TEntry> ReadFromCache(TKey key)
        {
            return await ReadFromCacheWithType<TEntry>(key);
        }
        
        public virtual async Task<TResult> ReadFromCache<TResult>(TKey key)
        {
            return await ReadFromCacheWithType<TResult>(key);
        }

        private async Task<TResult> ReadFromCacheWithType<TResult>(TKey key)
        {
            try
            {
                var data = await _distributedCache.GetAsync(GetKey(key));
                if(data == null) return default;
                
                var dataAsString = Encoding.UTF8.GetString(data);
                var deserialisedObject =
                    JsonConvert.DeserializeObject<TResult>(dataAsString,
                        new JsonSerializerSettings
                        {
                            TypeNameHandling = TypeNameHandling.None, Formatting = Formatting.None
                        });
                return deserialisedObject;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading from cache {CacheName} for key {Key}",this.GetType().Name, GetKey(key));
                return default;
            }
        }

        protected virtual async Task RemoveFromCache(TKey key)
        {
            try
            {
                await _distributedCache.RemoveAsync(GetKey(key));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing from cache for key {Key}", GetKey(key));
            }
            
        }

        protected abstract string GetKey(TKey key);
    }
}
