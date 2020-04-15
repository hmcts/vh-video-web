using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using VideoWeb.Services.User;

namespace VideoWeb.Common.Caching
{
    public class DictionaryUserCache : IUserCache
    {
        private readonly ConcurrentDictionary<string, Task<UserProfile>> _cache;
        
        public DictionaryUserCache()
        {
            _cache = new ConcurrentDictionary<string, Task<UserProfile>>();
        }
        public async Task<UserProfile> GetOrAddAsync(string key, Func<string, Task<UserProfile>> valueFactory)
        {
            return await _cache.GetOrAdd(key, valueFactory);
        }
    }
}
