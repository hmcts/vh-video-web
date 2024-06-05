using System;
using System.Threading.Tasks;
using BookingsApi.Contract.V2.Responses;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public class DistributedConferenceCache : RedisCacheBase<Guid, ConferenceDto>, IConferenceCache
    {
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

        public DistributedConferenceCache(
            IDistributedCache distributedCache, 
            ILogger<RedisCacheBase<Guid, ConferenceDto>> logger) : base(distributedCache, logger)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(4)
            };
        }

        public async Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse, HearingDetailsResponseV2 hearingDetailsResponse)
        {
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse, hearingDetailsResponse);
            await UpdateConferenceAsync(conference);
        }
        
        public Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse)
        {
            throw new NotImplementedException();
        }
        
        public async Task UpdateConferenceAsync(ConferenceDto conferenceDto)
        {
            await WriteToCache(conferenceDto.Id, conferenceDto);
        }

        public async Task<ConferenceDto> GetOrAddConferenceAsync(Guid id, Func<Task<(ConferenceDetailsResponse, HearingDetailsResponseV2)>> addConferenceDetailsFactory)
        {
            var conference = await ReadFromCache(id);

            if (conference != null) return conference;
            var (conferenceResponse, hearingDetailsResponse) = await addConferenceDetailsFactory();
            conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse, hearingDetailsResponse);

            await WriteToCache(id, conference);

            return conference;
        }

        protected override string GetKey(Guid key)
        {
            return key.ToString();
        }
    }
}
