using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VideoWeb.Common.Caching
{
    public class DictionaryConsultationResponseCache : IConsultationResponseCache
    {
        private readonly ConcurrentDictionary<long, List<Guid>> _cache;

        public DictionaryConsultationResponseCache()
        {
            _cache = new ConcurrentDictionary<long, List<Guid>>();
        }

        public Task AddOrUpdateResponses(long roomId, List<Guid> accepted)
        {
            _cache[roomId] = accepted;
            return Task.CompletedTask;
        }

        public Task ClearResponses(long roomId)
        {
            return Task.FromResult(_cache.TryRemove(roomId, out _));
        }

        public Task<List<Guid>> GetResponses(long roomId)
        {
            return Task.FromResult(_cache.TryGetValue(roomId, out var acceptedResponses)
                ? acceptedResponses
                : new List<Guid>());
        }

        public ConcurrentDictionary<long, List<Guid>> GetCache()
        {
            return _cache;
        }
    }
}
