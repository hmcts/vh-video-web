using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;
using ParticipantSummaryResponse = VideoApi.Contract.Responses.ParticipantSummaryResponse;

namespace VideoWeb.Common.Caching
{
    public class DistributedConferenceCache : RedisCacheBase<Guid, Conference>, IConferenceCache
    {
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

        public DistributedConferenceCache(
            IDistributedCache distributedCache, 
            ILogger<RedisCacheBase<Guid, Conference>> logger) : base(distributedCache, logger)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(4)
            };
        }

        public async Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse)
        {
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse);
            await UpdateConferenceAsync(conference);
        }

        public async Task UpdateConferenceAsync(Conference conference)
        {
            await WriteToCache(conference.Id, conference);
        }

        public async Task<Conference> GetOrAddConferenceAsync(Guid id, Func<Task<ConferenceDetailsResponse>> addConferenceDetailsFactory)
        {
            var conference = await ReadFromCache(id);

            if (conference != null) return conference;
            conference = ConferenceCacheMapper.MapConferenceToCacheModel(await addConferenceDetailsFactory());

            await WriteToCache(id, conference);

            return conference;
        }
        
        protected override string GetKey(Guid key)
        {
            return key.ToString();
        }
    }
}
