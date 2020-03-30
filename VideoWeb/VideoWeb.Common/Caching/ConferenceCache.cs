using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.Common.Models;
using VideoWeb.Services.Video;

namespace VideoWeb.Common.Caching
{
    public class ConferenceCache : IConferenceCache
    {
        private readonly IMemoryCache _memoryCache;

        public ConferenceCache(IMemoryCache memoryCache) 
        {
            _memoryCache = memoryCache;
        }

        public async Task AddConferenceToCache(ConferenceDetailsResponse conferenceResponse)
        {
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse);
            
            await _memoryCache.GetOrCreateAsync(conference.Id, entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(4);
                return Task.FromResult(conference);
            });
        }

        public Conference GetConference(Guid id)
        {
            return _memoryCache.Get<Conference>(id);
        }
    }
}
