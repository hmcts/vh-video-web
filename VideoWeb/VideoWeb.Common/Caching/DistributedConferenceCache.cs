using System;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Contract.V2.Responses;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public sealed class DistributedConferenceCache : RedisCacheBase<Guid, Conference>, IConferenceCache
    {
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; }

        public DistributedConferenceCache(
            IDistributedCache distributedCache, 
            ILogger<DistributedConferenceCache> logger) : base(distributedCache, logger)
        {
            CacheEntryOptions = new DistributedCacheEntryOptions
            {
                SlidingExpiration = TimeSpan.FromHours(4)
            };
        }

        public async Task AddConferenceAsync(ConferenceDetailsResponse conferenceResponse, HearingDetailsResponseV2 hearingDetailsResponse, CancellationToken cancellationToken = default)
        {
            var conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse, hearingDetailsResponse);
            await UpdateConferenceAsync(conference, cancellationToken);
        }
        
        public async Task UpdateConferenceAsync(Conference conference, CancellationToken cancellationToken = default)
        {
            await WriteToCache(conference.Id, conference, cancellationToken);
        }

        public async Task<Conference> GetOrAddConferenceAsync(Guid id, Func<Task<(ConferenceDetailsResponse, HearingDetailsResponseV2)>> addConferenceDetailsFactory, CancellationToken cancellationToken = default)
        {
            var conference = await ReadFromCache(id, cancellationToken);

            if (conference != null) return conference;
            var (conferenceResponse, hearingDetailsResponse) = await addConferenceDetailsFactory();
            conference = ConferenceCacheMapper.MapConferenceToCacheModel(conferenceResponse, hearingDetailsResponse);

            await WriteToCache(id, conference, cancellationToken);

            return conference;
        }

        protected override string GetKey(Guid key)
        {
            return key.ToString();
        }
    }
}
