using System;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Newtonsoft.Json;
using VideoWeb.Common.Models;
using VideoApi.Contract.Responses;

namespace VideoWeb.Common.Caching
{
    public class DistributedConferenceCache : RedisCacheBase<Guid, Conference>, IConferenceCache
    {
        public DistributedConferenceCache(IDistributedCache distributedCache) : base(distributedCache)
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
        
        public override string GetKey(Guid key)
        {
            return key.ToString();
        }
    }
}
