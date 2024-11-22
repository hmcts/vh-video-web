using System;
using System.Threading;
using System.Threading.Tasks;
using BookingsApi.Contract.V2.Responses;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Configuration;

namespace VideoWeb.Common.Caching
{
    public sealed class DistributedConferenceCache(
        IDistributedCache distributedCache,
        ILogger<DistributedConferenceCache> logger,
        CacheSettings settings)
        : RedisCacheBase<Guid, Conference>(distributedCache, logger), IConferenceCache
    {
        public override DistributedCacheEntryOptions CacheEntryOptions { get; protected set; } = new()
        {
            SlidingExpiration = TimeSpan.FromHours(settings.CacheDuration),
        };
        
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
        
        public async Task RemoveConferenceAsync(Conference conference, CancellationToken cancellationToken = default)
        {
            await RemoveFromCache(conference.Id, cancellationToken);
        }

        protected override string GetKey(Guid key)
        {
            return key.ToString();
        }
    }
}
