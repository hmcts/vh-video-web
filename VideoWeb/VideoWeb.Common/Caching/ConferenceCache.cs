using System;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Contract.V2.Responses;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public class ConferenceCache : IConferenceCache
    {
        private readonly IMemoryCache _memoryCache;
        
        public ConferenceCache(IMemoryCache memoryCache)
        {
            _memoryCache = memoryCache;
        }
        
        public async Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse, HearingDetailsResponseV2 hearingDetailsResponse, CancellationToken cancellationToken = default)
        {
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse, hearingDetailsResponse);
            await UpdateConferenceAsync(conference, cancellationToken);
        }
 
        public async Task UpdateConferenceAsync(Conference conference, CancellationToken cancellationToken = default)
        {
            await _memoryCache.GetOrCreateAsync(conference.Id, entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(4);
                return Task.FromResult(conference);
            });
        }

        public async Task<Conference> GetOrAddConferenceAsync(Guid id, Func<Task<(ConferenceDetailsResponse, HearingDetailsResponseV2)>> addConferenceDetailsFactory, CancellationToken cancellationToken = default)
        {
            var conference = await Task.FromResult(_memoryCache.Get<Conference>(id));
            if (conference != null) return conference;
            var (conferenceDetails, hearingDetailsResponse) = await addConferenceDetailsFactory();
            await AddConferenceAsync(conferenceDetails, hearingDetailsResponse, cancellationToken);
            conference = await Task.FromResult(_memoryCache.Get<Conference>(id));
            return conference;
        }
        
        public Task RemoveConferenceAsync(Conference conference, CancellationToken cancellationToken = default)
        {
            memoryCache.Remove(conference.Id);
            return Task.CompletedTask;
        }
    }
}
