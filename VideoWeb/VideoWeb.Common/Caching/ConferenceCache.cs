using System;
using System.Threading.Tasks;
using BookingsApi.Contract.V2.Responses;
using Microsoft.Extensions.Caching.Memory;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public class ConferenceCache(IMemoryCache memoryCache) : IConferenceCache
    {
        public async Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse, HearingDetailsResponseV2 hearingDetailsResponse)
        {
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse, hearingDetailsResponse);
            await UpdateConferenceAsync(conference);
        }
 
        public async Task UpdateConferenceAsync(ConferenceDto conferenceDto)
        {
            await memoryCache.GetOrCreateAsync(conferenceDto.Id, entry =>
            {
                entry.SlidingExpiration = TimeSpan.FromHours(4);
                return Task.FromResult(conferenceDto);
            });
        }

        public async Task<ConferenceDto> GetOrAddConferenceAsync(Guid id, Func<Task<(ConferenceDetailsResponse, HearingDetailsResponseV2)>> addConferenceDetailsFactory)
        {
            var conference = await Task.FromResult(memoryCache.Get<ConferenceDto>(id));
            if (conference != null) return conference;
            var (conferenceDetails, hearingDetailsResponse) = await addConferenceDetailsFactory();
            await AddConferenceAsync(conferenceDetails, hearingDetailsResponse);
            conference = await Task.FromResult(memoryCache.Get<ConferenceDto>(id));
            return conference;
        }
    }
}
